"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  addName,
  removeFromList,
  setPhone,
  setRating,
} from "@/app/(app)/namen/actions";
import {
  NACHFUELL_SCHWELLE,
  NAME_TARGET,
  nextRating,
  ratingHints,
  ratingLabels,
  ratingPalette,
  targetPercent,
} from "@/lib/namelist";
import type { ContactRating, ListKind } from "@/lib/generated/prisma/enums";
import { CheckIcon, PhoneIcon, PlusIcon, SparkIcon, XIcon } from "@/components/icons";
import { card, chip, input } from "@/components/ui";
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
  | { kind: "rating"; id: string; rating: ContactRating | null };

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
  return entries.map((entry) =>
    entry.id === patch.id ? { ...entry, rating: patch.rating } : entry
  );
}

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

  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

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
    // Eine optimistisch eingefuegte Zeile traegt noch keine echte Id (siehe
    // applyPatch). Wer sofort auf den Buchstaben tippt, wuerde sie an den
    // Server schicken - der findet nichts, und die Einstufung waere still weg.
    // Das Fenster ist kurz, aber es ist genau der Moment, in dem jemand zwanzig
    // Namen hintereinander eintippt.
    if (entry.id.startsWith("neu-")) return;

    const next = nextRating(entry.rating);
    const data = new FormData();
    data.set("contactId", entry.id);
    if (next) data.set("rating", next);

    startTransition(async () => {
      applyOptimistic({ kind: "rating", id: entry.id, rating: next });
      await setRating(data);
    });
  };

  // Nachfuell-Alarm: nicht die Gesamtzahl zaehlt, sondern was noch zu
  // arbeiten ist. Zwanzig Namen, von denen achtzehn erledigt sind, sind ein
  // leerer Trichter.
  const nachfuellen = total > 0 && open.length < NACHFUELL_SCHWELLE;

  return (
    <div className="space-y-5">
      {nachfuellen && (
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
          <span className="text-sm font-semibold text-slate-900">
            {total} von {NAME_TARGET} Namen
          </span>
          <span className="text-xs font-medium text-slate-500">
            {total >= NAME_TARGET ? "Ziel erreicht" : `${percent} %`}
          </span>
        </div>
        <div className="h-[3px] w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-navy-700 transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Schnell-Erfassung: Name breit, Nummer schmal, Enter legt an. */}
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

      {open.length > 0 && (
        <>
          {/* Hier stand eine Filterleiste nach A/B/C. Sie war ein
              Entscheidungspunkt, den der Nutzer nicht treffen soll
              (docs/audit-kernmodell.md, 1.5 und 10.9): der Durchlauf sortiert
              ohnehin nach Naehe, enger Kreis zuerst. Wer filtern konnte, konnte
              vor allem eines - die unangenehmen Namen wegblenden. */}

          {/* Ohne Nummer kein Anruf. Frueher stand hier ein toter Knopf
              ("Erst Nummern eintragen") und der Partner musste sich selbst
              ausdenken, wie er zwanzig Nummern in die Liste bekommt. Jetzt ist
              der Satz der Weg. */}
          {callable > 0 ? (
            <Link
              href={`/namen/anrufen?liste=${kind}`}
              className="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-fest-erfolg text-base font-semibold text-white transition hover:bg-fest-erfolg-stark active:scale-[0.99]"
            >
              <PhoneIcon className="h-5 w-5" />
              Durchlauf starten · {callable} {callable === 1 ? "Name" : "Namen"}
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
              {ohneNummer} {ohneNummer === 1 ? "Name hat" : "Namen haben"} noch
              keine Nummer — nachtragen
            </Link>
          )}

          {/* Zaehlt, was die Plaketten unten einzeln zeigen. Ohne diese Zeile
              muesste man zwanzig Namen absuchen, um zu merken, dass sechs
              davon liegen. */}
          {liegen > 0 && (
            <p className="text-sm font-semibold text-red-700">
              {liegen === 1
                ? "Ein Name liegt seit Tagen."
                : `${liegen} Namen liegen seit Tagen.`}{" "}
              <span className="font-normal text-slate-500">
                Anrufen oder von der Liste nehmen.
              </span>
            </p>
          )}

          <ul className="space-y-2">
            {open.map((entry) => (
              <NameRow
                key={entry.id}
                entry={entry}
                onCycleRating={() => cycleRating(entry)}
              />
            ))}
          </ul>
        </>
      )}

      {open.length === 0 && total === 0 && (
        <div className={`${card} px-6 py-12 text-center`}>
          <p className="text-sm font-medium text-slate-900">
            Noch keine Namen auf der Liste
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
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

      {done.length > 0 && (
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
            <span className="text-xs text-slate-400">
              {showDone ? "Zuklappen" : "Anzeigen"}
            </span>
          </button>
          {showDone && (
            <ul className="divide-y divide-slate-100 border-t border-slate-100">
              {done.map((entry) => (
                <li key={entry.id}>
                  <Link
                    href={`/contacts/${entry.id}`}
                    className="flex min-h-14 items-center justify-between gap-3 px-4 hover:bg-emerald-50/40"
                  >
                    <span className="text-sm font-medium text-slate-900">
                      {entry.name}
                    </span>
                    <span className="shrink-0 text-xs text-slate-500">
                      {entry.appointmentLabel ?? "im CRM"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {lost.length > 0 && (
        <div className={`${card} overflow-hidden`}>
          <button
            type="button"
            onClick={() => setShowLost((value) => !value)}
            className="flex min-h-14 w-full items-center justify-between px-4 text-left"
          >
            <span className="text-sm font-semibold text-slate-600">
              Raus · {lost.length}
            </span>
            <span className="text-xs text-slate-400">
              {showLost ? "Zuklappen" : "Anzeigen"}
            </span>
          </button>
          {showLost && (
            <ul className="divide-y divide-slate-100 border-t border-slate-100">
              {lost.map((entry) => (
                <li
                  key={entry.id}
                  className="flex min-h-14 items-center justify-between gap-3 px-4"
                >
                  <span className="text-sm text-slate-500">{entry.name}</span>
                  <span className="shrink-0 text-xs text-slate-400">
                    {entry.lostLabel ?? "–"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// --- Eine Zeile -------------------------------------------------------------

function NameRow({
  entry,
  onCycleRating,
}: {
  entry: NameEntry;
  onCycleRating: () => void;
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

  const drop = () => {
    const data = new FormData();
    data.set("contactId", entry.id);
    startTransition(() => {
      void removeFromList(data);
    });
  };

  return (
    <li className={`${card} flex min-h-16 items-center gap-3 p-3`}>
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
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-semibold transition active:scale-95 ${
          palette
            ? palette.chip
            : "border border-dashed border-slate-300 text-slate-400 hover:border-slate-400 hover:text-slate-600"
        }`}
      >
        {entry.rating ?? "–"}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-slate-900">
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
            className="mt-1 w-full max-w-48 rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
        ) : entry.phone ? (
          <p className="truncate text-sm text-slate-500">{entry.phone}</p>
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

      <button
        type="button"
        onClick={drop}
        aria-label={`${entry.name} von der Liste nehmen`}
        title="Von der Liste nehmen (Kontakt bleibt erhalten)"
        className="flex h-11 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 transition hover:bg-slate-50 hover:text-slate-500"
      >
        <XIcon className="h-4.5 w-4.5" />
      </button>
    </li>
  );
}
