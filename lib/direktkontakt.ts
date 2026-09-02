// Der Direktkontakttrichter (docs/emil-feedback-runde-2.md, AP-21; CONTEXT.md).
//
// Direktkontakt ist die Ansprache eines FREMDEN Menschen - auf der Strasse,
// ueber Instagram - mit dem Ziel, einen Geschaeftspartner zu gewinnen. Das ist
// etwas anderes als die Namensliste, und deshalb steht hier eine eigene Zahl
// statt eines weiteren QuotaType.
//
// Drei Festlegungen, die den Rest erklaeren:
//
// 1. GEZAEHLT WIRD, WAS PASSIERT IST - NICHT, WEM. Auf der Strasse tippt
//    niemand einen Namen ein (Entscheidung D16). Wer aus einer Ansprache ein
//    Kontakt wird, wird weiterhin ganz normal als Contact angelegt; die beiden
//    Wege beruehren sich nicht.
// 2. NUR DIE EIGENEN ZAHLEN. Kein Team-Vergleich wie im Verkaufs-Trichter: die
//    Direktansprache macht heute eine Handvoll Leute, ein "Team 12 %" aus drei
//    Koepfen ist kein Massstab, sondern ein Zufall. Die Zahl daneben waere
//    schlimmer als keine.
// 3. DIE FRAGE IST DER UEBERGANG, NICHT DIE STUFE. Wie im Trichter: "40
//    angesprochen" sagt nichts, "40 angesprochen, 2 Nummern" sagt alles.
//
// JEDE ABFRAGE HAT EINEN FAENGER. Die Migration
// (20260901120000_direktkontakt) laeuft erst beim naechsten Deploy; bis dahin
// gibt es die Tabelle nicht. Eine Seite, die deswegen abstuerzt, waere
// schlimmer als eine Seite, die leer dasteht - dasselbe Muster wie in
// app/wegweiserAction.ts und lib/features.ts.

import { prisma } from "@/lib/prisma";
import { berlinToday, dayToUtcDate, shiftDay, startOfWeek } from "@/lib/dates";
import type { DirektkontaktStufe } from "@/lib/generated/prisma/enums";

// --- Die fuenf Stufen --------------------------------------------------------
// Emils Worte, nicht die des Lehrbuchs. "Termin vereinbart" heisst vereinbart -
// gehalten wird hier nichts gezaehlt, dafuer gibt es /trichter.
//
// Die Reihenfolge dieser Liste IST der Trichter. Sie steht an genau einer
// Stelle, damit Zaehlerreihe, Grafik und Quotenrechnung nie auseinanderlaufen.

export type DirektkontaktStufeDef = {
  key: DirektkontaktStufe;
  titel: string;
  /** Was zu tun ist, wenn es bei DIESEM Uebergang hakt. */
  hinweis: string;
};

export const DIREKTKONTAKT_STUFEN: readonly DirektkontaktStufeDef[] = [
  {
    key: "ANGESPROCHEN",
    titel: "Angesprochen",
    hinweis: "Der Anfang. Ohne Ansprache passiert dahinter nichts.",
  },
  {
    key: "INSTAGRAM",
    titel: "Instagram",
    hinweis: "Hakt es hier, endet das Gespräch vor dem Austausch.",
  },
  {
    key: "NUMMER",
    titel: "Nummer",
    hinweis: "Hakt es hier, bleibt es beim Folgen — frag nach der Nummer.",
  },
  {
    key: "TERMIN",
    titel: "Termin vereinbart",
    hinweis: "Hakt es hier, fehlt der Grund, sich zu treffen.",
  },
  {
    key: "REKRUTIERT",
    titel: "Rekrutiert",
    hinweis: "Hakt es hier, liegt es am Termin selbst — nicht an der Menge.",
  },
] as const;

// --- Der Zeitraum ------------------------------------------------------------
// Dieselben drei Fenster und dieselben Beschriftungen wie auf /trichter: zwei
// Trichter mit verschieden benannten Zeitraeumen waeren zwei Werkzeuge.

export type Fenster = "woche" | "monat" | "immer";

export const DIREKTKONTAKT_FENSTER: { key: Fenster; label: string }[] = [
  { key: "woche", label: "Diese Woche" },
  { key: "monat", label: "30 Tage" },
  { key: "immer", label: "Insgesamt" },
];

/** Was aus ?zeit= herauskommt. Alles Unbekannte ist die Woche. */
export function fensterVon(roh: string | undefined): Fenster {
  return roh === "monat" || roh === "immer" ? roh : "woche";
}

// --- Formatierung ------------------------------------------------------------
// Bewusst hier und nicht in der Grafik: der Server rechnet und formatiert, die
// Komponente zeigt nur an (Muster SchnellStand, lib/stats.ts). Die beiden
// Helfer sind absichtlich Zwillinge derer in app/(app)/trichter/page.tsx -
// dieselbe Aussage soll ueberall gleich aussehen.

function quote(teil: number, ganz: number): string {
  if (ganz === 0) return "–";
  return `${Math.round((teil / ganz) * 100)} %`;
}

// Echtes Minuszeichen (U+2212), nicht der Bindestrich der Tastatur: sonst
// sieht "-12" neben den randgleichen Zahlen wie ein Tippfehler aus.
function dropOffText(vorher: number, wert: number): string {
  const differenz = vorher - wert;
  if (differenz > 0) return `−${differenz}`;
  if (differenz < 0) return `+${-differenz}`;
  return "±0";
}

