// Stufen: der Fortschritt, der nie fällt.
//
// Die Rangliste misst die Woche und beginnt jeden Montag bei null. Das ist
// richtig für einen Wettkampf und falsch für alles, was man sich erarbeitet:
// wer freischalten will, was er sich verdient hat, braucht eine Zahl, die
// stehenbleibt. Deshalb rechnen Stufen über die gesamte Zeit.
//
// Zwei Regeln, die den Rest erklären:
//
// 1. Eine Stufe wird NICHT gespeichert. `User.careerLevel` gab es schon einmal
//    und flog beim Rückbau raus - "wird nie gelesen und nie geschrieben, totes
//    Feld" (docs/audit-kernmodell.md, 8.8). Eine gerechnete Stufe kann nicht
//    falsch stehen.
// 2. Das ist keine Abzeichen-Sammlung. Die wurde geprüft und verworfen, weil
//    nach acht Wochen jeder alles hat (docs/wettbewerb-plan.md, 13.4). Eine
//    Stufe ist ein Fortschrittsbalken mit einem Schlüssel daran - sie soll
//    monoton sein.

import { cache } from "react";
import { einstellungen } from "@/lib/einstellungen";

export type Stufe = {
  nummer: number;
  name: string;
  ab: number;
};

// Die Abstände wachsen bewusst: die erste Stufe fällt in der ersten Woche, die
// letzte ist ein halbes Jahr Arbeit. Eine Leiter mit gleichmäßigen Sprossen ist
// am Anfang zu hoch und am Ende zu billig.
//
// KALIBRIERT AM 25.08.2026 gegen die echten Zahlen (scripts/stufen-probe.mjs):
// höchster Kopf 45 Punkte, Median 27. Schwellen von 50 aufwärts hätten
// bedeutet: alle stehen auf Stufe 1 und das Spiel bleibt für jeden zu. Eine
// Kachel, die sich für niemanden öffnet, ist schlimmer als keine Kachel.
//
// ACHTUNG, gleiche Falle wie bei quotaTypePoints: Stufen werden nirgends
// gespeichert, sondern bei jeder Anzeige hier nachgeschlagen. Eine Änderung
// stuft rückwirkend jeden um - und degradiert im Zweifel jemanden über Nacht.
// Einmal setzen, danach nicht mehr anfassen. Das gilt fuer "ab" - fuer "name"
// nicht mehr: seit AP-25 (D18) sind die sechs Namen ueber die Werkstatt
// aenderbar (STUFEN_TITEL_SCHLUESSEL, ladeStufenTitel() unten). Was hier
// steht, ist zugleich der Fallback UND der Mix-Satz aus drei Vorschlaegen -
// Emil hat Anwaerter/Anrufer/... ausdruecklich abgelehnt (docs/emil-
// feedback-runde-2.md, Abschnitt 7, AP-25).
export const STUFEN: readonly Stufe[] = [
  { nummer: 1, name: "Frischling", ab: 0 },
  { nummer: 2, name: "Grinder", ab: 25 },
  { nummer: 3, name: "Terminjäger", ab: 60 },
  { nummer: 4, name: "Closer", ab: 150 },
  { nummer: 5, name: "Quotengott", ab: 350 },
  { nummer: 6, name: "Legende", ab: 750 },
];

/** Schluessel in der Tabelle "Einstellung" fuer die sechs Stufennamen. */
export const STUFEN_TITEL_SCHLUESSEL = "stufen.titel";

/** Ein kompletter Namens-Satz, wie ihn die Werkstatt als Knopf anbietet. */
export type TitelSatz = {
  /** Beschriftung des Knopfs. */
  name: string;
  /** Die sechs Stufennamen dieses Satzes, Stufe 1 zuerst. */
  titel: readonly string[];
};

// Die drei Vorschlaege aus docs/emil-feedback-runde-2.md (Abschnitt 7,
// AP-25). Mix ist zugleich der Inhalt von STUFEN oben - eine Liste, nicht
// zwei, die auseinanderlaufen koennten.
export const TITEL_SAETZE: readonly TitelSatz[] = [
  { name: "Mix", titel: STUFEN.map((stufe) => stufe.name) },
  {
    name: "Gaming-Flex",
    titel: ["Rookie", "Grinder", "Hustler", "Closer", "Endboss", "Legende"],
  },
  {
    name: "Vertriebs-Ironie",
    titel: [
      "Kaltakquise-Küken",
      "Wählscheiben-Warrior",
      "Terminmaschine",
      "Abschluss-Automat",
      "Quotengott",
      "Lebende Legende",
    ],
  },
];

/**
 * Die sechs Stufennamen aus der Werkstatt, sonst der Mix-Satz aus STUFEN.
 *
 * Gecacht wie alleSchwellen() in lib/einheiten.ts: eine Abfrage je Anfrage -
 * Arena und /spiel fragen auf derselben Seite nacheinander denselben
 * Schluessel ab.
 *
 * Fehlende Zeile, kaputtes JSON, eine falsche Laenge oder ein leerer Name
 * darin zaehlen alle als "nicht gesetzt" und fallen auf STUFEN zurueck -
 * dieselbe Regel wie ganzzahl() in lib/einstellungen.ts: was nicht sauber
 * durchkommt, ist kein Wert.
 */
export const ladeStufenTitel = cache(async (): Promise<string[]> => {
  const standard = STUFEN.map((stufe) => stufe.name);
  const werte = await einstellungen();
  const roh = werte?.get(STUFEN_TITEL_SCHLUESSEL);
  if (roh === undefined) return standard;

  try {
    const liste: unknown = JSON.parse(roh);
    const gueltig =
      Array.isArray(liste) &&
      liste.length === STUFEN.length &&
      liste.every((name) => typeof name === "string" && name.trim().length > 0);
    return gueltig ? (liste as string[]) : standard;
  } catch {
    return standard;
  }
});

export type StufenStand = {
  stufe: Stufe;
  naechste: Stufe | null;
  /** Punkte bis zur nächsten Stufe. 0, wenn die letzte erreicht ist. */
  bisNaechste: number;
  /** Fortschritt innerhalb der laufenden Stufe, 0…1. Auf der letzten: 1. */
  anteil: number;
  gesamt: number;
};

/**
 * @param titel Sechs Namen aus ladeStufenTitel(), Stufe 1 zuerst - ohne
 *   Parameter (oder mit Luecken darin) gilt an der jeweiligen Stelle der
 *   Name aus STUFEN. So bleibt jeder heutige und kuenftige Aufrufer ohne
 *   Anpassung lauffaehig und zeigt dann den Mix-Satz.
 */
export function stufeVon(gesamtpunkte: number, titel?: string[]): StufenStand {
  const punkte = Math.max(0, Math.trunc(gesamtpunkte));

  let index = 0;
  for (let i = 0; i < STUFEN.length; i += 1) {
    if (punkte >= STUFEN[i]!.ab) index = i;
  }

  const stufeAn = (i: number): Stufe => {
    const basis = STUFEN[i]!;
    const name = titel?.[i]?.trim();
    return name ? { ...basis, name } : basis;
  };

  const stufe = stufeAn(index);
  const naechste = index + 1 < STUFEN.length ? stufeAn(index + 1) : null;

  if (!naechste) {
    return { stufe, naechste: null, bisNaechste: 0, anteil: 1, gesamt: punkte };
  }

  const spanne = naechste.ab - stufe.ab;
  return {
    stufe,
    naechste,
    bisNaechste: naechste.ab - punkte,
    anteil: spanne > 0 ? (punkte - stufe.ab) / spanne : 1,
    gesamt: punkte,
  };
}
