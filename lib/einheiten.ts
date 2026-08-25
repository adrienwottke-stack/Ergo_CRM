// Einheiten und Kernstufe (docs/einheiten-plan.md).
//
// Das Werkzeug zaehlt bis hierhin Taetigkeiten: Anrufe, Nummern, Termine,
// Abschluesse. Das ist die richtige Waehrung fuer den Anfang - wer noch nichts
// erreicht hat, kann wenigstens fleissig sein. Es ist aber nicht die Waehrung,
// in der der Betrieb rechnet. Dort zaehlen EINHEITEN, und an ihnen haengt die
// KERNSTUFE.
//
// Drei Regeln, die den Rest erklaeren:
//
// 1. HIER ENTSTEHT KEINE UMSATZRECHNUNG. Sparte, Monatsbeitrag,
//    Laufzeitfaktoren und "100 Euro = 82 Einheiten" sind beim
//    Kernmodell-Rueckbau rausgeflogen (docs/audit-kernmodell.md, 3.11) und
//    kommen nicht wieder. Eine Einheit ist hier eine gemeldete Zahl mit einem
//    Datum daran.
// 2. EINHEITEN SIND KEINE WETTBEWERBSPUNKTE. Sie stehen in keiner Rangliste
//    und in keiner Stufe aus lib/stufen.ts. Waeren sie drin, schluege Verkauf
//    den Aufbau - und die gesamte Punktehistorie waere rueckwirkend eine
//    andere. Dieselbe Ueberlegung wie bei der Anwesenheit, die deshalb kein
//    sechster QuotaType wurde.
// 3. ALLES, WAS SPAETER ANDERS SEIN KOENNTE, STEHT ALS EINE KONSTANTE HIER.
//    Der Schnitt des Produktionsmonats und die Schwelle zu Kernstufe 2 sind
//    Fragen an die Praxis, nicht an den Code.

import { prisma } from "@/lib/prisma";
import { addDays, addMonths, dayToUtcDate } from "@/lib/dates";

// --- Rechnen in Hundertsteln ------------------------------------------------
// Gespeichert wird eine ganze Zahl: 350 = 3,50 Einheiten. Kein Decimal - das
// ist bei Prisma eine Klasseninstanz und ueberlebt die Grenze zu einer
// Client-Komponente nicht. Diese Datei ist die einzige Stelle, an der aus
// "3,5" eine 350 wird und zurueck.

/** Hoechstbetrag einer einzelnen Buchung. Alles darueber ist ein Tippfehler. */
export const BUCHUNG_MAX = 100_000 * 100;

const zahlFormat = new Intl.NumberFormat("de-DE", {
  maximumFractionDigits: 2,
});

export function formatEinheiten(hundertstel: number): string {
  return zahlFormat.format(hundertstel / 100);
}

/**
 * "3,5" | "3.5" | "1.000" | "1.234,75" | "-12" -> Hundertstel.
 * null, wenn es keine Zahl ist.
 *
 * DER PUNKT IST ZWEIDEUTIG, und zwar auf eine teure Art: in "1.234,75" trennt
 * er Tausender, in "3.5" die Nachkommastelle. Bei einer Karrierezahl ist der
 * Unterschied ein Faktor 1000 - "1.000" als 1,00 zu lesen waere die Art
 * Fehler, die niemand mehr findet.
 *
 * Zwei Regeln, in dieser Reihenfolge:
 *   1. Steht ein Komma da, sind alle Punkte Tausendertrenner.
 *   2. Ohne Komma gilt eine Dreiergruppierung ("1.000", "12.500.000") als
 *      Tausendertrennung. Alles andere ("3.5", "12.50") ist ein Dezimalpunkt.
 */
export function parseEinheiten(roh: string): number | null {
  const sauber = roh.trim().replace(/\s/g, "");
  if (!sauber) return null;
  const tausendergruppiert = /^-?\d{1,3}(\.\d{3})+$/.test(sauber);
  const normalisiert =
    sauber.includes(",") || tausendergruppiert
      ? sauber.replace(/\./g, "").replace(",", ".")
      : sauber;
  if (!/^-?\d+(\.\d+)?$/.test(normalisiert)) return null;
  const wert = Math.round(Number(normalisiert) * 100);
  if (!Number.isFinite(wert)) return null;
  return Math.max(-BUCHUNG_MAX, Math.min(BUCHUNG_MAX, wert));
}

