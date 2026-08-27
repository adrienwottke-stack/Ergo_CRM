"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  addName,
  moveNames,
  restoreLists,
  setPhone,
  setRating,
} from "@/app/(app)/namen/actions";
import {
  NACHFUELL_SCHWELLE,
  NAME_TARGET,
  andereListe,
  listKindLabels,
  nextRating,
  ratingHints,
  ratingLabels,
  ratingPalette,
  targetPercent,
} from "@/lib/namelist";
import { UNDO_WINDOW_SECONDS } from "@/lib/undo-window";
import type { ContactRating, ListKind } from "@/lib/generated/prisma/enums";
import {
  ArrowRightIcon,
  CheckIcon,
  PhoneIcon,
  PlusIcon,
  SparkIcon,
  UndoIcon,
  XIcon,
} from "@/components/icons";
import { card, chip, input } from "@/components/ui";
import Fortschritt from "@/components/Fortschritt";
import { liegtLabel } from "@/lib/liegenbleiber";

export type NameEntry = {
  id: string;
  name: string;
  phone: string | null;
  rating: ContactRating | null;
  listKinds: ListKind[];
  section: "offen" | "geschafft" | "raus";
  lostLabel: string | null;
  appointmentLabel: string | null;
  /** Tage ohne Fortschritt, sobald die Schwelle gerissen ist - sonst null. */
  liegtTage: number | null;
};

// Optimistische Aenderungen: 20 Namen hintereinander eintippen darf nicht auf
// den Server warten, und der Buchstabe muss sofort umspringen.
type Patch =
  | { kind: "add"; name: string; phone: string | null }
  | { kind: "rating"; id: string; rating: ContactRating | null }
  // Umgehaengt oder heruntergenommen: die Zeile gehoert nicht mehr in diesen
  // Reiter und verschwindet sofort. Siebzehn Zeilen, die erst nach dem
  // Server-Rundlauf gehen, sehen aus wie ein Fehlschlag.
  | { kind: "weg"; ids: string[] };

function applyPatch(entries: NameEntry[], patch: Patch): NameEntry[] {
  if (patch.kind === "add") {
    return [
      ...entries,
      {
        id: `neu-${entries.length}-${patch.name}`,
        name: patch.name,
        phone: patch.phone,
        rating: null,
        listKinds: [],
        section: "offen",
        lostLabel: null,
        appointmentLabel: null,
        // Gerade eingetippt - der liegt noch nicht.
        liegtTage: null,
      },
    ];
  }
  if (patch.kind === "weg") {
    const raus = new Set(patch.ids);
    return entries.filter((entry) => !raus.has(entry.id));
  }
  return entries.map((entry) =>
    entry.id === patch.id ? { ...entry, rating: patch.rating } : entry
  );
}

// Eine optimistisch eingefuegte Zeile traegt noch keine echte Id (siehe
// applyPatch) und darf an keine Server-Aktion gehen.
function istEcht(id: string) {
  return !id.startsWith("neu-");
}

/**
 * Was zuletzt umgezogen ist und wie es davor stand.
 *
 * Der Vorher-Stand kommt vom Server zurueck; das Zuruecknehmen setzt ihn genau
 * so wieder. Ein blosses "Gegenteil der Aktion" waere fast richtig - aber ein
 * Name, der auf beiden Listen stand, kaeme mit einer zurueck.
 */
type Rueckgaengig = {
  vorher: Awaited<ReturnType<typeof moveNames>>["vorher"];
  text: string;
};

