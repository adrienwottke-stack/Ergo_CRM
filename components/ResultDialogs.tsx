"use client";

// Die Auswahl-Dialoge hinter den drei Gespraechsergebnissen.
//
// Sie standen zuerst im NameDialer und sind hier herausgezogen, damit die
// Heute-Liste dieselben benutzt statt eigener. Ein Bedienmuster, eine Stelle.

import { useEffect, useRef, useState } from "react";
import Modal from "@/components/Modal";
import EmpfehlungsBlock from "@/components/EmpfehlungsBlock";
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

const WOCHENTAG_KURZ = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

const wochentagLang = new Intl.DateTimeFormat("de-DE", {
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
});

export type Werktag = { label: string; day: string; titel: string };

/**
 * Die naechsten fuenf Werktage, jeder mit seinem naechsten Vorkommen.
 *
 * Am Telefon faellt "Dienstag" und nicht "in drei Tagen" - wer die relativen
 * Chips benutzt, rechnet erst um. Gezaehlt wird ab MORGEN: heute ist kein
 * Wiedervorlage-Tag, heute ist der Anruf. Weil ab morgen fuenf Werktage immer
 * fuenf VERSCHIEDENE Wochentage sind, steht jeder genau einmal in der Reihe.
 * Das Datum haengt am Titel und am aria-label, nicht am Chip: "Di 23.09."
 * waere am Handy zwei Chips je Zeile.
 */
export function naechsteWerktage(): Werktag[] {
  const tage: Werktag[] = [];
  for (let offset = 1; tage.length < 5 && offset <= 9; offset += 1) {
    const datum = new Date();
    datum.setDate(datum.getDate() + offset);
    const wochentag = datum.getDay();
    if (wochentag === 0 || wochentag === 6) continue; // Wochenende
    tage.push({
      label: WOCHENTAG_KURZ[wochentag],
      day: dayPart(datum),
      titel: wochentagLang.format(datum),
    });
  }
  return tage;
}

const chip = (active: boolean) =>
  `inline-flex min-h-11 items-center rounded-full px-3.5 text-sm font-medium transition ${
    active ? "bg-akzent text-white" : "bg-sunken text-ink-muted hover:text-ink"
  }`;

/**
 * Die Tag-Reihe: erst die relativen Abstaende, dann die Wochentage.
 *
 * Beide Reihen stehen in EINEM `flex-wrap` und nicht nebeneinander - am Handy
 * bricht die Reihe damit um, statt seitlich hinauszulaufen. Dass "Morgen" und
 * "Di" derselbe Tag sein koennen und dann beide leuchten, ist Absicht: es
 * zeigt die Gleichung, statt einen Chip verschwinden zu lassen und die Reihe
 * unter dem Finger springen zu lassen.
 */
