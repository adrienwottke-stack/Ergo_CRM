// Coaching-Hinweise fuer die Personenseite (docs/emil-feedback-runde-2.md,
// Abschnitt 7, AP-19; Anlass N7 - "Empfehlungen fuer 1:1-Coachings" aus den
// Daten der Geschaeftspartner ableiten).
//
// REINE FUNKTIONEN, KEIN SPRACHMODELL. Dieselbe Hausregel wie bei den
// Signalen (lib/signale.ts) und dem Teamabend-Rueckblick (lib/rueckblick.ts):
// eine Empfehlung, die eine Fuehrungskraft vor einem Menschen ausspricht, muss
// sich auf eine Zeile Code zurueckfuehren lassen. Kein Prompt, kein Zufall,
// keine Push-Nachricht - dieselbe Eingabe ergibt immer dieselbe Ausgabe.
//
// DREI REGELN PLUS EIN AUFFANGNETZ, IN DIESER REIHENFOLGE GEPRUEFT:
//   1. Engpass    - die schwaechste Uebergangsquote der letzten vier Wochen
//                   (Anrufe -> vereinbart, vereinbart -> gehalten), wenn ihre
//                   Stufe genug Faelle traegt (Mindestbasis).
//   2. Trend      - die Anrufe der letzten zwei Wochen gegen die zwei davor:
//                   ein deutlicher Rueckgang ist eine eigene Zeile wert.
//   3. Stillstand - seit wann nichts mehr eingetragen wurde.
// Alle drei koennen gleichzeitig zutreffen (bis zu drei Saetze); trifft keine
// zu, steht genau ein Satz Anerkennung mit einer echten Zahl - der Block soll
// nie leer bleiben und nie werten, ohne eine Zahl zu nennen.
//
// ALLE SCHWELLEN SIND VORLAEUFIG. Es gibt noch keine Praxiswoche, an der sich
// "10 Anrufe sind eine Basis" oder "30 % weniger ist ein Trend" belegen liesse
// - dieselbe Lage wie bei SCHWELLEN in lib/einheiten.ts. Emil kalibriert sie,
// sobald echte Zahlen laufen; bis dahin stehen sie hier an einer Stelle, mit
// Begruendung, statt verstreut im Text.

import { dayToUtcDate } from "@/lib/dates";
import type { Aktivitaetstag } from "@/lib/aktivitaeten";

// --- Die Schwellen, an einer Stelle ------------------------------------------

/** Zeitfenster fuer die Engpass-Erkennung: vier volle Wochen. Kuerzer waere
 *  ein einzelner schwacher Tag schon die halbe Kurve. */
export const ENGPASS_FENSTER_TAGE = 28;

/** Unter dieser Anrufzahl sagt die Anrufe-zu-Termin-Quote nichts: ein
 *  einziger Fehlschlag ergaebe 0 % und behauptete einen Engpass, wo kaum
 *  telefoniert wurde. */
export const MINDESTBASIS_ANRUFE = 10;

/** Dieselbe Ueberlegung fuer vereinbart-zu-gehalten, mit der kleineren Basis
 *  dieser spaeteren Stufe: drei vereinbarte Termine, sonst kippt ein
 *  einziger Ausfall die Quote auf 0 %. */
export const MINDESTBASIS_VEREINBART = 3;

/** Fenster fuer den Trend-Vergleich: die letzten zwei Wochen gegen die zwei
 *  davor. Eine einzelne schwache Woche ist Alltag, zwei mit Rueckgang sind
 *  ein Muster. */
export const TREND_FENSTER_TAGE = 14;

/** Ohne mindestens so viele Anrufe in der VORHERIGEN Zweiwochen-Spanne ist
 *  ein Rueckgang (z. B. von 2 auf 0) Rauschen, kein Trend. */
export const TREND_MINDESTBASIS = 10;

/** Ab diesem relativen Rueckgang gegenueber der Vorspanne ist der Trend eine
 *  eigene Zeile wert - 30 % weniger als in den zwei Wochen davor. */