// --- Die Ansicht -------------------------------------------------------------

export type DirektkontaktUebergang = {
  /** Quote zur Vorstufe, z. B. "12 %" - oder "–", wenn die Vorstufe bei 0 stand. */
  quote: string;
  /** vorher − wert, mit echtem Minuszeichen. "±0" bei keiner Bewegung. */
  dropOff: string;
  /** Diese Stufe hat von allen Uebergaengen die schwaechste Quote. */
  engpass: boolean;
};

export type DirektkontaktStufeAnsicht = {
  key: DirektkontaktStufe;
  titel: string;
  wert: number;
  /** wert / groesste (0..1) - bestimmt die Breite des Bandes in der Grafik. */
  anteil: number;
  hinweis: string;
  /** null nur bei der ersten Stufe: sie hat keine Vorstufe. */
  uebergang: DirektkontaktUebergang | null;
};

export type DirektkontaktBild = {
  stufen: DirektkontaktStufeAnsicht[];
  /** Summe ueber alle Stufen. 0 heisst: in diesem Zeitraum wurde nichts gezählt. */
  gesamt: number;
};

/** Untere Grenze des Zeitfensters. null = ohne Grenze ("Insgesamt"). */
function abTag(fenster: Fenster): Date | null {
  const heute = berlinToday();
  if (fenster === "woche") return startOfWeek(heute);
  if (fenster === "monat") return dayToUtcDate(shiftDay(heute, -30));
  return null;
}

/**
 * Der Trichter einer Person ueber ein Zeitfenster.
 *
 * Die Tageszaehler werden je Stufe aufsummiert; daraus entstehen Breite
 * (Anteil an der groessten Stufe) und Uebergangsquote zur jeweiligen Vorstufe.
 *
 * Der Engpass ist der SCHWAECHSTE Uebergang, gemessen an der eigenen Quote -
 * dieselbe Rechnung wie auf /trichter. Uebergaenge, deren Vorstufe bei 0 steht,
 * zaehlen nicht mit: eine Quote aus null Ansprachen ist keine Erkenntnis.
 */
export async function ladeDirektkontakt(
  userId: string,
  fenster: Fenster
): Promise<DirektkontaktBild> {
  const ab = abTag(fenster);

  const zeilen = await prisma.direktkontaktTag
    .groupBy({
      by: ["stufe"],
      where: { ownerId: userId, ...(ab ? { tag: { gte: ab } } : {}) },
      _sum: { anzahl: true },
    })
    .catch(() => [] as { stufe: DirektkontaktStufe; _sum: { anzahl: number | null } }[]);

  const jeStufe = new Map(
    zeilen.map((zeile) => [zeile.stufe, zeile._sum.anzahl ?? 0])
  );
  const werte = DIREKTKONTAKT_STUFEN.map((stufe) => jeStufe.get(stufe.key) ?? 0);
  const groesste = Math.max(1, ...werte);

  // Erst alle Uebergaenge rechnen, dann den schwaechsten suchen: der Engpass
  // ist eine Aussage ueber den ganzen Trichter, nicht ueber eine Stufe.
  const anteile = werte.map((wert, i) => {
    const vorher = i > 0 ? werte[i - 1]! : 0;
    return i > 0 && vorher > 0 ? wert / vorher : null;
  });
  let engpassIndex = -1;
  anteile.forEach((anteil, i) => {
    if (anteil === null) return;
    if (engpassIndex === -1 || anteil < anteile[engpassIndex]!) engpassIndex = i;
  });

  const stufen = DIREKTKONTAKT_STUFEN.map((stufe, i) => {
    const wert = werte[i]!;
    const vorher = i > 0 ? werte[i - 1]! : 0;
    return {
      key: stufe.key,
      titel: stufe.titel,
      wert,
      anteil: wert / groesste,
      hinweis: stufe.hinweis,
      uebergang:
        i > 0
          ? {
              quote: quote(wert, vorher),
              dropOff: dropOffText(vorher, wert),
              engpass: i === engpassIndex,
            }
          : null,
    };
  });

  return {
    stufen,
    gesamt: werte.reduce((summe, wert) => summe + wert, 0),
  };
}

/**
 * Was heute schon steht - die Zahl ueber jedem Schnellzaehler.
 *
 * Getrennt von ladeDirektkontakt, weil es eine andere Frage ist: der Trichter
 * schaut auf einen Zeitraum, der Zaehler auf den Tag, an dem gerade jemand auf
 * der Strasse steht. Beide laufen auf derselben Seite in EINEM Promise.all.
 */
export async function heuteStand(
  userId: string
): Promise<Record<DirektkontaktStufe, number>> {
  const leer = Object.fromEntries(
    DIREKTKONTAKT_STUFEN.map((stufe) => [stufe.key, 0])
  ) as Record<DirektkontaktStufe, number>;

  const zeilen = await prisma.direktkontaktTag
    .findMany({
      where: { ownerId: userId, tag: dayToUtcDate(berlinToday()) },
      select: { stufe: true, anzahl: true },
    })
    .catch(() => [] as { stufe: DirektkontaktStufe; anzahl: number }[]);

  for (const zeile of zeilen) leer[zeile.stufe] = zeile.anzahl;
  return leer;
}

/** Gehoert der Wert zu den fuenf Stufen? Riegel der Server-Action. */
export function istDirektkontaktStufe(wert: string): wert is DirektkontaktStufe {
  return DIREKTKONTAKT_STUFEN.some((stufe) => stufe.key === wert);
}
