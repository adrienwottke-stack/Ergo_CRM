// Aktivitaets-Verlauf: Tageswerte fuer Anrufe, vereinbarte und gehaltene
// Termine - der fehlende Rohstoff fuer eine Kurve, wo es bisher nur
// Zeitraum-Summen gab (docs/emil-feedback-runde-2.md, Abschnitt 7, AP-16).
//
// lib/einheiten.ts liefert seit dem Lagebild-Bau Tageswerte fuer Einheiten
// (eigenerVerlauf, strukturVerlauf) - genau dem Muster folgt diese Datei fuer
// Anrufe und Termine. Dafuer gab es bisher keine Kurve, nur Zeitraum-Summen in
// der Mannschaftsmatrix: `Werte` in lib/fuehrung.ts (Typ ab Zeile 46) traegt
// anrufeWoche, vereinbart14, gehalten14 als fertige Zahlen, nie als Reihe.
// Ohne Tagesaufloesung dahinter laesst sich daraus keine Kurve zeichnen (N2,
// N5, N6 der Feedback-Runde) - das ist die ganze Existenzberechtigung dieser
// Datei.
//
// DIESELBE DATENQUELLE WIE DIE MATRIX, UND ZWAR EXAKT:
//
//   Tabelle:      DailyLog (schema.prisma) - QuotaType CALL, APPOINTMENT_SET,
//                 APPOINTMENT_HELD. Genau diese drei Typen bilden in
//                 lib/fuehrung.ts, Schleife ueber `zaehler` (Zeilen 416-437),
//                 die drei Felder:
//                   anrufeWoche   <- CALL,             Zeile 426
//                   vereinbart14  <- APPOINTMENT_SET,  Zeilen 427-430
//                   gehalten14    <- APPOINTMENT_HELD, Zeilen 431-435
//                 (`zaehler` selbst: lib/fuehrung.ts:293-297, ein
//                 dailyLog.groupBy nach personId+type+date.)
//   Tagesgrenze:  DailyLog.date ist als Spalte ein normales DateTime (keine
//                 @db.Date-Einschraenkung im Schema), steht aber IMMER als
//                 UTC-Mitternacht des Berliner Kalendertags in der Datenbank -
//                 jede Schreibstelle setzt sie ueber dayToUtcDate(berlinToday())
//                 bzw. dayToUtcDate(berlinDayOf(...)) (lib/dates.ts). Siehe
//                 z. B. den gemeinsamen award()-Helfer fuer
//                 APPOINTMENT_SET/APPOINTMENT_HELD/DEAL_WON
//                 (app/(app)/pipeline/actions.ts:109-118) und den CALL-Eintrag
//                 im selben File (:239-247). Dieselbe Konvention wie
//                 Einheitenbuchung.tag (lib/einheiten.ts) - die ersten zehn
//                 Zeichen der ISO-Form sind damit der Kalendertag, ohne
//                 weitere Zeitzonenrechnung.
//
// Weil beide Seiten - die Matrix und diese Datei - dieselben Zeilen derselben
// Tabelle lesen, ist eine Uebereinstimmung kein Zufall, sondern eine
// Konsequenz: JEDE zusammenhaengende Tagesspanne, die ein Aufrufer aus den
// Tageswerten hier aufsummiert, ist exakt die Zahl, die lib/fuehrung.ts fuer
// dieselbe Spanne direkt aus DailyLog zieht - es ist dieselbe Spanne derselben
// Rohdaten, nur einmal vor-, einmal nachtraeglich aufsummiert.
//
// STICHPROBE (als Herleitung, nicht als Live-Abfrage - diese Datei ist die
// einzige, die dieser Auftrag anfassen darf; ein eigenes scripts/*-probe.mjs
// waere eine zweite und faellt damit nicht in diesen Zuschnitt):
// `anrufeWoche` zaehlt CALL-Zeilen ab `startOfWeek(heute)` (Montag dieser
// Woche, lib/fuehrung.ts:234) bis jetzt - eine KALENDERWOCHE, keine
// rollierenden 7 Tage. Die Summe von eigeneAktivitaeten(userId).tage, gefiltert
// auf tag >= Montag dieser Woche, ergibt deshalb fuer denselben Benutzer IMMER
// exakt `anrufeWoche` der Matrix: an einem Sonntag deckt sich das mit "den
// letzten 7 Tagen" (Montag bis Sonntag sind genau 7 Kalendertage), an jedem
// anderen Wochentag mit dem bisherigen, kuerzeren Wochenanteil. vereinbart14/
// gehalten14 laufen dagegen rollierend ab `Date.now() - schwellen.
// terminFensterTage Tage` (lib/fuehrung.ts:240), nicht kalendertagsgebunden -
// auch das liest exakt dieselben DailyLog-Zeilen, nur mit einem wandernden
// statt einem Montags-Anker.
//
// STRUKTUR-POPULATION: strukturAktivitaeten() nimmt denselben Ast wie
// strukturVerlauf() in lib/einheiten.ts - strukturKonten(userId), also "ich
// und alles unter mir" ueber alle Ebenen, Ausgetretene draussen
// (lib/struktur.ts). Platzhalter (User ohne passwordHash) fallen dabei nicht
// durch einen expliziten Filter heraus, sondern von selbst: eine Person
// entsteht erst beim Freischalten (app/login/actions.ts,
// app/einladung/[code]/actions.ts - jeweils im selben Zug wie passwordHash) -
// ein Platzhalter hat also nie eine Person und damit nie einen
// DailyLog-Eintrag. Dieselbe stille Null wie bei mannschaftsLage().
//
// EINE groupBy-ABFRAGE JE AUFRUF, KEINE SCHLEIFE UEBER PERSONEN: beide
// Funktionen gruppieren direkt nach Tag und Typ ueber die ganze
// Personen-Liste in einem Rutsch - dieselbe Form wie eigenerVerlauf()/
// teamVerlauf() in lib/einheiten.ts, nur mit dem Typ als zweiter
// Gruppierungsspalte. Der Aufruf steht darum zweimal (nicht hinter einer
// gemeinsamen Hilfsfunktion): Prisma leitet die genaue Rueckgabeform von
// groupBy() aus dem Literal an der Aufrufstelle her (welche Felder in `by`
// stehen, was `_sum` zurueckgibt) - reicht man das Argument durch eine
// Hilfsfunktion mit eigener Signatur weiter, verliert TypeScript genau diese
// Herleitung und lehnt einen strukturell identischen Aufruf ab. Kein
// "use client".