// --- Der Produktionsmonat ---------------------------------------------------
// Voreinstellung: der Kalendermonat, Europe/Berlin, wie jeder andere Zeitraum
// im Werkzeug.
//
// Schneidet der Betrieb anders (Stichtag 16., "bis zum letzten Arbeitstag"),
// ist das EINE Zahl hier - keine Aufrufstelle erfaehrt davon. Die Buchung
// traegt ein Datum und keine Monatszuordnung, deshalb laesst sich der Schnitt
// aendern, ohne Daten anzufassen.
export const PRODUKTIONSMONAT_ERSTER_TAG = 1;

const monatsFormat = new Intl.DateTimeFormat("de-DE", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export type Produktionsmonat = {
  /** Erster Tag, UTC-Mitternacht - direkt als Prisma-Filter verwendbar. */
  start: Date;
  /** Letzter Tag, UTC-Mitternacht. */
  ende: Date;
  /** "August 2026" - benannt nach dem Monat, in dem der Zeitraum beginnt. */
  label: string;
};

export function produktionsmonat(tag: string): Produktionsmonat {
  const datum = dayToUtcDate(tag);
  const vorDemStichtag = datum.getUTCDate() < PRODUKTIONSMONAT_ERSTER_TAG;
  const ersterDesMonats = new Date(
    Date.UTC(
      datum.getUTCFullYear(),
      datum.getUTCMonth() + (vorDemStichtag ? -1 : 0),
      1
    )
  );
  // Kurze Monate: ein Stichtag am 31. faellt im Februar auf den Letzten.
  const tageImMonat = new Date(
    Date.UTC(
      ersterDesMonats.getUTCFullYear(),
      ersterDesMonats.getUTCMonth() + 1,
      0
    )
  ).getUTCDate();
  const start = new Date(ersterDesMonats.getTime());
  start.setUTCDate(Math.min(PRODUKTIONSMONAT_ERSTER_TAG, tageImMonat));

  return {
    start,
    ende: addDays(addMonths(start, 1), -1),
    label: monatsFormat.format(start),
  };
}

// --- Die Kernstufe ----------------------------------------------------------
// "Kernstufe" und nicht "Stufe": lib/stufen.ts belegt das Wort im selben
// Bereich schon (Anwaerter bis Veteran, gerechnet aus Wettbewerbspunkten,
// sichtbar auf /spiel). Zwei Dinge gleich zu nennen waere der sichere Weg in
// die Verwechslung.

export const KERNSTUFE_MIN = 1;
export const KERNSTUFE_MAX = 9;

/**
 * Was es bis zur naechsten Kernstufe braucht, in Hundertsteln.
 *
 * Die 500 stehen schon in docs/recruiting-plan.md ("nach ~500 Einheiten besteht
 * der Alltag aus Rekrutierung") und sind dort als offener Punkt markiert.
 *
 * Fuer Kernstufe 2 aufwaerts steht hier ABSICHTLICH nichts: eine erfundene
 * Schwelle ist schlimmer als keine, weil sie jemandem sagt, er sei fast da.
 * Ohne Eintrag zeigt die Seite die Zahlen und die Runde, aber keinen Balken.
 */
export const SCHWELLEN: Record<number, number> = {
  1: 500 * 100,
};

export function schwelleFuer(kernstufe: number | null): number | null {
  if (kernstufe === null) return null;
  return SCHWELLEN[kernstufe] ?? null;
}

export function istKernstufe(wert: number): boolean {
  return (
    Number.isInteger(wert) && wert >= KERNSTUFE_MIN && wert <= KERNSTUFE_MAX
  );
}

// --- Die Stufenrunde --------------------------------------------------------
// Wer dieselbe Kernstufe traegt, sieht die Einheiten der anderen - ueber die
// ganze Instanz, quer durch alle Aeste.
//
// Das ist BEWUSST NICHT lib/scope.ts. Dort liegt die Struktur-Grenze ("ich und
// alles unter mir"), und sie bleibt unangetastet. Die Runde ist eine zweite,
// flache Grenze mit einer anderen Frage dahinter: nicht "wen fuehre ich",
// sondern "wer ist so weit wie ich". Deshalb steht sie hier und nirgends sonst.
//
// Sichtbar wird ausschliesslich, was auch die Rangliste zeigt: Name und Zahl.
// Keine Kontaktdaten, keine Pipeline, keine Kundennamen.

export type EinheitenStand = {
  userId: string;
  name: string;
  /** Startbestand plus alle Buchungen, in Hundertsteln. */
  gesamt: number;
  /** Buchungen im laufenden Produktionsmonat, in Hundertsteln. */
  monat: number;
  istDu: boolean;
};

export type EinheitenSeite = {
  monat: Produktionsmonat;
  ich: EinheitenStand;
  /**
   * Die Runde inklusive der eigenen Zeile, sortiert nach dem laufenden Monat.
   * Leer, solange keine Kernstufe eingetragen ist.
   *
   * Sortiert nach MONAT, nicht nach Gesamt: Gesamt ist Biografie - wer lange
   * dabei ist, steht dort immer vorn, und die Liste waere jeden Monat dieselbe.
   */
  runde: EinheitenStand[];
  /** Was die eigene Kernstufe bis zur naechsten braucht, oder null. */
  schwelle: number | null;
};

type Betrachter = {
  id: string;
  name: string;
  kernstufe: number | null;
  einheitenStart: number;
};

export async function ladeEinheiten(
  betrachter: Betrachter,
  heute: string
): Promise<EinheitenSeite> {
  const monat = produktionsmonat(heute);

  // Platzhalter (Konten ohne Zugangsdaten) und Ausgetretene stehen in keiner
  // Runde: wer nie gearbeitet hat, hat keine Einheiten.
  const konten =
    betrachter.kernstufe === null
      ? []
      : await prisma.user.findMany({
          where: {
            kernstufe: betrachter.kernstufe,
            deactivatedAt: null,
            passwordHash: { not: null },
          },
          select: { id: true, name: true, einheitenStart: true },
        });

  if (!konten.some((konto) => konto.id === betrachter.id)) {
    konten.push({
      id: betrachter.id,
      name: betrachter.name,
      einheitenStart: betrachter.einheitenStart,
    });
  }

  const ids = konten.map((konto) => konto.id);
  const [gesamtZeilen, monatsZeilen] = await Promise.all([
    prisma.einheitenbuchung.groupBy({
      by: ["userId"],
      where: { userId: { in: ids } },
      _sum: { hundertstel: true },
    }),
    prisma.einheitenbuchung.groupBy({
      by: ["userId"],
      where: { userId: { in: ids }, tag: { gte: monat.start, lte: monat.ende } },
      _sum: { hundertstel: true },
    }),
  ]);

  const gesamtJe = new Map(
    gesamtZeilen.map((zeile) => [zeile.userId, zeile._sum.hundertstel ?? 0])
  );
  const monatJe = new Map(
    monatsZeilen.map((zeile) => [zeile.userId, zeile._sum.hundertstel ?? 0])
  );

  const staende: EinheitenStand[] = konten.map((konto) => ({
    userId: konto.id,
    name: konto.name,
    gesamt: konto.einheitenStart + (gesamtJe.get(konto.id) ?? 0),
    monat: monatJe.get(konto.id) ?? 0,
    istDu: konto.id === betrachter.id,
  }));

  staende.sort(
    (a, b) =>
      b.monat - a.monat || b.gesamt - a.gesamt || a.name.localeCompare(b.name)
  );

  return {
    monat,
    ich: staende.find((stand) => stand.istDu)!,
    runde: betrachter.kernstufe === null ? [] : staende,
    schwelle: schwelleFuer(betrachter.kernstufe),
  };
}