export const TREND_RUECKGANG_SCHWELLE = 0.3;

/** Ab so vielen Tagen ohne jeden Eintrag wird Stillstand zur eigenen Zeile -
 *  eine Werktagswoche. */
export const STILLSTAND_TAGE_SCHWELLE = 5;

// --- Kleine Helfer, reine Rechnung -------------------------------------------

const TAG_MS = 86_400_000;

/** "2026-08-28" -> Tagesnummer seit der Epoche - ganzzahlig vergleichbar,
 *  ohne bei jedem Vergleich ein Date-Objekt zu subtrahieren. Derselbe Kniff
 *  wie tagNummer() in components/VerlaufsChart.tsx. */
function tagNummer(tag: string): number {
  return Math.round(dayToUtcDate(tag).getTime() / TAG_MS);
}

/** Anteil als Bruch (0..1) fuer Vergleiche - 0, wenn die Basis 0 ist: eine
 *  Quote ohne Nenner ist keine Aussage, aber auch kein Fehler. */
function anteil(teil: number, basis: number): number {
  return basis === 0 ? 0 : teil / basis;
}

/** Derselbe Anteil, gerundet und mit Prozentzeichen fuer den Anzeigetext -
 *  "5 %", nicht "5.0 %" (Schreibweise wie in lib/rueckblick.ts). */
function prozentText(teil: number, basis: number): string {
  return `${Math.round(anteil(teil, basis) * 100)} %`;
}

/** Summe der drei Taetigkeiten ueber ein Fenster [vonNr, bisNr], beide
 *  Grenzen eingeschlossen. */
function summeFenster(
  tage: Aktivitaetstag[],
  vonNr: number,
  bisNr: number
): { anrufe: number; vereinbart: number; gehalten: number } {
  let anrufe = 0;
  let vereinbart = 0;
  let gehalten = 0;
  for (const eintrag of tage) {
    const nr = tagNummer(eintrag.tag);
    if (nr < vonNr || nr > bisNr) continue;
    anrufe += eintrag.anrufe;
    vereinbart += eintrag.vereinbart;
    gehalten += eintrag.gehalten;
  }
  return { anrufe, vereinbart, gehalten };
}

// --- Die Regeln ---------------------------------------------------------------

/**
 * Zwei bis vier trockene Saetze fuers 1:1 - Engpass, Trend und Stillstand
 * koennen gleichzeitig stehen; trifft nichts zu, ersetzt ein Anerkennungssatz
 * die leere Liste.
 *
 * Rein: dieselbe Eingabe ergibt immer dieselbe Ausgabe, keine Datenbank, kein
 * Datum aus der Systemuhr - `heute` kommt als Parameter herein, genau wie bei
 * VerlaufsChart und lib/rueckblick.ts.
 */