import { prisma } from "@/lib/prisma";
import { strukturKonten } from "@/lib/struktur";
import type { QuotaType } from "@/lib/generated/prisma/enums";

/** Ein Kalendertag mit seinen drei Taetigkeits-Summen. NICHT kumuliert - das
 *  macht der Aufrufer, genau wie bei Verlaufstag in lib/einheiten.ts. */
export type Aktivitaetstag = {
  /** "2026-08-28" - der Berliner Kalendertag, wie ihn DailyLog.date speichert. */
  tag: string;
  anrufe: number;
  vereinbart: number;
  gehalten: number;
};

// Nur diese drei QuotaType-Werte tragen eine Kurve - dieselben drei, aus denen
// Werte.anrufeWoche/vereinbart14/gehalten14 in lib/fuehrung.ts entstehen.
// NUMBERS_PULLED, REFERRAL, DEAL_WON bleiben aussen vor: fuer sie gibt es
// (noch) keine ETF-Kurve in dieser Feedback-Runde.
const AKTIVITAETS_TYPEN: QuotaType[] = ["CALL", "APPOINTMENT_SET", "APPOINTMENT_HELD"];

/**
 * Aus den (Tag, Typ)-Zeilen einer groupBy-Abfrage die sortierte Tagesliste
 * bauen: eine Zeile je Tag MIT Buchung, nicht je Kalendertag - dieselbe
 * Ueberlegung wie bei eigenerVerlauf() in lib/einheiten.ts. Tage ganz ohne
 * eine der drei Zahlen tauchen gar nicht erst auf.
 */
