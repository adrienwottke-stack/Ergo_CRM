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
import { addName, moveNames } from "@/app/(app)/namen/actions";
import { STUETZEN, STUETZEN_ANZAHL } from "@/lib/gedaechtnisstuetzen";
import {
  NAME_TARGET,
  andereListe,
  listKindHints,
  listKindLabels,
  listKindListLabels,
} from "@/lib/namelist";
import type { ListKind } from "@/lib/generated/prisma/enums";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  PhoneIcon,
  PlusIcon,
} from "@/components/icons";
import { btnPrimary, card, input, kicker } from "@/components/ui";
import Fortschritt from "@/components/Fortschritt";

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
  // Die Kontakte dieser Runde. Nur damit laesst sich am Ende "alle umhaengen"
  // anbieten - ein Name allein ist kein Griff, an dem der Server etwas findet.
  // Bewusst ohne die, die schon auf der Liste standen ("already"): die hat
  // diese Runde nicht angelegt, also zieht sie sie auch nicht mit um.
  const [ids, setIds] = useState<string[]>([]);
  // Wohin die Namen dieser Runde am Ende gehoeren. null = unveraendert auf
  // `kind`. Ein Zustand fuer beide Richtungen, damit der Knopf am Abschluss
  // immer nur "in die andere Liste" heisst - und der Weg zurueck derselbe ist.
  const [verschoben, setVerschoben] = useState<ListKind | null>(null);
  const [pending, startTransition] = useTransition();
  const feldRef = useRef<HTMLInputElement>(null);

  // Eingefroren beim Betreten. addName laesst den Server neu rechnen, und der
  // liefert `vorhanden` dann INKLUSIVE der gerade gesammelten Namen - waehrend
  // `gesammelt` sie ebenfalls zaehlt. Ohne das Einfrieren stand nach drei
  // Namen "6 von 20" da, und zwar schon im Fortschritt waehrend des Sammelns.
  const [basis] = useState(vorhanden);

  const fertig = stufe >= STUETZEN_ANZAHL;
  const stuetze = fertig ? null : STUETZEN[stufe]!;
  const neueNamen = gesammelt.flat();
  const gesamt = basis + neueNamen.length;

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
        return;
      }
      setIds((alt) => [...alt, ergebnis.id]);
    });
  };

  // Auf welcher Liste die Namen dieser Runde liegen, und wohin ein Umhaengen
  // ginge. Waehrend des Sammelns ist das immer `kind`; erst der Abschluss
  // kann daran etwas aendern.
  const liste = verschoben ?? kind;
  const ziel = andereListe(liste);

  // Der ganze Stapel auf einmal. Es gibt genau zwei Listen, also ist das Ziel
  // eindeutig und braucht kein Menue (docs/audit-kernmodell.md, 1.5).
  const umhaengen = () => {
    if (ids.length === 0) return;

    const data = new FormData();
    data.set("ids", ids.join(","));
    data.set("von", liste);
    data.set("nach", ziel);

    // Sofort umschalten, Server hinterher - dasselbe Muster wie beim Eintragen.
    setVerschoben(ziel === kind ? null : ziel);
    startTransition(async () => {
      await moveNames(data);
    });
  };

  if (fertig) {
    return (
      <div className={`${card} flex flex-col items-center px-6 py-12 text-center`}>
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckIcon className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-ink">
          {neueNamen.length === 0
            ? "Keine neuen Namen"
            : `${neueNamen.length} ${neueNamen.length === 1 ? "Name" : "Namen"} dazu`}
        </h2>
        {/* Die Liste gehoert in den Satz, den er ohnehin liest. Vorher stand
            hier "auf deiner Liste" - welche, sagte diese Seite nie.

            Nach einem Umhaengen bleibt der Gesamtstand weg: `gesamt` zaehlt die
            Liste, auf der gesammelt wurde. Wie viele auf der anderen schon
            liegen, weiss diese Seite nicht - und eine geratene Zahl ist
            schlimmer als keine. */}
        <p className="mt-1 text-sm text-ink-muted">
          {verschoben
            ? `Sie liegen jetzt auf deiner ${listKindListLabels[liste]}.`
            : neueNamen.length === 0
              ? `Auf deiner ${listKindListLabels[liste]} stehen ${gesamt} von ${NAME_TARGET}.`
              : gesamt >= NAME_TARGET
                ? `Sie stehen auf deiner ${listKindListLabels[liste]} — damit sind es ${gesamt}. Das reicht zum Loslegen.`
                : `Sie stehen auf deiner ${listKindListLabels[liste]} — damit sind es ${gesamt} von ${NAME_TARGET}.`}
        </p>

        {/* Ohne Nummer kein Anruf: die frisch gesammelten Namen haben noch
            keine. Hier endete die Kette frueher - der naechste Schritt stand
            nirgends, und auf der Liste wartete ein toter Knopf. */}
        {neueNamen.length > 0 ? (
          <>
            <Link
              href={`/namen/nummern?liste=${liste}`}
              className={`${btnPrimary} mt-6`}
            >
              <PhoneIcon className="h-4 w-4" />
              Nummern nachtragen
            </Link>
            <p className="mt-2 max-w-xs text-xs text-ink-soft">
              Ohne Nummer kein Anruf. Geht am schnellsten am Stück — ein Name,
              ein Feld.
            </p>
          </>
        ) : (
          <Link href={`/namen?liste=${liste}`} className={`${btnPrimary} mt-6`}>
            Zur Namensliste
          </Link>
        )}

        {/* Der Ausweg genau dort, wo der Fehler auffaellt. Auf der Liste selbst
            gibt es das Umhaengen laengst - nur kommt dort nicht an, wer eben
            zwanzig Namen in den falschen Reiter getippt hat. */}
        {ids.length > 0 && (
          <div className="mt-6 w-full rounded-lg bg-sunken px-4 py-3 text-left">
            <p className="text-13 text-ink-muted">
              {verschoben
                ? "Umgehängt. Hier ist der Weg zurück, falls es doch die andere war."
                : `Falsche Liste? Die ${ids.length} Namen dieser Runde ziehen in einem Zug um.`}
            </p>
            <button
              type="button"
              onClick={umhaengen}
              disabled={pending}
              className="mt-1 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-navy-700 transition hover:text-navy-900 disabled:opacity-40"
            >
              <ArrowRightIcon className="h-4 w-4" />
              {verschoben
                ? `Doch zurück nach ${listKindLabels[ziel]}`
                : `Alle ${ids.length} nach ${listKindLabels[ziel]}`}
            </button>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4">
          {verschoben && (
            <Link
              href={`/namen/sammeln?liste=${liste}`}
              className="min-h-11 text-sm font-medium text-ink-muted hover:text-navy-700 hover:underline"
            >
              Weiter sammeln
            </Link>
          )}
          {gesamt < NAME_TARGET && !verschoben && (
            <button
              type="button"
              onClick={() => {
                setGesammelt(STUETZEN.map(() => []));
                setIds([]);
                setStufe(0);
              }}
              className="min-h-11 text-sm font-medium text-ink-muted hover:text-navy-700 hover:underline"
            >
              Noch eine Runde
            </button>
          )}
          {neueNamen.length > 0 && (
            <Link
              href={`/namen?liste=${liste}`}
              className="min-h-11 text-sm font-medium text-ink-muted hover:text-navy-700 hover:underline"
            >
              Zur Namensliste
            </Link>
          )}
        </div>
      </div>
    );
  }

  const dieseRunde = gesammelt[stufe] ?? [];

  return (
    <div className="space-y-5">
      {/* Fortschritt: er soll sehen, dass das hier endlich ist. */}
      <div>
        <div className="flex items-baseline justify-between text-xs font-medium text-ink-muted">
          <span>
            Szene {stufe + 1} von {STUETZEN_ANZAHL}
          </span>
          <span>
            {gesamt} von {NAME_TARGET} Namen
          </span>
        </div>
        <Fortschritt
          anteil={(stufe + 1) / STUETZEN_ANZAHL}
          ton="info"
          hoehe="duenn"
          className="mt-1.5"
        />
      </div>

      <div className={`${card} space-y-4 p-5`}>
        {/* Welche Liste hier gefuellt wird - an der Eingabe, nicht als graue
            Fussnote am Seitenende. Die zehn Szenen sind fuer beide Listen
            dieselben ("Familie", "Verein", "Nachbarn"); ohne diese Zeile liest
            sich der ganze Ablauf wie "schreib alle auf, die du kennst". Genau
            so landen Kundennamen in der Recruiting-Liste. */}
        <div className="flex items-start justify-between gap-3 border-b border-line pb-3">
          <div className="min-w-0">
            <p className={kicker}>{listKindListLabels[kind]}</p>
            <p className="mt-0.5 text-13 font-medium text-ink-muted">
              {listKindHints[kind]}
            </p>
          </div>
          {/* Der Wechsel steht nur da, solange die Runde leer ist. Wer schon
              getippt hat, soll nicht die Liste unter seinen Namen wegziehen -
              fuer den ist das Umhaengen am Ende der richtige Weg. */}
          {neueNamen.length === 0 && (
            <Link
              href={`/namen/sammeln?liste=${andereListe(kind)}`}
              className="shrink-0 text-13 font-medium text-navy-700 transition hover:text-navy-900 hover:underline"
            >
              Wechseln
            </Link>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold tracking-[-0.01em] text-ink">
            {stuetze!.titel}
          </h2>
          <ul className="mt-3 space-y-1.5">
            {stuetze!.fragen.map((frage) => (
              <li key={frage} className="flex gap-2 text-sm text-ink-muted">
                <span aria-hidden className="text-ink-soft">
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
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-akzent px-4 text-white transition hover:bg-akzent-stark active:scale-[0.99]"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>
        {hinweis && <p className="text-xs font-medium text-amber-700">{hinweis}</p>}

        {dieseRunde.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-t border-line pt-3">
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
            className="inline-flex min-h-14 items-center justify-center rounded-xl px-3 text-ink-soft transition hover:text-ink-muted"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => setStufe((wert) => wert + 1)}
          className="flex min-h-14 flex-1 items-center justify-center rounded-xl bg-akzent text-base font-semibold text-white transition hover:bg-akzent-stark active:scale-[0.99]"
        >
          {dieseRunde.length > 0 ? "Weiter" : "Fällt mir keiner ein"}
        </button>
      </div>

      <p className="text-center text-xs text-ink-soft">
        Nummern und Einstufung kommen später auf der Liste
      </p>
    </div>
  );
}
