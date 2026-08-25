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
      ? "bg-akzent text-white"
      : "border border-slate-300 bg-surface text-slate-600 hover:border-slate-400"
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
          <p className="mb-2 text-13 font-medium text-slate-600">Tag</p>
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
          <p className="mb-2 text-13 font-medium text-slate-600">Uhrzeit</p>
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
          <span className="text-13 font-medium text-slate-600">
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

// Der gehaltene Termin: Ergebnis UND Empfehlungen auf einem Bildschirm.
//
// Die Empfehlungsfrage steht hier und nicht als Frist drei Tage spaeter, weil
// sie sonst umgangen wird - genau das war sie vorher. Sie kostet trotzdem
// keinen zusaetzlichen Tipp: das Antippen des Ergebnisses speichert beides.
export function AppointmentHeldDialog({
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
  onSave: (result: string, empfehlungen: { name: string; phone: string }[]) => void;
}) {
  const [zeilen, setZeilen] = useState([
    { name: "", phone: "" },
    { name: "", phone: "" },
    { name: "", phone: "" },
  ]);

  const setzeZeile = (index: number, feld: "name" | "phone", wert: string) =>
    setZeilen((alt) =>
      alt.map((zeile, i) => (i === index ? { ...zeile, [feld]: wert } : zeile))
    );

  const speichern = (result: string) =>
    onSave(
      result,
      zeilen.filter((zeile) => zeile.name.trim().length > 0)
    );

  const ergebnisse = [
    { wert: "abschluss", text: "Abschluss", stil: "bg-emerald-600 text-white hover:bg-emerald-700" },
    { wert: "offen", text: "Noch offen", stil: "bg-akzent text-white hover:bg-akzent-stark" },
    {
      wert: "kein_abschluss",
      text: "Kein Abschluss",
      stil: "border border-slate-300 bg-surface text-slate-700 hover:bg-slate-50",
    },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Termin gehalten" subtitle={name}>
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-13 font-medium text-slate-600">
            Wen hat {name} dir empfohlen?
          </p>
          <div className="space-y-2">
            {zeilen.map((zeile, index) => (
              <div key={index} className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={zeile.name}
                  onChange={(event) => setzeZeile(index, "name", event.target.value)}
                  placeholder={`Name ${index + 1}`}
                  className={`${input} mt-0`}
                />
                <input
                  type="tel"
                  value={zeile.phone}
                  onChange={(event) => setzeZeile(index, "phone", event.target.value)}
                  placeholder="Nummer"
                  className={`${input} mt-0`}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setZeilen((alt) => [...alt, { name: "", phone: "" }])}
            className="mt-2 min-h-11 text-sm font-medium text-navy-600 hover:underline"
          >
            + weitere Zeile
          </button>
          <p className="mt-1 text-xs text-slate-500">
            Jeder Name landet mit Erstanruf für heute auf deiner Liste. Auch
            keine Empfehlung ist eine Antwort — die Frage gilt dann als gestellt.
          </p>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <p className="mb-2 text-13 font-medium text-slate-600">
            Und? Was kam raus?
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {ergebnisse.map((ergebnis) => (
              <button
                key={ergebnis.wert}
                type="button"
                disabled={pending}
                onClick={() => speichern(ergebnis.wert)}
                className={`inline-flex min-h-12 items-center justify-center rounded-xl px-3 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50 ${ergebnis.stil}`}
              >
                {ergebnis.text}
              </button>
            ))}
          </div>
        </div>
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