function TagChips({
  tag,
  onPick,
}: {
  tag: string;
  onPick: (day: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {DAY_CHIPS.map((eintrag) => {
        const wert = inDays(eintrag.offset);
        return (
          <button
            key={eintrag.label}
            type="button"
            onClick={() => onPick(wert)}
            className={chip(tag === wert)}
          >
            {eintrag.label}
          </button>
        );
      })}
      {naechsteWerktage().map((werktag) => (
        <button
          key={werktag.day}
          type="button"
          title={werktag.titel}
          aria-label={werktag.titel}
          onClick={() => onPick(werktag.day)}
          className={chip(tag === werktag.day)}
        >
          {werktag.label}
        </button>
      ))}
    </div>
  );
}

function ZeitChips({
  zeit,
  onPick,
}: {
  zeit: string;
  onPick: (wert: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {TIME_CHIPS.map((wert) => (
        <button
          key={wert}
          type="button"
          onClick={() => onPick(wert)}
          className={`${chip(zeit === wert)} tabular-nums`}
        >
          {wert}
        </button>
      ))}
    </div>
  );
}

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
          <p className="mb-2 text-13 font-medium text-ink-muted">Tag</p>
          <TagChips tag={day} onPick={(wert) => setWhen(`${wert}T${time}`)} />
        </div>

        <div>
          <p className="mb-2 text-13 font-medium text-ink-muted">Uhrzeit</p>
          <ZeitChips zeit={time} onPick={(wert) => setWhen(`${day}T${wert}`)} />
        </div>

        <label className="block">
          <span className="text-13 font-medium text-ink-muted">
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

/**
 * "Wann nochmal?" - der Spaeter-Dialog.
 *
 * Oben die drei groben Abstaende, die bisher die ganze Auswahl waren: ein
 * Tipp, Wiedervorlage auf den Tag, fertig. Erst darunter, aufgeklappt, der
 * genaue Zeitpunkt - Emils "Rueckmeldung, 15 Uhr".
 *
 * Die Uhrzeit ist bewusst NICHT die Voreinstellung. Nur eine Wiedervorlage
 * MIT Uhrzeit steht danach im Kalender und im Handy-Abo
 * (lib/kalender/feed.ts); eine ohne bleibt eine Frist in der Heute-Liste.
 * Waeren alle Wiedervorlagen Kalendereintraege, staenden dort hunderte
 * Mitternachtstermine, die niemand vereinbart hat.
 */
export function SpaeterDialog({
  open,
  name,
  pending,
  onClose,
  onTage,
  onZeitpunkt,
}: {
  open: boolean;
  name: string;
  pending: boolean;
  onClose: () => void;
  /** Grober Abstand in Tagen - ohne Uhrzeit, wie bisher. */
  onTage: (tage: string) => void;
  /** Genauer Zeitpunkt als "2026-09-08T15:00", Berliner Zeit. */
  onZeitpunkt: (wann: string) => void;
}) {
  const [genau, setGenau] = useState(false);
  const [tag, setTag] = useState("");
  const [zeit, setZeit] = useState("");

  // Beim Schliessen zuruecksetzen: der Dialog bleibt eingehaengt, und beim
  // naechsten Namen darf nicht die Uhrzeit des vorigen dastehen.
  useEffect(() => {
    if (open) return;
    setGenau(false);
    setTag("");
    setZeit("");
  }, [open]);

  const bereit = tag !== "" && zeit !== "";

  return (
    <Modal open={open} onClose={onClose} title="Wann nochmal?" subtitle={name}>
      <div className="space-y-4">
        <div className="space-y-2">
          {LATER_CHIPS.map((eintrag) => (
            <button
              key={eintrag.days}
              type="button"
              disabled={pending}
              onClick={() => onTage(eintrag.days)}
              className="flex min-h-14 w-full items-center rounded-full bg-sunken px-4 text-sm font-semibold text-ink-muted transition hover:bg-akzent hover:text-white disabled:opacity-50"
            >
              {eintrag.label}
            </button>
          ))}
        </div>

        {genau ? (
          <div className="space-y-4 border-t border-line pt-4">
            <div>
              <p className="mb-2 text-13 font-medium text-ink-muted">Tag</p>
              <TagChips tag={tag} onPick={setTag} />
            </div>

            <div>
              <p className="mb-2 text-13 font-medium text-ink-muted">Uhrzeit</p>
              <ZeitChips zeit={zeit} onPick={setZeit} />
            </div>

            <button
              type="button"
              disabled={pending || !bereit}
              onClick={() => onZeitpunkt(`${tag}T${zeit}`)}
              className={`${btnPrimary} w-full`}
            >
              {pending ? "Speichert…" : "Rückmeldung eintragen"}
            </button>

            <p className="text-xs text-ink-muted">
              Mit Uhrzeit steht die Rückmeldung im Kalender und im Abo auf dem
              Handy. Ohne Uhrzeit bleibt sie eine Frist in der Heute-Liste.
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setGenau(true);
              setTag(inDays(1));
            }}
            className="inline-flex min-h-11 items-center text-13 font-medium text-navy-600 hover:underline"
          >
            Genauer: Tag und Uhrzeit
          </button>
        )}
      </div>
    </Modal>
  );
}

// Der gehaltene Termin: Ergebnis UND Empfehlungen auf einem Bildschirm.
//
// Die Empfehlungsfrage steht hier und nicht als Frist drei Tage spaeter, weil
// sie sonst umgangen wird - genau das war sie vorher. Sie kostet trotzdem
// keinen zusaetzlichen Tipp: das Antippen des Ergebnisses speichert beides.
//
// Der Block selbst liegt in components/EmpfehlungsBlock.tsx, weil ihn das
// Nachtragen am Kontakt genauso braucht. Er bringt echte Formularfelder mit -
// deshalb steht hier ein <form>, aus dem beim Antippen des Ergebnisses das
// vollstaendige FormData faellt. Die Ergebnis-Knoepfe bleiben trotzdem
// type="button": ein Absenden ueber die Eingabetaste waere im Namensfeld ein
// Fehlgriff mit gespeichertem Ergebnis.
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
  onSave: (formData: FormData) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  const speichern = (result: string) => {
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    data.set("result", result);
    onSave(data);
  };

  const ergebnisse = [
    { wert: "abschluss", text: "Abschluss", stil: "bg-fest-erfolg text-white hover:bg-fest-erfolg-stark" },
    { wert: "offen", text: "Noch offen", stil: "bg-akzent text-white hover:bg-akzent-stark" },
    {
      wert: "kein_abschluss",
      text: "Kein Abschluss",
      stil: "border border-line-strong bg-surface text-ink-muted hover:bg-sunken",
    },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Termin gehalten" subtitle={name}>
      <form ref={formRef} onSubmit={(event) => event.preventDefault()}>
        <div className="space-y-5">
          <EmpfehlungsBlock geberName={name} />

          <div className="border-t border-line pt-4">
            <p className="mb-2 text-13 font-medium text-ink-muted">
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
            <p className="mt-2 text-xs text-ink-muted">
              Auch keine Empfehlung ist eine Antwort — die Frage gilt dann als
              gestellt und steht morgen nicht wieder da.
            </p>
          </div>
        </div>
      </form>
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
            className="flex min-h-14 w-full items-center rounded-full bg-sunken px-4 text-sm font-semibold text-ink-muted transition hover:bg-akzent hover:text-white disabled:opacity-50"
          >
            {choice.label}
          </button>
        ))}
      </div>
    </Modal>
  );
}
