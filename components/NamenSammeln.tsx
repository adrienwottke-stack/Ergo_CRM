"use client";

// Die gefuehrte Namenssammlung: Szene fuer Szene statt leeres Feld.
//
// Der Ablauf ist bewusst eine Einbahnstrasse mit einem einzigen Bedienelement
// (Feld + Enter). Alles, was hier nach Entscheidung aussieht - einstufen,
// Nummer nachtragen, Liste waehlen - passiert danach auf /namen. Wer beim
// Sammeln nachdenkt, kommt nicht auf zwanzig.
//
// Geschrieben wird ueber dieselbe Server-Action wie die Schnellerfassung
// (addName). Kein zweiter Weg in die Datenbank, der eigene Fehler machen kann.

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { addName } from "@/app/(app)/namen/actions";
import { STUETZEN, STUETZEN_ANZAHL } from "@/lib/gedaechtnisstuetzen";
import { NAME_TARGET, listKindLabels } from "@/lib/namelist";
import type { ListKind } from "@/lib/generated/prisma/enums";
import { ArrowLeftIcon, CheckIcon, PlusIcon } from "@/components/icons";
import { btnPrimary, card, input } from "@/components/ui";

export default function NamenSammeln({
  kind,
  vorhanden,
}: {
  kind: ListKind;
  /** Namen, die schon auf dieser Liste stehen. */
  vorhanden: number;
}) {
  const [stufe, setStufe] = useState(0);
  // Je Szene die Namen, die gerade dazugekommen sind - als sichtbarer Ertrag.
  const [gesammelt, setGesammelt] = useState<string[][]>(
    STUETZEN.map(() => [])
  );
  const [hinweis, setHinweis] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const feldRef = useRef<HTMLInputElement>(null);

  const fertig = stufe >= STUETZEN_ANZAHL;
  const stuetze = fertig ? null : STUETZEN[stufe]!;
  const neueNamen = gesammelt.flat();
  const gesamt = vorhanden + neueNamen.length;

  const eintragen = () => {
    const name = feldRef.current?.value.trim() ?? "";
    if (!name || !stuetze) return;

    if (feldRef.current) feldRef.current.value = "";
    feldRef.current?.focus();
    setHinweis(null);

    // Sofort anzeigen, Server hinterher: zwanzig Namen hintereinander duerfen
    // nicht auf die Datenbank warten.
    setGesammelt((alt) =>
      alt.map((namen, index) => (index === stufe ? [...namen, name] : namen))
    );

    const data = new FormData();
    data.set("name", name);
    data.set("listKind", kind);

    startTransition(async () => {
      const ergebnis = await addName(data);
      if (ergebnis.status === "already") {
        setHinweis(`${ergebnis.name} steht schon auf der Liste.`);
      }
    });
  };

  if (fertig) {
    return (
      <div className={`${card} flex flex-col items-center px-6 py-12 text-center`}>
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckIcon className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-slate-900">
          {neueNamen.length === 0
            ? "Keine neuen Namen"
            : `${neueNamen.length} ${neueNamen.length === 1 ? "Name" : "Namen"} dazu`}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {gesamt >= NAME_TARGET
            ? `Damit stehen ${gesamt} auf deiner Liste. Das reicht zum Loslegen.`
            : `Damit stehen ${gesamt} von ${NAME_TARGET} auf deiner Liste.`}
        </p>
        <Link href={`/namen?liste=${kind}`} className={`${btnPrimary} mt-6`}>
          Zur Namensliste
        </Link>
        {gesamt < NAME_TARGET && (
          <button
            type="button"
            onClick={() => {
              setGesammelt(STUETZEN.map(() => []));
              setStufe(0);
            }}
            className="mt-3 min-h-11 text-sm font-medium text-slate-500 hover:text-navy-700 hover:underline"
          >
            Noch eine Runde
          </button>
        )}
      </div>
    );
  }

  const dieseRunde = gesammelt[stufe] ?? [];

  return (
    <div className="space-y-5">
      {/* Fortschritt: er soll sehen, dass das hier endlich ist. */}
      <div>
        <div className="flex items-baseline justify-between text-xs font-medium text-slate-500">
          <span>
            Szene {stufe + 1} von {STUETZEN_ANZAHL}
          </span>
          <span>
            {gesamt} von {NAME_TARGET} Namen
          </span>
        </div>
        <div className="mt-1.5 h-[3px] w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-navy-700 transition-all duration-300"
            style={{ width: `${Math.round(((stufe + 1) / STUETZEN_ANZAHL) * 100)}%` }}
          />
        </div>
      </div>

      <div className={`${card} space-y-4 p-5`}>
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.01em] text-slate-900">
            {stuetze!.titel}
          </h2>
          <ul className="mt-3 space-y-1.5">
            {stuetze!.fragen.map((frage) => (
              <li key={frage} className="flex gap-2 text-sm text-slate-600">
                <span aria-hidden className="text-slate-300">
                  —
                </span>
                {frage}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-2">
          <input
            ref={feldRef}
            type="text"
            autoFocus
            placeholder="Name"
            enterKeyHint="done"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                eintragen();
              }
            }}
            className={`${input} mt-0 flex-1`}
          />
          <button
            type="button"
            onClick={eintragen}
            aria-label="Namen hinzufügen"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-navy-900 px-4 text-white transition hover:bg-navy-950 active:scale-[0.99]"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>
        {hinweis && <p className="text-xs font-medium text-amber-700">{hinweis}</p>}

        {dieseRunde.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
            {dieseRunde.map((name, index) => (
              <span
                key={`${name}-${index}`}
                className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800"
              >
                {name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {stufe > 0 && (
          <button
            type="button"
            onClick={() => setStufe((wert) => wert - 1)}
            aria-label="Eine Szene zurück"
            className="inline-flex min-h-14 items-center justify-center rounded-xl px-3 text-slate-400 transition hover:text-slate-700"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => setStufe((wert) => wert + 1)}
          className="flex min-h-14 flex-1 items-center justify-center rounded-xl bg-navy-900 text-base font-semibold text-white transition hover:bg-navy-950 active:scale-[0.99]"
        >
          {dieseRunde.length > 0 ? "Weiter" : "Fällt mir keiner ein"}
        </button>
      </div>

      <p className="text-center text-xs text-slate-400">
        Nummern und Einstufung kommen später auf der Liste ·{" "}
        {listKindLabels[kind]}
      </p>
    </div>
  );
}
