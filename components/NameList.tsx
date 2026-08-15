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
  NAME_TARGET,
  RATINGS,
  nextRating,
  ratingHints,
  ratingLabels,
  ratingPalette,
  targetPercent,
} from "@/lib/namelist";
import type { ContactRating, ListKind } from "@/lib/generated/prisma/enums";
import { PhoneIcon, PlusIcon } from "@/components/icons";
import { card, filterPill, input } from "@/components/ui";

export type NameEntry = {
  id: string;
  name: string;
  phone: string | null;
  rating: ContactRating | null;
  listKinds: ListKind[];
  section: "offen" | "geschafft" | "raus";
  lostLabel: string | null;
  appointmentLabel: string | null;
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
  const [ratingFilter, setRatingFilter] = useState<ContactRating | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [showLost, setShowLost] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  const open = optimistic.filter((entry) => entry.section === "offen");
  const done = optimistic.filter((entry) => entry.section === "geschafft");
  const lost = optimistic.filter((entry) => entry.section === "raus");

  const visible = ratingFilter
    ? open.filter((entry) => entry.rating === ratingFilter)
    : open;

  const total = optimistic.length;
  const percent = targetPercent(total);
  const callable = visible.filter((entry) => entry.phone).length;

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
    const next = nextRating(entry.rating);
    const data = new FormData();
    data.set("contactId", entry.id);
    if (next) data.set("rating", next);

    startTransition(async () => {
      applyOptimistic({ kind: "rating", id: entry.id, rating: next });
      await setRating(data);
    });
  };

  return (
    <div className="space-y-5">
      {/* Fortschritt zum Ziel. 20 ist ein Ziel, keine Grenze – der Balken
          bleibt bei 100 %, weitere Namen sind willkommen. */}
      <div className={`${card} space-y-2 p-4`}>
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold text-slate-900">
            {total} von {NAME_TARGET} Namen
          </span>
          <span className="text-xs font-medium text-slate-500">
            {total >= NAME_TARGET ? "Ziel erreicht 🎉" : `${percent} %`}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-navy-600 transition-all duration-300"
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
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-navy-800 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-navy-900 active:scale-[0.99]"
          >
            <PlusIcon className="h-4 w-4" />
            <span className="sm:hidden">Hinzufügen</span>
          </button>
        </div>
        {hint && <p className="text-xs font-medium text-amber-700">{hint}</p>}
      </div>

      {open.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setRatingFilter(null)}
              className={filterPill(ratingFilter === null)}
            >
              Alle
            </button>
            {RATINGS.map((value) => {
              const count = open.filter((entry) => entry.rating === value).length;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setRatingFilter(ratingFilter === value ? null : value)
                  }
                  title={ratingHints[value]}
                  className={filterPill(ratingFilter === value)}
                >
                  {value} · {ratingLabels[value]}
                  <span className="ml-1.5 opacity-60">{count}</span>
                </button>
              );
            })}
          </div>

          <Link
            href={`/namen/anrufen?liste=${kind}${
              ratingFilter ? `&stufe=${ratingFilter}` : ""
            }`}
            className={`flex min-h-14 items-center justify-center gap-2 rounded-xl text-base font-semibold transition ${
              callable > 0
                ? "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:scale-[0.99]"
                : "pointer-events-none bg-slate-100 text-slate-400"
            }`}
          >
            <PhoneIcon className="h-5 w-5" />
            {callable > 0
              ? `Durchlauf starten · ${callable} ${callable === 1 ? "Name" : "Namen"}`
              : "Erst Nummern eintragen"}
          </Link>

          <ul className="space-y-2">
            {visible.map((entry) => (
              <NameRow
                key={entry.id}
                entry={entry}
                onCycleRating={() => cycleRating(entry)}
              />
            ))}
            {visible.length === 0 && (
              <li className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                Kein Name mit dieser Einstufung.
              </li>
            )}
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
        </div>
      )}

      {done.length > 0 && (
        <div className={`${card} overflow-hidden`}>
          <button
            type="button"
            onClick={() => setShowDone((value) => !value)}
            className="flex min-h-14 w-full items-center justify-between px-4 text-left"
          >
            <span className="text-sm font-semibold text-emerald-800">
              ✅ Geschafft · {done.length}
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
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-bold transition active:scale-95 ${
          palette
            ? palette.chip
            : "border border-dashed border-slate-300 text-slate-400 hover:border-slate-400 hover:text-slate-600"
        }`}
      >
        {entry.rating ?? "–"}
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">
          {entry.name}
        </p>
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
        ✕
      </button>
    </li>
  );
}
