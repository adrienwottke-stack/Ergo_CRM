"use client";

// Die Auswahl-Dialoge hinter den vier Gespraechsergebnissen.
//
// Sie standen zuerst im NameDialer und sind hier herausgezogen, damit die
// Heute-Liste dieselben benutzt statt eigener. Ein Bedienmuster, eine Stelle.

import { useState } from "react";
import Modal from "@/components/Modal";
import { btnPrimary, input } from "@/components/ui";

// --- Zeit-Hilfen (lokale Browserzeit = Berliner Zeit des Nutzers) -----------

const pad = (value: number) => String(value).padStart(2, "0");

function dayPart(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function inDays(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return dayPart(date);
}

export const DAY_CHIPS: { label: string; offset: number }[] = [
  { label: "Morgen", offset: 1 },
  { label: "Übermorgen", offset: 2 },
  { label: "In 3 Tagen", offset: 3 },
  { label: "Nächste Woche", offset: 7 },
];

export const TIME_CHIPS = ["09:00", "11:00", "14:00", "16:00", "18:00", "19:30"];

export const LATER_CHIPS: { label: string; days: string }[] = [
  { label: "In 1 Woche", days: "7" },
  { label: "In 1 Monat", days: "30" },
  { label: "In 3 Monaten", days: "90" },
];

export const LOST_CHIPS: { label: string; reason: string }[] = [
  { label: "Kein Bedarf", reason: "KEIN_BEDARF" },
  { label: "Kein Interesse", reason: "KEIN_INTERESSE" },
  { label: "Schon versorgt", reason: "KONKURRENZ" },
];

const chip = (active: boolean) =>
  `inline-flex min-h-11 items-center rounded-full px-3.5 text-sm font-medium transition ${
    active
      ? "bg-navy-800 text-white"
      : "border border-slate-300 bg-white text-slate-600 hover:border-slate-400"
  }`;

// Termin in zwei Tipps: Tag antippen, Uhrzeit antippen, speichern. Der
// Datumswaehler bleibt als Rueckfallebene darunter stehen.
export function AppointmentDialog({
  open,
  name,
  pending,
  onClose,
  onSave,
}: {
  open: boolean;
  name: string;
  pending: boolean;
  onClose: () => void;
  onSave: (when: string) => void;
}) {
  const [when, setWhen] = useState(`${inDays(1)}T18:00`);
  const [day, time] = when.split("T");

  return (
    <Modal open={open} onClose={onClose} title="Termin vereinbart" subtitle={name}>
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-[13px] font-medium text-slate-600">Tag</p>
          <div className="flex flex-wrap gap-2">
            {DAY_CHIPS.map((entry) => {
              const value = inDays(entry.offset);
              return (
                <button
                  key={entry.label}
                  type="button"
                  onClick={() => setWhen(`${value}T${time}`)}
                  className={chip(day === value)}
                >
                  {entry.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[13px] font-medium text-slate-600">Uhrzeit</p>
          <div className="flex flex-wrap gap-2">
            {TIME_CHIPS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setWhen(`${day}T${value}`)}
                className={`${chip(time === value)} tabular-nums`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="text-[13px] font-medium text-slate-600">
            Oder genau eintragen
          </span>
          <input
            type="datetime-local"
            value={when}
            onChange={(event) => setWhen(event.target.value)}
            className={input}
          />
        </label>

        <button
          type="button"
          disabled={pending || !when}
          onClick={() => onSave(when)}
          className={`${btnPrimary} w-full`}
        >
          {pending ? "Speichert…" : "Termin speichern"}
        </button>
      </div>
    </Modal>
  );
}

// Ein Tipp genuegt: die Auswahl selbst ist schon die Bestaetigung.
export function ChoiceDialog({
  open,
  title,
  subtitle,
  pending,
  choices,
  onClose,
}: {
  open: boolean;
  title: string;
  subtitle: string;
  pending: boolean;
  choices: { label: string; onPick: () => void }[];
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} subtitle={subtitle}>
      <div className="space-y-2">
        {choices.map((choice) => (
          <button
            key={choice.label}
            type="button"
            disabled={pending}
            onClick={choice.onPick}
            className="flex min-h-14 w-full items-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-800 transition hover:border-navy-400 hover:bg-navy-50/50 disabled:opacity-50"
          >
            {choice.label}
          </button>
        ))}
      </div>
    </Modal>
  );
}
