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
import { card, input } from "@/components/ui";
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
  const [showAdd, setShowAdd] = useState(false);
  // Auswahlmodus: null = aus. Eine (auch leere) Menge = an.
  const [auswahl, setAuswahl] = useState<Set<string> | null>(null);
  const [rueckgaengig, setRueckgaengig] = useState<Rueckgaengig | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showAdd) nameRef.current?.focus();
  }, [showAdd]);

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
    <div className={`space-y-6 ${auswaehlend ? "pb-32" : ""}`}>
      {!auswaehlend && (
        <section aria-label="Nächster Schritt" className="space-y-4">
          {open.length === 0 ? (
            <>
              <div>
                <h2 className="text-xl font-semibold text-ink">
                  {total === 0 ? "Mit Namen beginnt dein Geschäft." : "Bereit für neue Kontakte."}
                </h2>
                <p className="mt-2 text-base text-ink-muted">
                  {total === 0
                    ? "Sammle zuerst die Menschen, die du kennst. Nummern und nächste Schritte ergänzen wir danach."
                    : "Die offenen Namen sind bearbeitet. Sammle die nächsten Menschen, die du ansprechen möchtest."}
                </p>
              </div>
              <Link href={`/namen/sammeln?liste=${kind}`} className="crm-primary-action">
                <SparkIcon className="h-5 w-5" />
                Namen sammeln
              </Link>
            </>
          ) : callable > 0 ? (
            <Link href={`/namen/anrufen?liste=${kind}`} className="crm-primary-action">
              <PhoneIcon className="h-5 w-5" />
              <span>Anrufe starten <span className="ml-1 font-normal">· {callable}</span></span>
            </Link>
          ) : (
            <>
              <p className="text-base text-ink-muted">Ergänze eine Nummer, dann kannst du mit dem ersten Anruf starten.</p>
              <Link href={`/namen/nummern?liste=${kind}`} className="crm-primary-action">
                <PhoneIcon className="h-5 w-5" />
                Nummern ergänzen · {ohneNummer}
              </Link>
            </>
          )}

          <div className={`grid gap-2 ${callable > 0 && ohneNummer > 0 ? "sm:grid-cols-2" : ""}`}>
            <button
              type="button"
              onClick={() => setShowAdd((value) => !value)}
              aria-expanded={showAdd}
              aria-controls="namen-schnellerfassung"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface px-4 py-3 text-base font-medium text-ink"
            >
              {showAdd ? <XIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
              {showAdd ? "Eingabe schließen" : "Name hinzufügen"}
            </button>
            {callable > 0 && ohneNummer > 0 && (
              <Link href={`/namen/nummern?liste=${kind}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface px-4 py-3 text-base font-medium text-ink">
                Nummern ergänzen · {ohneNummer}
              </Link>
            )}
          </div>

          {showAdd && (
            <form id="namen-schnellerfassung" className="space-y-4 rounded-2xl border border-line bg-surface p-4 sm:p-5" onSubmit={(event) => { event.preventDefault(); submitName(); }}>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium text-ink">
                  Name
                  <input ref={nameRef} type="text" name="name" autoComplete="off" required placeholder="Vor- und Nachname" enterKeyHint="next" className={input} />
                </label>
                <label className="text-sm font-medium text-ink">
                  Telefonnummer <span className="font-normal text-ink-muted">(optional)</span>
                  <input ref={phoneRef} type="tel" name="phone" autoComplete="off" placeholder="Zum Beispiel 0176 …" enterKeyHint="done" className={input} />
                </label>
              </div>
              <button type="submit" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-akzent px-4 py-3 text-base font-semibold text-white sm:w-auto">
                <PlusIcon className="h-5 w-5" /> Name speichern
              </button>
              <Link href={`/namen/sammeln?liste=${kind}`} className="flex min-h-11 items-center gap-2 text-sm font-medium text-navy-700">
                <SparkIcon className="h-4 w-4" /> Mehrere Namen sammeln →
              </Link>
            </form>
          )}
          {hint && <p role="status" className="text-sm text-ink-muted">{hint}</p>}
          {nachfuellen && open.length > 0 && (
            <p className="text-sm leading-relaxed text-ink-muted">
              Noch {open.length} {open.length === 1 ? "offener Name" : "offene Namen"}.{" "}
              <Link href={`/namen/sammeln?liste=${kind}`} className="inline-flex min-h-11 items-center font-medium text-navy-700">Namen sammeln →</Link>
            </p>
          )}
        </section>
      )}

      {rueckgaengig && (
        <div role="status" className="flex items-center gap-3 rounded-xl border border-line-strong bg-sunken py-2 pl-4 pr-2">
          <p className="min-w-0 flex-1 text-sm font-medium text-ink">{rueckgaengig.text}</p>
          <button type="button" onClick={zurueck} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-navy-700">
            <UndoIcon className="h-4 w-4" /> Rückgängig
          </button>
        </div>
      )}

      {open.length > 0 && (
        <section aria-label="Offene Kontakte" className="space-y-3">
          <div className="flex min-h-11 items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-ink">{auswaehlend ? `${gewaehlt} ausgewählt` : `Offene Kontakte · ${open.length}`}</h2>
            {auswaehlend && <button type="button" onClick={() => setAuswahl(alleGewaehlt ? new Set() : new Set(auswaehlbar.map((entry) => entry.id)))} className="min-h-11 shrink-0 px-2 text-sm font-semibold text-navy-700">
              {alleGewaehlt ? "Keine auswählen" : "Alle auswählen"}
            </button>}
          </div>
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {open.map((entry) => (
              <NameRow
                key={entry.id}
                entry={entry}
                ziel={ziel}
                auswaehlend={auswaehlend}
                gewaehlt={auswahl?.has(entry.id) ?? false}
                onToggle={() => umschalten(entry.id)}
                onCycleRating={() => cycleRating(entry)}
                onMove={() => schieben([entry.id], kind, ziel, `${entry.name} steht jetzt auf ${listKindLabels[ziel]}.`)}
                onDrop={() => schieben([entry.id], kind, null, `${entry.name} ist von der Liste.`)}
              />
            ))}
          </ul>
        </section>
      )}

      {done.length > 0 && !auswaehlend && (
        <section className={`${card} overflow-hidden`}>
          <button type="button" onClick={() => setShowDone((value) => !value)} aria-expanded={showDone} aria-controls="namen-geschafft" className="flex min-h-14 w-full items-center justify-between gap-3 px-4 text-left">
            <span className="inline-flex items-center gap-2 text-base font-semibold text-ink"><CheckIcon className="h-5 w-5 text-navy-700" /> Geschafft · {done.length}</span>
            <span className="text-sm text-ink-muted">{showDone ? "Schließen" : "Anzeigen"}</span>
          </button>
          {showDone && <ul id="namen-geschafft" className="divide-y divide-line border-t border-line">
            {done.map((entry) => <li key={entry.id}>
              <Link href={`/contacts/${entry.id}`} className="flex min-h-16 flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-3 hover:bg-sunken">
                <span className="text-base font-medium text-ink">{entry.name}</span>
                <span className="text-sm text-ink-muted">{entry.appointmentLabel ?? "Kontakt öffnen"}</span>
              </Link>
            </li>)}
          </ul>}
        </section>
      )}

      {lost.length > 0 && !auswaehlend && (
        <section className={`${card} overflow-hidden`}>
          <button type="button" onClick={() => setShowLost((value) => !value)} aria-expanded={showLost} aria-controls="namen-raus" className="flex min-h-14 w-full items-center justify-between gap-3 px-4 text-left">
            <span className="text-base font-medium text-ink-muted">Nicht weiterverfolgt · {lost.length}</span>
            <span className="text-sm text-ink-muted">{showLost ? "Schließen" : "Anzeigen"}</span>
          </button>
          {showLost && <ul id="namen-raus" className="divide-y divide-line border-t border-line">
            {lost.map((entry) => <li key={entry.id} className="flex min-h-16 flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-3">
              <span className="text-base text-ink-muted">{entry.name}</span><span className="text-sm text-ink-muted">{entry.lostLabel ?? "–"}</span>
            </li>)}
          </ul>}
        </section>
      )}

      {!auswaehlend && total > 0 && (
        <details className="border-t border-line pt-2">
          <summary className="min-h-12 cursor-pointer py-3 text-base font-medium text-ink">Liste organisieren & Fortschritt</summary>
          <div className="space-y-5 pb-3 pt-2">
            <div>
              <div className="flex items-baseline justify-between gap-3 text-sm"><span className="font-medium text-ink">{total} von {NAME_TARGET} Namen gesammelt</span><span className="text-ink-muted">{total >= NAME_TARGET ? "Ziel erreicht" : `${percent} %`}</span></div>
              <div role="progressbar" aria-label="Gesammelte Namen" aria-valuenow={Math.min(total, NAME_TARGET)} aria-valuemin={0} aria-valuemax={NAME_TARGET} aria-valuetext={`${total} von ${NAME_TARGET} Namen gesammelt`} className="mt-3 h-1.5 overflow-hidden rounded-full bg-sunken"><div className="h-full rounded-full bg-akzent transition-all" style={{ width: `${percent}%` }} /></div>
            </div>
            <div className="text-sm leading-relaxed text-ink-muted">
              <p className="font-medium text-ink">Nähe hilft bei der Anrufreihenfolge.</p>
              <p className="mt-1">A: {ratingLabels.A} · B: {ratingLabels.B} · C: {ratingLabels.C}. Unter „Mehr“ beim Kontakt lässt sich die Nähe ändern. Die Anrufliste beginnt mit deinem engen Kreis.</p>
              {liegen > 0 && <p className="mt-3">{liegen} {liegen === 1 ? "Kontakt wartet" : "Kontakte warten"} seit mehreren Tagen auf einen nächsten Schritt. Die betroffenen Namen sind in der Liste gekennzeichnet.</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              {auswaehlbar.length > 1 && <button type="button" onClick={() => setAuswahl(new Set())} className="min-h-12 rounded-xl border border-line-strong px-4 py-3 text-sm font-medium text-ink">Mehrere Kontakte verschieben</button>}
              <Link href={`/namen/sammeln?liste=${kind}`} className="inline-flex min-h-12 items-center gap-2 px-2 py-3 text-sm font-medium text-navy-700"><SparkIcon className="h-4 w-4" /> Namen sammeln</Link>
            </div>
          </div>
        </details>
      )}

      {auswaehlend && (
        <div className="crm-undo pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4">
          <div className="pointer-events-auto w-full max-w-lg space-y-2 rounded-2xl border border-line-strong bg-surface p-3 text-ink shadow-lg">
            <div className="flex items-center justify-between gap-3"><p className="text-sm font-medium">{gewaehlt} ausgewählt</p><button type="button" onClick={() => setAuswahl(null)} className="min-h-11 px-2 text-sm font-medium text-ink-muted">Auswahl beenden</button></div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" disabled={gewaehlt === 0} onClick={() => schieben([...(auswahl ?? [])], kind, ziel, `${gewaehlt} ${gewaehlt === 1 ? "Name steht" : "Namen stehen"} jetzt auf ${listKindLabels[ziel]}.`)} className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-akzent px-3 py-3 text-sm font-semibold text-white disabled:opacity-40"><ArrowRightIcon className="h-4 w-4" /> Zu {listKindLabels[ziel]}</button>
              <button type="button" disabled={gewaehlt === 0} onClick={() => schieben([...(auswahl ?? [])], kind, null, `${gewaehlt} ${gewaehlt === 1 ? "Name ist" : "Namen sind"} von der Liste.`)} className="min-h-12 rounded-xl border border-line-strong px-3 py-3 text-sm font-medium text-ink disabled:opacity-40">Von der Liste</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NameRow({ entry, ziel, auswaehlend, gewaehlt, onCycleRating, onToggle, onMove, onDrop }: {
  entry: NameEntry;
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
  const [showMore, setShowMore] = useState(false);

  const savePhone = (value: string) => {
    setEditingPhone(false);
    const trimmed = value.trim();
    if (!trimmed || !istEcht(entry.id)) return;
    const data = new FormData();
    data.set("contactId", entry.id);
    data.set("phone", trimmed);
    startTransition(() => { void setPhone(data); });
  };

  if (auswaehlend) return (
    <li>
      <button type="button" onClick={onToggle} disabled={!istEcht(entry.id)} aria-pressed={gewaehlt} className={`flex min-h-20 w-full items-center gap-3 px-4 py-3 text-left disabled:opacity-50 ${gewaehlt ? "bg-sunken" : ""}`}>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${gewaehlt ? "bg-akzent text-white" : "border border-line-strong text-ink-muted"}`}>{gewaehlt ? <CheckIcon className="h-5 w-5" /> : <span aria-hidden="true">○</span>}</span>
        <span className="min-w-0 flex-1"><span className="block truncate text-base font-semibold text-ink">{entry.name}</span>{entry.phone && <span className="block truncate text-sm text-ink-muted">{entry.phone}</span>}</span>
      </button>
    </li>
  );

  return (
    <li>
      <div className="flex min-h-20 items-start gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          {istEcht(entry.id) ? <Link href={`/contacts/${entry.id}`} className="inline-flex min-h-11 max-w-full items-center text-base font-semibold text-ink"><span className="truncate">{entry.name}</span></Link> : <p className="flex min-h-11 items-center text-base font-semibold text-ink">{entry.name}</p>}
          {editingPhone ? (
            <input type="tel" aria-label={`Telefonnummer für ${entry.name}`} autoFocus defaultValue={entry.phone ?? ""} placeholder="Telefonnummer" enterKeyHint="done" onBlur={(event) => savePhone(event.currentTarget.value)} onKeyDown={(event) => {
              if (event.key === "Enter") { event.preventDefault(); savePhone(event.currentTarget.value); }
              if (event.key === "Escape") setEditingPhone(false);
            }} className={`${input} max-w-sm`} />
          ) : entry.phone ? <p className="truncate text-sm text-ink-muted">{entry.phone}</p> : (
            <button type="button" disabled={!istEcht(entry.id)} onClick={() => setEditingPhone(true)} className="inline-flex min-h-11 items-center text-sm font-medium text-navy-700 disabled:opacity-50">Nummer ergänzen</button>
          )}
          {entry.liegtTage !== null && <p className="mt-1 text-xs text-ink-muted">{liegtLabel(entry.liegtTage)} · Nächsten Schritt festlegen</p>}
        </div>
        <button type="button" disabled={!istEcht(entry.id)} onClick={() => setShowMore((value) => !value)} aria-label={`Mehr zu ${entry.name}`} aria-expanded={showMore} aria-controls={`name-mehr-${entry.id}`} className="min-h-11 shrink-0 rounded-lg px-2 text-sm font-medium text-ink-muted disabled:opacity-50">{showMore ? "Schließen" : "Mehr"}</button>
      </div>
      {showMore && <div id={`name-mehr-${entry.id}`} className="space-y-3 border-t border-line bg-sunken px-4 py-4">
        <div>
          <button type="button" onClick={onCycleRating} title={entry.rating ? ratingHints[entry.rating] : "Nähe zum Kontakt festlegen"} className="min-h-11 text-left text-sm font-medium text-ink">
            Nähe: {entry.rating ? `${entry.rating} · ${ratingLabels[entry.rating]}` : "Noch nicht eingestuft"} <span className="ml-1 text-navy-700">Ändern</span>
          </button>
          <p className="text-xs text-ink-muted">Tippen wechselt zwischen A, B, C und keiner Einstufung.</p>
        </div>
        <div className="flex flex-col items-start gap-1">
          {entry.phone && <button type="button" onClick={() => { setEditingPhone(true); setShowMore(false); }} className="min-h-11 text-sm font-medium text-ink">Nummer bearbeiten</button>}
          <button type="button" onClick={onMove} className="inline-flex min-h-11 items-center gap-2 text-left text-sm font-medium text-ink"><ArrowRightIcon className="h-4 w-4" /> Zu {listKindLabels[ziel]} verschieben</button>
          <button type="button" onClick={onDrop} className="min-h-11 text-left text-sm text-ink-muted">Von dieser Liste nehmen</button>
          <p className="text-xs text-ink-muted">Der Kontakt bleibt dabei erhalten.</p>
        </div>
      </div>}
    </li>
  );
}
