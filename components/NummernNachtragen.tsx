"use client";

// Nummern nachtragen: ein Name je Karte, ein Feld, Enter geht weiter.
//
// Gebaut wie NamenSammeln und aus demselben Grund: der Partner soll in einen
// Rhythmus kommen, nicht auf einer Liste herumtippen. Zwanzig Zeilen mit je
// einem winzigen "+ Nummer" sind zwanzig Entscheidungen, wo eine Abfolge
// hingehoert.
//
// Geschrieben wird ueber setPhone - dieselbe Server-Action, die auch die Liste
// benutzt. Kein zweiter Weg in die Datenbank, der eigene Fehler machen kann.

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { setPhone } from "@/app/(app)/namen/actions";
import { ratingLabels, ratingPalette } from "@/lib/namelist";
import type { ContactRating, ListKind } from "@/lib/generated/prisma/enums";
import { ArrowRightIcon, CheckIcon, PhoneIcon } from "@/components/icons";
import { btnPrimary, btnSecondary, card, input } from "@/components/ui";
import Fortschritt from "@/components/Fortschritt";

export type NummerEintrag = {
  id: string;
  name: string;
  rating: ContactRating | null;
  /** "Empfehlung von Max" - hilft beim Erinnern, wer das ueberhaupt ist. */
  herkunft: string | null;
};

export default function NummernNachtragen({
  queue,
  kind,
  schonAnrufbar,
}: {
  queue: NummerEintrag[];
  kind: ListKind;
  /** Namen, die bereits eine Nummer haben - fuer den Knopf am Ende. */
  schonAnrufbar: number;
}) {
  // Eingefroren wie im Durchlauf: der Server laedt nach jedem Speichern neu,
  // der erledigte Name faellt heraus - ohne Kopie wuerde die Karte unter dem
  // Finger verrutschen.
  const [items] = useState(queue);
  const [index, setIndex] = useState(0);
  const [erfasst, setErfasst] = useState(0);
  // Aus demselben Grund eingefroren wie die Warteschlange: setPhone laesst den
  // Server neu rechnen, danach zaehlt `schonAnrufbar` die gerade eingetragenen
  // Nummern MIT - und `erfasst` zaehlt sie ein zweites Mal.
  const [basisAnrufbar] = useState(schonAnrufbar);
  const [, startTransition] = useTransition();
  const feldRef = useRef<HTMLInputElement>(null);

  const aktuell = items[index];

  const weiter = () => {
    if (feldRef.current) feldRef.current.value = "";
    setIndex((wert) => wert + 1);
    // Der Fokus muss nach dem Neurendern gesetzt werden, sonst greift er ins
    // alte Feld. autoFocus allein reicht nicht: das Element bleibt dasselbe.
    requestAnimationFrame(() => feldRef.current?.focus());
  };

  const speichern = () => {
    const nummer = feldRef.current?.value.trim() ?? "";
    if (!nummer || !aktuell) {
      weiter();
      return;
    }

    setErfasst((wert) => wert + 1);
    const data = new FormData();
    data.set("contactId", aktuell.id);
    data.set("phone", nummer);
    // Sofort weiter, Server hinterher: zwanzig Nummern hintereinander duerfen
    // nicht auf die Datenbank warten.
    startTransition(async () => {
      await setPhone(data);
    });
    weiter();
  };

  // --- Fertig ---------------------------------------------------------------

  const anrufbar = basisAnrufbar + erfasst;

  if (!aktuell) {
    return (
      <div className={`${card} flex flex-col items-center px-6 py-12 text-center`}>
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckIcon className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-ink">
          {items.length === 0
            ? "Alle Namen haben eine Nummer"
            : `${erfasst} ${erfasst === 1 ? "Nummer" : "Nummern"} eingetragen`}
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          {anrufbar > 0
            ? `${anrufbar} ${anrufbar === 1 ? "Name ist" : "Namen sind"} jetzt anrufbar.`
            : "Ohne Nummer geht kein Durchlauf. Schau in dein Handy — Kontakte, WhatsApp, Anrufliste."}
        </p>

        {anrufbar > 0 ? (
          <Link href={`/namen/anrufen?liste=${kind}`} className={`${btnPrimary} mt-6`}>
            <PhoneIcon className="h-4 w-4" />
            Durchlauf starten
          </Link>
        ) : (
          <Link href={`/namen?liste=${kind}`} className={`${btnPrimary} mt-6`}>
            Zur Namensliste
          </Link>
        )}

        {anrufbar > 0 && (
          <Link
            href={`/namen?liste=${kind}`}
            className="mt-3 min-h-11 text-sm font-medium text-ink-muted hover:text-navy-700 hover:underline"
          >
            Später — zur Liste
          </Link>
        )}
      </div>
    );
  }

  // --- Eine Karte je Name ---------------------------------------------------

  const palette = aktuell.rating ? ratingPalette[aktuell.rating] : null;
  const percent = Math.round((index / items.length) * 100);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-baseline justify-between text-xs font-medium text-ink-muted">
          <span>
            Name {index + 1} von {items.length}
          </span>
          <span className="tabular-nums">
            {erfasst} {erfasst === 1 ? "Nummer" : "Nummern"}
          </span>
        </div>
        <Fortschritt anteil={percent / 100} ton="info" hoehe="duenn" className="mt-1.5" />
      </div>

      <div className={`${card} space-y-4 p-5`}>
        <div className="flex items-start gap-3">
          {palette && (
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-semibold ${palette.chip}`}
            >
              {aktuell.rating}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-semibold leading-tight tracking-tight text-ink">
              {aktuell.name}
            </h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              {aktuell.herkunft ??
                (aktuell.rating ? ratingLabels[aktuell.rating] : "Nicht eingestuft")}
            </p>
          </div>
        </div>

        <div>
          {/* type=tel plus inputMode: am Handy kommt die Zifferntastatur hoch,
              nicht die Buchstaben. */}
          <input
            ref={feldRef}
            type="tel"
            inputMode="tel"
            autoComplete="off"
            autoFocus
            placeholder="Telefonnummer"
            enterKeyHint="next"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                speichern();
              }
            }}
            className={`${input} mt-0 text-lg tabular-nums`}
          />
          <p className="mt-2 text-xs text-ink-soft">
            Aus deinem Handy: Kontakte, WhatsApp, Anrufliste.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={weiter}
          className={`${btnSecondary} min-h-14 shrink-0`}
        >
          Hab ich nicht
        </button>
        <button
          type="button"
          onClick={speichern}
          className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-akzent text-base font-semibold text-white transition hover:bg-akzent-stark active:scale-[0.99]"
        >
          Weiter
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      </div>

      <p className="text-center text-xs text-ink-soft">
        Übersprungene Namen bleiben auf der Liste — nur eben ohne Anruf.
      </p>
    </div>
  );
}