export function coachingHinweise({
  tage,
  stillSeitTage,
  heute,
}: {
  /** Die eigenen Tageswerte der Person (eigeneAktivitaeten(person.id).tage) -
   *  nicht die des Astes: das 1:1 handelt von genau diesem Menschen. */
  tage: Aktivitaetstag[];
  /** Tage seit dem letzten Eintrag - null, wenn es noch nie einen gab. */
  stillSeitTage: number | null;
  /** Berliner Heute, "2026-08-28" - dieselbe Form wie Aktivitaetstag.tag. */
  heute: string;
}): string[] {
  const saetze: string[] = [];
  const heuteNr = tagNummer(heute);

  // --- Engpass: die schwaechste Uebergangsquote der letzten vier Wochen,
  //     deren Stufe die Mindestbasis traegt. Nur EIN Satz - "die kleinste
  //     Quote", nicht beide Stufen gleichzeitig.
  const vierWochen = summeFenster(tage, heuteNr - (ENGPASS_FENSTER_TAGE - 1), heuteNr);
  const engpassKandidaten: { wert: number; satz: string }[] = [];
  if (vierWochen.anrufe >= MINDESTBASIS_ANRUFE) {
    engpassKandidaten.push({
      wert: anteil(vierWochen.vereinbart, vierWochen.anrufe),
      satz: `Aus ${vierWochen.anrufe} Anrufen ${
        vierWochen.vereinbart === 1
          ? "wurde 1 Termin"
          : `wurden ${vierWochen.vereinbart} Termine`
      } (${prozentText(vierWochen.vereinbart, vierWochen.anrufe)}) — im 1:1 die Terminierung üben.`,
    });
  }
  if (vierWochen.vereinbart >= MINDESTBASIS_VEREINBART) {
    engpassKandidaten.push({
      wert: anteil(vierWochen.gehalten, vierWochen.vereinbart),
      satz: `Von ${vierWochen.vereinbart} vereinbarten Terminen ${
        vierWochen.gehalten === 1
          ? "wurde 1 gehaltener Termin"
          : `wurden ${vierWochen.gehalten} gehaltene Termine`
      } (${prozentText(vierWochen.gehalten, vierWochen.vereinbart)}) — im 1:1 klären, woran das liegt.`,
    });
  }
  if (engpassKandidaten.length > 0) {
    // Bei Gleichstand gewinnt der FRUEHERE Uebergang im Trichter (Index 0) -
    // dieselbe Regel wie beim Teamabend-Engpass (lib/rueckblick.ts): weiter
    // vorn zu reparieren wirkt auf alles dahinter.
    const schwaechster = engpassKandidaten.reduce((a, b) => (b.wert < a.wert ? b : a));
    saetze.push(schwaechster.satz);
  }

  // --- Trend: Anrufe der letzten zwei Wochen gegen die zwei Wochen davor.
  //     Nur ein deutlicher UND auf einer echten Basis stehender Rueckgang
  //     wird zur Zeile - sonst waere jede Alltagsschwankung ein Hinweis.
  const aktuellVon = heuteNr - (TREND_FENSTER_TAGE - 1);
  const aktuelleAnrufe = summeFenster(tage, aktuellVon, heuteNr).anrufe;
  const vorherBis = aktuellVon - 1;
  const vorherVon = vorherBis - (TREND_FENSTER_TAGE - 1);
  const vorherigeAnrufe = summeFenster(tage, vorherVon, vorherBis).anrufe;
  if (
    vorherigeAnrufe >= TREND_MINDESTBASIS &&
    aktuelleAnrufe <= vorherigeAnrufe * (1 - TREND_RUECKGANG_SCHWELLE)
  ) {
    saetze.push(
      `Anrufe: ${aktuelleAnrufe} gegenüber ${vorherigeAnrufe} in den zwei Wochen davor — nachfragen, was sich geändert hat.`
    );
  }

  // --- Stillstand: kein Eintrag seit STILLSTAND_TAGE_SCHWELLE Tagen - oder
  //     noch nie einer, wenn stillSeitTage null ist (keine Tageszahl, die es
  //     dafuer gaebe, derselbe Aufruf wie fuer die Signale in
  //     lib/fuehrung.ts: `letzteAktivitaet ? tageSeit(...) : null`).
  if (stillSeitTage === null) {
    saetze.push("Noch keinen Eintrag erfasst — Kontakt aufnehmen, nicht warten.");
  } else if (stillSeitTage >= STILLSTAND_TAGE_SCHWELLE) {
    saetze.push(
      `Seit ${stillSeitTage} ${stillSeitTage === 1 ? "Tag" : "Tagen"} kein Eintrag — Kontakt aufnehmen, nicht warten.`
    );
  }

  // --- Auffangnetz: trifft keine Regel zu, steht eine Zeile Anerkennung mit
  //     echter Zahl - derselbe Vierwochen-Ausschnitt wie beim Engpass oben.
  if (saetze.length === 0) {
    saetze.push(
      `Läuft: ${vierWochen.vereinbart} ${
        vierWochen.vereinbart === 1 ? "Termin" : "Termine"
      } aus ${vierWochen.anrufe} Anrufen in vier Wochen.`
    );
  }

  return saetze;
}