export default function NameList({
  entries,
  kind,
}: {
  entries: NameEntry[];
  kind: ListKind;
}) {
  const [optimistic, applyOptimistic] = useOptimistic(entries, applyPatch);
  const [, startTransition] = useTransition();
  const [hint, setHint] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [showLost, setShowLost] = useState(false);
  // Auswahlmodus: null = aus. Eine (auch leere) Menge = an.
  const [auswahl, setAuswahl] = useState<Set<string> | null>(null);
  const [rueckgaengig, setRueckgaengig] = useState<Rueckgaengig | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  // Es gibt genau zwei Listen, also ist das Ziel eindeutig. Kein Menue.
  const ziel = andereListe(kind);

  const open = optimistic.filter((entry) => entry.section === "offen");
  const done = optimistic.filter((entry) => entry.section === "geschafft");
  const lost = optimistic.filter((entry) => entry.section === "raus");

  const total = optimistic.length;
  const percent = targetPercent(total);
  const callable = open.filter((entry) => entry.phone).length;
  const liegen = open.filter((entry) => entry.liegtTage !== null).length;
  // Ueber die ganze offene Liste, nicht nur die gefilterte Sicht: der Nachtrag
  // arbeitet ohnehin alle ab.
  const ohneNummer = open.filter((entry) => !entry.phone).length;

  const auswaehlbar = open.filter((entry) => istEcht(entry.id));
  const gewaehlt = auswahl?.size ?? 0;
  const alleGewaehlt = auswaehlbar.length > 0 && gewaehlt === auswaehlbar.length;
  const auswaehlend = auswahl !== null;

  // Der Streifen verschwindet von selbst - dasselbe Fenster wie beim
  // Rueckgaengig der Gespraechsergebnisse, damit es sich gleich anfuehlt.
  useEffect(() => {
    if (!rueckgaengig) return;
    const timer = setTimeout(
      () => setRueckgaengig(null),
      UNDO_WINDOW_SECONDS * 1000
    );
    return () => clearTimeout(timer);
  }, [rueckgaengig]);

  const submitName = () => {
    const name = nameRef.current?.value.trim() ?? "";
    if (!name) return;
    const phone = phoneRef.current?.value.trim() || null;

    const data = new FormData();
    data.set("name", name);
    data.set("listKind", kind);
    if (phone) data.set("phone", phone);

    // Felder sofort leeren und den Fokus behalten – der naechste Name kommt
    // direkt hinterher, ohne auf den Server zu warten.
    if (nameRef.current) nameRef.current.value = "";
    if (phoneRef.current) phoneRef.current.value = "";
    nameRef.current?.focus();
    setHint(null);

    startTransition(async () => {
      applyOptimistic({ kind: "add", name, phone });
      const result = await addName(data);
      if (result.status === "already") {
        setHint(`${result.name} steht schon auf dieser Liste.`);
      } else if (result.status === "linked") {
        setHint(`${result.name} war schon im CRM – jetzt auch auf der Liste.`);
      }
    });
  };

  const cycleRating = (entry: NameEntry) => {
    // Wer sofort auf den Buchstaben tippt, wuerde eine Zeile ohne echte Id an
    // den Server schicken - der findet nichts, und die Einstufung waere still
    // weg. Das Fenster ist kurz, aber es ist genau der Moment, in dem jemand
    // zwanzig Namen hintereinander eintippt.
    if (!istEcht(entry.id)) return;

    const next = nextRating(entry.rating);
    const data = new FormData();
    data.set("contactId", entry.id);
    if (next) data.set("rating", next);

    startTransition(async () => {
      applyOptimistic({ kind: "rating", id: entry.id, rating: next });
      await setRating(data);
    });
  };

  // Der eine Weg fuer alles: einen Namen oder siebzehn, umhaengen oder
  // herunternehmen. `von` faellt weg, `nach` kommt dazu.
  const schieben = (
    ids: string[],
    von: ListKind | null,
    nach: ListKind | null,
    text: string
  ) => {
    const echte = ids.filter(istEcht);
    if (echte.length === 0) return;

    const data = new FormData();
    data.set("ids", echte.join(","));
    if (von) data.set("von", von);
    if (nach) data.set("nach", nach);

    setHint(null);
    setAuswahl(null);
    setRueckgaengig(null);

    startTransition(async () => {
      applyOptimistic({ kind: "weg", ids: echte });
      const ergebnis = await moveNames(data);
      // Hat sich nichts bewegt, gibt es auch nichts zurueckzunehmen - sonst
      // stuende ein Streifen da, dessen Knopf nichts tut.
      if (ergebnis.count > 0) {
        setRueckgaengig({ vorher: ergebnis.vorher, text });
      }
    });
  };

  const zurueck = () => {
    if (!rueckgaengig) return;

    const data = new FormData();
    data.set("vorher", JSON.stringify(rueckgaengig.vorher));

    setRueckgaengig(null);
    startTransition(async () => {
      await restoreLists(data);
    });
  };

  const umschalten = (id: string) => {
    setAuswahl((aktuell) => {
      const naechste = new Set(aktuell ?? []);
      if (naechste.has(id)) naechste.delete(id);
      else naechste.add(id);
      return naechste;
    });
  };

  // Nachfuell-Alarm: nicht die Gesamtzahl zaehlt, sondern was noch zu
  // arbeiten ist. Zwanzig Namen, von denen achtzehn erledigt sind, sind ein
  // leerer Trichter.
  const nachfuellen = total > 0 && open.length < NACHFUELL_SCHWELLE;

  return (
    <div className={`space-y-5 ${auswaehlend ? "pb-24" : ""}`}>
      {nachfuellen && !auswaehlend && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">
            {open.length === 0
              ? "Deine Liste ist leer gearbeitet."
              : `Nur noch ${open.length} ${open.length === 1 ? "offener Name" : "offene Namen"}.`}
          </p>
          <p className="mt-1 text-sm text-amber-800">
            Ohne Nachschub steht die Schleife still. Zehn Fragen, und du hast
            wieder welche.
          </p>
          <Link
            href={`/namen/sammeln?liste=${kind}`}
            className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg bg-fest-warnung px-4 text-sm font-semibold text-white transition hover:bg-fest-warnung-stark"
          >
            <SparkIcon className="h-4 w-4" />
            Namen sammeln
          </Link>
        </div>
      )}

      {/* Fortschritt zum Ziel. 20 ist ein Ziel, keine Grenze – der Balken
          bleibt bei 100 %, weitere Namen sind willkommen. */}
      <div className={`${card} space-y-2 p-4`}>
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold text-ink">
            {total} von {NAME_TARGET} Namen
          </span>
          <span className="text-xs font-medium text-ink-muted">
            {total >= NAME_TARGET ? "Ziel erreicht" : `${percent} %`}
          </span>
        </div>
        <Fortschritt anteil={percent / 100} ton="info" hoehe="duenn" />
      </div>

      {/* Was gerade umgezogen ist, und der Weg zurueck. Bewusst im Fluss der
          Seite statt als schwebender Streifen: der Rueckgaengig-Balken der
          Gespraechsergebnisse sitzt schon unten am Rand, und zwei davon
          uebereinander liest niemand. */}
      {rueckgaengig && (
        <div className="flex items-center gap-3 rounded-xl border border-navy-200 bg-navy-50 py-2 pl-4 pr-2">
          <p className="min-w-0 flex-1 text-sm font-medium text-navy-900">
            {rueckgaengig.text}
          </p>
          <button
            type="button"
            onClick={zurueck}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-navy-700 transition hover:bg-navy-100"
          >
            <UndoIcon className="h-4 w-4" />
            Rückgängig
          </button>
        </div>
      )}

      {/* Schnell-Erfassung: Name breit, Nummer schmal, Enter legt an. */}
      {!auswaehlend && (
        <div className={`${card} space-y-3 p-4`}>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              ref={nameRef}
              type="text"
              autoFocus={entries.length === 0}
              placeholder="Name"
              enterKeyHint="done"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submitName();
                }
              }}
              className={`${input} mt-0 flex-1`}
            />
            <input
              ref={phoneRef}
              type="tel"
              placeholder="Nummer (optional)"
              enterKeyHint="done"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submitName();
                }
              }}
              className={`${input} mt-0 sm:w-48`}
            />
            <button
              type="button"
              onClick={submitName}
              aria-label="Namen hinzufügen"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-akzent px-4 text-sm font-medium text-white transition hover:bg-akzent-stark active:scale-[0.99]"
            >
              <PlusIcon className="h-4 w-4" />
              <span className="sm:hidden">Hinzufügen</span>
            </button>
          </div>
          {hint && <p className="text-xs font-medium text-amber-700">{hint}</p>}
          {/* Der gefuehrte Weg fuer alle, denen nach sechs Namen nichts mehr
              einfaellt - und das sind fast alle. */}
          <Link
            href={`/namen/sammeln?liste=${kind}`}
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-navy-600 transition hover:text-navy-800 hover:underline"
          >
            <SparkIcon className="h-4 w-4" />
            Fällt dir keiner mehr ein? Sammeln starten
          </Link>
        </div>
      )}

      {open.length > 0 && (
        <>
          {/* Hier stand eine Filterleiste nach A/B/C. Sie war ein
              Entscheidungspunkt, den der Nutzer nicht treffen soll
              (docs/audit-kernmodell.md, 1.5 und 10.9): der Durchlauf sortiert
              ohnehin nach Naehe, enger Kreis zuerst. Wer filtern konnte, konnte
              vor allem eines - die unangenehmen Namen wegblenden. */}

          {!auswaehlend && (
            <>
              {/* Ohne Nummer kein Anruf. Frueher stand hier ein toter Knopf
                  ("Erst Nummern eintragen") und der Partner musste sich selbst
                  ausdenken, wie er zwanzig Nummern in die Liste bekommt. Jetzt
                  ist der Satz der Weg. */}
              {callable > 0 ? (
                <Link
                  href={`/namen/anrufen?liste=${kind}`}
                  className="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-fest-erfolg text-base font-semibold text-white transition hover:bg-fest-erfolg-stark active:scale-[0.99]"
                >
                  <PhoneIcon className="h-5 w-5" />
                  Durchlauf starten · {callable}{" "}
                  {callable === 1 ? "Name" : "Namen"}
                </Link>
              ) : (
                <Link
                  href={`/namen/nummern?liste=${kind}`}
                  className="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-akzent text-base font-semibold text-white transition hover:bg-akzent-stark active:scale-[0.99]"
                >
                  <PhoneIcon className="h-5 w-5" />
                  Nummern nachtragen · {ohneNummer}{" "}
                  {ohneNummer === 1 ? "Name" : "Namen"}
                </Link>
              )}

              {callable > 0 && ohneNummer > 0 && (
                <Link
                  href={`/namen/nummern?liste=${kind}`}
                  className="-mt-2 inline-flex min-h-11 items-center justify-center gap-1.5 text-sm font-medium text-navy-600 transition hover:text-navy-800 hover:underline"
                >
                  {ohneNummer} {ohneNummer === 1 ? "Name hat" : "Namen haben"}{" "}
                  noch keine Nummer — nachtragen
                </Link>
              )}

              {/* Zaehlt, was die Plaketten unten einzeln zeigen. Ohne diese
                  Zeile muesste man zwanzig Namen absuchen, um zu merken, dass
                  sechs davon liegen. */}
              {liegen > 0 && (
                <p className="text-sm font-semibold text-red-700">
                  {liegen === 1
                    ? "Ein Name liegt seit Tagen."
                    : `${liegen} Namen liegen seit Tagen.`}{" "}
                  <span className="font-normal text-ink-muted">
                    Anrufen oder von der Liste nehmen.
                  </span>
                </p>
              )}
            </>
          )}

          {/* Der Einstieg ins Umhaengen von vielen. Steht bewusst klein ueber
              der Liste: der Normalfall ist Anrufen, nicht Sortieren. */}
          <div className="flex min-h-11 items-center justify-between gap-3">
            <p className="text-13 font-semibold text-ink-muted">
              {auswaehlend
                ? `${gewaehlt} von ${auswaehlbar.length} ausgewählt`
                : `${open.length} offen`}
            </p>
            {auswaehlend ? (
              <button
                type="button"
                onClick={() =>
                  setAuswahl(
                    alleGewaehlt
                      ? new Set()
                      : new Set(auswaehlbar.map((entry) => entry.id))
                  )
                }
                className="shrink-0 text-13 font-semibold text-navy-600 transition hover:text-navy-800 hover:underline"
              >
                {alleGewaehlt ? "Keinen" : `Alle ${auswaehlbar.length}`}
              </button>
            ) : (
              auswaehlbar.length > 1 && (
                <button
                  type="button"
                  onClick={() => setAuswahl(new Set())}
                  className="shrink-0 text-13 font-semibold text-navy-600 transition hover:text-navy-800 hover:underline"
                >
                  Mehrere verschieben
                </button>
              )
            )}
          </div>

          <ul className="space-y-2">
            {open.map((entry) => (
              <NameRow
                key={entry.id}
                entry={entry}
                ziel={ziel}
                auswaehlend={auswaehlend}
                gewaehlt={auswahl?.has(entry.id) ?? false}
                onToggle={() => umschalten(entry.id)}
                onCycleRating={() => cycleRating(entry)}
                onMove={() =>
                  schieben(
                    [entry.id],
                    kind,
                    ziel,
                    `${entry.name} steht jetzt auf ${listKindLabels[ziel]}.`
                  )
                }
                onDrop={() =>
                  schieben(
                    [entry.id],
                    kind,
                    null,
                    `${entry.name} ist von der Liste.`
                  )
                }
              />
            ))}
          </ul>
        </>
      )}

      {open.length === 0 && total === 0 && (
        <div className={`${card} px-6 py-12 text-center`}>
          <p className="text-sm font-medium text-ink">
            Noch keine Namen auf der Liste
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">
            Schreib erst alle Namen auf, die dir einfallen – einstufen und
            anrufen kommt danach. Wer beim Sammeln über Details nachdenkt,
            kommt nicht auf {NAME_TARGET}.
          </p>
          <Link
            href={`/namen/sammeln?liste=${kind}`}
            className="mt-5 inline-flex min-h-14 items-center gap-2 rounded-xl bg-akzent px-6 text-base font-semibold text-white transition hover:bg-akzent-stark"
          >
            <SparkIcon className="h-5 w-5" />
            Geführt sammeln
          </Link>
        </div>
      )}

      {done.length > 0 && !auswaehlend && (
        <div className={`${card} overflow-hidden`}>
          <button
            type="button"
            onClick={() => setShowDone((value) => !value)}
            className="flex min-h-14 w-full items-center justify-between px-4 text-left"
          >
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
              <CheckIcon className="h-4 w-4" />
              Geschafft · {done.length}
            </span>
            <span className="text-xs text-ink-soft">
              {showDone ? "Zuklappen" : "Anzeigen"}
            </span>
          </button>
          {showDone && (
            <ul className="divide-y divide-line border-t border-line">
              {done.map((entry) => (
                <li key={entry.id}>
                  <Link
                    href={`/contacts/${entry.id}`}
                    className="flex min-h-14 items-center justify-between gap-3 px-4 hover:bg-emerald-50/40"
                  >
                    <span className="text-sm font-medium text-ink">
                      {entry.name}
                    </span>
                    <span className="shrink-0 text-xs text-ink-muted">
                      {entry.appointmentLabel ?? "im CRM"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {lost.length > 0 && !auswaehlend && (
        <div className={`${card} overflow-hidden`}>
          <button
            type="button"
            onClick={() => setShowLost((value) => !value)}
            className="flex min-h-14 w-full items-center justify-between px-4 text-left"
          >
            <span className="text-sm font-semibold text-ink-muted">
              Raus · {lost.length}
            </span>
            <span className="text-xs text-ink-soft">
              {showLost ? "Zuklappen" : "Anzeigen"}
            </span>
          </button>
          {showLost && (
            <ul className="divide-y divide-line border-t border-line">
              {lost.map((entry) => (
                <li
                  key={entry.id}
                  className="flex min-h-14 items-center justify-between gap-3 px-4"
                >
                  <span className="text-sm text-ink-muted">{entry.name}</span>
                  <span className="shrink-0 text-xs text-ink-soft">
                    {entry.lostLabel ?? "–"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Die Leiste des Auswahlmodus. Liegt am Daumen, nicht am Kopf der
          Seite - bei siebzehn Namen scrollt man beim Auswaehlen nach unten. */}
      {auswaehlend && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4">
          {/* Kein "buehne" mehr, dieselbe Mechanik wie die Undo-Leiste
              (components/UndoBar.tsx): dauerhaft dunkles Glas statt einer
              satten Navy-Flaeche, deshalb feste helle Textfarben statt der
              Tokens "ink"/"ink-soft" - die wuerden im Hellmodus dunkel und
              auf der dunklen Pille verschwinden. */}
          <div className="glas-dunkel pointer-events-auto flex w-full max-w-md items-center gap-2 rounded-full py-2 pl-3 pr-2 text-white schatten-pop">
            <button
              type="button"
              disabled={gewaehlt === 0}
              onClick={() =>
                schieben(
                  [...(auswahl ?? [])],
                  kind,
                  ziel,
                  `${gewaehlt} ${gewaehlt === 1 ? "Name steht" : "Namen stehen"} jetzt auf ${listKindLabels[ziel]}.`
                )
              }
              // Feste helle Akzentfarbe statt des Tokens "akzent" - dieselbe
              // Begruendung wie beim Aktionsknopf der Undo-Leiste.
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold text-[#6cb2ff] transition hover:bg-white/10 disabled:opacity-40"
            >
              <ArrowRightIcon className="h-4 w-4" />
              {listKindLabels[ziel]}
            </button>
            <button
              type="button"
              disabled={gewaehlt === 0}
              onClick={() =>
                schieben(
                  [...(auswahl ?? [])],
                  kind,
                  null,
                  `${gewaehlt} ${gewaehlt === 1 ? "Name ist" : "Namen sind"} von der Liste.`
                )
              }
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full px-3 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
            >
              Von der Liste
            </button>
            <button
              type="button"
              onClick={() => setAuswahl(null)}
              aria-label="Auswahl beenden"
              className="inline-flex min-h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <XIcon className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Eine Zeile -------------------------------------------------------------

function NameRow({
  entry,
  ziel,
  auswaehlend,
  gewaehlt,
  onCycleRating,
  onToggle,
  onMove,
  onDrop,
}: {
  entry: NameEntry;
  /** Die andere Liste - Beschriftung des Schiebe-Knopfes. */
  ziel: ListKind;
  auswaehlend: boolean;
  gewaehlt: boolean;
  onCycleRating: () => void;
  onToggle: () => void;
  onMove: () => void;
  onDrop: () => void;
}) {
  const [, startTransition] = useTransition();
  const [editingPhone, setEditingPhone] = useState(false);
  const palette = entry.rating ? ratingPalette[entry.rating] : null;

  const savePhone = (value: string) => {
    setEditingPhone(false);
    const trimmed = value.trim();
    if (!trimmed) return;
    const data = new FormData();
    data.set("contactId", entry.id);
    data.set("phone", trimmed);
    startTransition(() => {
      void setPhone(data);
    });
  };

  // Im Auswahlmodus ist die ganze Zeile der Knopf: bei siebzehn Namen trifft
  // niemand siebzehnmal ein Kaestchen von zwanzig Pixeln.
  if (auswaehlend) {
    return (
      <li>
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={gewaehlt}
          className={`${card} flex min-h-16 w-full items-center gap-3 p-3 text-left transition ${
            gewaehlt ? "ring-2 ring-akzent" : ""
          }`}
        >
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-semibold ${
              gewaehlt
                ? "bg-akzent text-white"
                : "border border-dashed border-line-strong text-ink-soft"
            }`}
          >
            {gewaehlt ? <CheckIcon className="h-5 w-5" /> : (entry.rating ?? "–")}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-ink">
              {entry.name}
            </span>
            {entry.phone && (
              <span className="block truncate text-sm text-ink-muted">
                {entry.phone}
              </span>
            )}
          </span>
        </button>
      </li>
    );
  }

  return (
    <li className={`${card} flex min-h-16 items-center gap-2 p-3`}>
      {/* Ein Tipp zykelt – → A → B → C → –. Kein Menü, kein Dialog. */}
      <button
        type="button"
        onClick={onCycleRating}
        aria-label={
          entry.rating
            ? `Einstufung ${entry.rating} (${ratingLabels[entry.rating]}) ändern`
            : "Einstufen"
        }
        title={entry.rating ? ratingHints[entry.rating] : "Einstufen"}
        className={`mr-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-semibold transition active:scale-95 ${
          palette
            ? palette.chip
            : "border border-dashed border-line-strong text-ink-soft hover:border-line-strong hover:text-ink-muted"
        }`}
      >
        {entry.rating ?? "–"}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-ink">
            {entry.name}
          </p>
          {/* Die Plakette statt einer Umsortierung: die Liste bleibt in
              Eingabe-Reihenfolge, damit beim Einstufen keine Zeile unter dem
              Finger wegspringt. */}
          {entry.liegtTage !== null && (
            <span className={`${chip("gefahr")} shrink-0`}>
              {liegtLabel(entry.liegtTage)}
            </span>
          )}
        </div>
        {editingPhone ? (
          <input
            type="tel"
            autoFocus
            defaultValue={entry.phone ?? ""}
            placeholder="Nummer"
            enterKeyHint="done"
            onBlur={(event) => savePhone(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                savePhone(event.currentTarget.value);
              }
              if (event.key === "Escape") setEditingPhone(false);
            }}
            className="mt-1 w-full max-w-48 rounded-md border border-line-strong px-2 py-1 text-sm"
          />
        ) : entry.phone ? (
          <p className="truncate text-sm text-ink-muted">{entry.phone}</p>
        ) : (
          <button
            type="button"
            onClick={() => setEditingPhone(true)}
            className="text-sm font-medium text-navy-600 hover:underline"
          >
            + Nummer
          </button>
        )}
      </div>

      {/* Ein Tipp haengt den Namen um. Das Ziel steht dran, weil ein blosser
          Pfeil nicht sagt, wohin. */}
      <button
        type="button"
        onClick={onMove}
        aria-label={`${entry.name} auf die Liste ${listKindLabels[ziel]} schieben`}
        title={`Auf ${listKindLabels[ziel]} schieben`}
        className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-ink-muted transition hover:bg-navy-50 hover:text-navy-700"
      >
        <ArrowRightIcon className="h-3.5 w-3.5" />
        {listKindLabels[ziel]}
      </button>

      <button
        type="button"
        onClick={onDrop}
        aria-label={`${entry.name} von der Liste nehmen`}
        title="Von der Liste nehmen (Kontakt bleibt erhalten)"
        className="flex h-11 w-8 shrink-0 items-center justify-center rounded-lg text-ink-soft transition hover:bg-sunken hover:text-ink-muted"
      >
        <XIcon className="h-4.5 w-4.5" />
      </button>
    </li>
  );
}