function buendeln(
  zeilen: { date: Date; type: QuotaType; _sum: { count: number | null } }[]
): Aktivitaetstag[] {
  const jeTag = new Map<string, Aktivitaetstag>();
  for (const zeile of zeilen) {
    const tag = zeile.date.toISOString().slice(0, 10);
    const eintrag = jeTag.get(tag) ?? { tag, anrufe: 0, vereinbart: 0, gehalten: 0 };
    const summe = zeile._sum.count ?? 0;
    if (zeile.type === "CALL") eintrag.anrufe += summe;
    else if (zeile.type === "APPOINTMENT_SET") eintrag.vereinbart += summe;
    else if (zeile.type === "APPOINTMENT_HELD") eintrag.gehalten += summe;
    jeTag.set(tag, eintrag);
  }

  return [...jeTag.values()]
    .filter((eintrag) => eintrag.anrufe > 0 || eintrag.vereinbart > 0 || eintrag.gehalten > 0)
    .sort((a, b) => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0));
}

/**
 * Die eigenen Tagessummen - Anrufe, vereinbarte und gehaltene Termine einer
 * einzelnen Person.
 *
 * Herleitung siehe Kopfkommentar der Datei: dieselbe Tabelle, dieselben drei
 * QuotaType-Werte, dieselbe Tagesgrenze wie Werte.anrufeWoche &co. in
 * lib/fuehrung.ts - die Summe einer beliebigen zusammenhaengenden Spanne
 * dieser Tage ist deshalb immer exakt die Zahl, die die Matrix fuer dieselbe
 * Spanne und denselben Benutzer zeigt.
 *
 * Ohne Person (Platzhalter, noch nicht freigeschaltet) eine leere Liste statt
 * eines Fehlers - anders als requireUserPerson() in lib/auth.ts, das an
 * SCHREIBENDEN Stellen bewusst wirft. Hier wird nur gelesen, und "noch keine
 * Kurve" ist eine gueltige Antwort.
 */
export async function eigeneAktivitaeten(
  userId: string
): Promise<{ tage: Aktivitaetstag[] }> {
  const person = await prisma.person.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!person) return { tage: [] };

  const zeilen = await prisma.dailyLog.groupBy({
    by: ["date", "type"],
    where: { personId: person.id, type: { in: AKTIVITAETS_TYPEN } },
    _sum: { count: true },
  });

  return { tage: buendeln(zeilen) };
}

/**
 * Die Tagessummen des GANZEN eigenen Astes, sich selbst eingeschlossen -
 * dieselbe Population wie strukturVerlauf() in lib/einheiten.ts:
 * strukturKonten(userId), also "ich und alles unter mir" ueber alle Ebenen,
 * Ausgetretene draussen (lib/struktur.ts). Platzhalter fallen nicht durch
 * einen Filter heraus, sondern weil sie nie eine Person haben (siehe
 * Kopfkommentar) - die einfache userId-in-Uebersetzung unten reicht deshalb,
 * ohne passwordHash hier noch einmal zu pruefen.
 *
 * Herleitung siehe Kopfkommentar der Datei.
 */
export async function strukturAktivitaeten(
  userId: string
): Promise<{ tage: Aktivitaetstag[] }> {
  const konten = await strukturKonten(userId);
  const personen = await prisma.person.findMany({
    where: { userId: { in: konten } },
    select: { id: true },
  });
  if (personen.length === 0) return { tage: [] };

  const zeilen = await prisma.dailyLog.groupBy({
    by: ["date", "type"],
    where: {
      personId: { in: personen.map((person) => person.id) },
      type: { in: AKTIVITAETS_TYPEN },
    },
    _sum: { count: true },
  });

  return { tage: buendeln(zeilen) };
}
