// Rechenkern der Arena (docs/wettbewerb-plan.md).
//
// Alles hier ist Auswertung ueber DailyLog - es gibt bewusst keinen zweiten
// Punktespeicher, der auseinanderlaufen kann. Eingefroren wird nur, was ein
// Ergebnis ist: Duell-Staende beim Abpfiff.

import { prisma } from "@/lib/prisma";
import {
  berlinDayOf,
  berlinLocalToUtc,
  berlinToday,
  dayToUtcDate,
  mondayOf,
  shiftDay,
  startOfWeek,
} from "@/lib/dates";
import { emptyQuotaCounts, quotaTypePoints } from "@/lib/labels";
import { streakDays } from "@/lib/stats";
import type { QuotaType } from "@/lib/generated/prisma/enums";

// Regeln des Wettkampfs. Sie stehen hier und nicht in actions.ts, weil eine
// "use server"-Datei ausschliesslich async Funktionen exportieren darf -
// Konstanten daneben brechen den Produktionsbau (und nur den: tsc und eslint
// pruefen diese Next-Regel nicht).
export const MAX_DUELLE = 2;
export const ANNAHME_STUNDEN = 24;
export const SPRINT_MINUTEN = 25;

export type ArenaZeile = {
  personId: string;
  name: string;
  byType: Record<QuotaType, number>;
  punkte: number;
  ausCrm: number; // Punkte, die aus einer echten CRM-Aktivitaet entstanden sind
  serie: number;
};

// --- Spieltag ---------------------------------------------------------------

// Abpfiff ist Freitag 18 Uhr Berliner Zeit. Faellt der Aufruf auf Samstag oder
// Sonntag, liegt der Abpfiff dieser Woche in der Vergangenheit - genau das
// soll er, dann steht "Spieltag vorbei" da.
export function abpfiffDieserWoche(heute = berlinToday()): Date {
  const freitag = shiftDay(mondayOf(heute), 4);
  return berlinLocalToUtc(`${freitag}T18:00`) ?? dayToUtcDate(freitag);
}

export function stundenBis(ziel: Date, jetzt = new Date()): number {
  return Math.ceil((ziel.getTime() - jetzt.getTime()) / 3_600_000);
}

// --- Rangliste --------------------------------------------------------------

export async function ladeRangliste(start: Date): Promise<ArenaZeile[]> {
  const heute = berlinToday();
  const [logs, personen, serienLogs] = await Promise.all([
    prisma.dailyLog.findMany({
      where: { date: { gte: start } },
      select: { personId: true, type: true, count: true, activityId: true },
    }),
    prisma.person.findMany({ select: { id: true, name: true } }),
    prisma.dailyLog.findMany({
      where: { date: { gte: dayToUtcDate(shiftDay(heute, -60)) } },
      select: { personId: true, date: true },
    }),
  ]);

  const nameById = new Map(personen.map((p) => [p.id, p.name]));

  const tageJePerson = new Map<string, Set<string>>();
  for (const log of serienLogs) {
    let tage = tageJePerson.get(log.personId);
    if (!tage) {
      tage = new Set();
      tageJePerson.set(log.personId, tage);
    }
    tage.add(berlinDayOf(log.date));
  }

  const zeilen = new Map<string, ArenaZeile>();
  for (const log of logs) {
    if (log.count === 0) continue;
    let zeile = zeilen.get(log.personId);
    if (!zeile) {
      zeile = {
        personId: log.personId,
        name: nameById.get(log.personId) ?? "Unbekannt",
        byType: emptyQuotaCounts(),
        punkte: 0,
        ausCrm: 0,
        serie: 0,
      };
      zeilen.set(log.personId, zeile);
    }
    const punkte = log.count * quotaTypePoints[log.type];
    zeile.byType[log.type] += log.count;
    zeile.punkte += punkte;
    if (log.activityId) zeile.ausCrm += punkte;
  }

  for (const zeile of zeilen.values()) {
    zeile.serie = streakDays(tageJePerson.get(zeile.personId) ?? new Set(), heute);
  }

  return [...zeilen.values()].sort((a, b) => b.punkte - a.punkte);
}

// --- Der Puls ---------------------------------------------------------------

export type Puls = {
  aktiv: number;
  koepfe: number;
  zuletzt: { name: string; at: Date }[];
};

export async function ladePuls(): Promise<Puls> {
  const heute = dayToUtcDate(berlinToday());
  const [logs, koepfe] = await Promise.all([
    prisma.dailyLog.findMany({
      where: { date: heute },
      select: { personId: true, createdAt: true, person: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.person.count(),
  ]);

  const gesehen = new Set<string>();
  const zuletzt: { name: string; at: Date }[] = [];
  for (const log of logs) {
    if (gesehen.has(log.personId)) continue;
    gesehen.add(log.personId);
    zuletzt.push({ name: log.person.name, at: log.createdAt });
  }

  return { aktiv: gesehen.size, koepfe, zuletzt: zuletzt.slice(0, 5) };
}

// --- Eigene Bestmarke -------------------------------------------------------

// Beste abgeschlossene Woche in Punkten. Die laufende Woche zaehlt nicht mit,
// sonst waere die Bestmarke immer die Gegenwart und damit wertlos.
export async function ladeBestmarke(personId: string): Promise<number | null> {
  const dieseWoche = startOfWeek(berlinToday()).getTime();
  const logs = await prisma.dailyLog.findMany({
    where: { personId },
    select: { type: true, count: true, date: true },
  });

  const jeWoche = new Map<number, number>();
  for (const log of logs) {
    const woche = startOfWeek(berlinDayOf(log.date)).getTime();
    if (woche >= dieseWoche) continue;
    jeWoche.set(woche, (jeWoche.get(woche) ?? 0) + log.count * quotaTypePoints[log.type]);
  }

  if (jeWoche.size === 0) return null;
  return Math.max(...jeWoche.values());
}

// --- Duell-Stand ------------------------------------------------------------

// Waehrend das Duell laeuft, wird live gerechnet. Beim Abpfiff wandert das
// Ergebnis in die Spalten challengerScore/opponentScore und wird nie wieder
// angefasst - ein Nachtrag darf kein Ergebnis kippen.
export async function duellStand(duel: {
  challengerId: string;
  opponentId: string;
  metric: QuotaType | null;
  startDay: Date;
  endDay: Date;
  challengerScore: number | null;
  opponentScore: number | null;
}): Promise<{ links: number; rechts: number }> {
  if (duel.challengerScore !== null && duel.opponentScore !== null) {
    return { links: duel.challengerScore, rechts: duel.opponentScore };
  }

  const logs = await prisma.dailyLog.findMany({
    where: {
      personId: { in: [duel.challengerId, duel.opponentId] },
      date: { gte: duel.startDay, lte: duel.endDay },
      ...(duel.metric ? { type: duel.metric } : {}),
    },
    select: { personId: true, type: true, count: true },
  });

  let links = 0;
  let rechts = 0;
  for (const log of logs) {
    // Auf eine Art gefordert: Stueckzahl. Auf Gesamtpunkte: gewichtet.
    const wert = duel.metric ? log.count : log.count * quotaTypePoints[log.type];
    if (log.personId === duel.challengerId) links += wert;
    else rechts += wert;
  }
  return { links, rechts };
}

// Abpfiff ohne Cron: wer die Arena als Erster nach Ablauf oeffnet, schliesst
// die faelligen Duelle ab. Ein naechtlicher Lauf, der einmal ausfaellt,
// verschluckt einen ganzen Spieltag - das hier kann nicht ausfallen.
//
// Bewusst eine gewoehnliche Funktion und keine Server-Action: sie wird nur
// beim Rendern aufgerufen und soll kein von aussen aufrufbarer Endpunkt sein.
export async function duelleAbschliessen() {
  const heute = dayToUtcDate(berlinToday());
  const verfallsgrenze = new Date(Date.now() - ANNAHME_STUNDEN * 3_600_000);

  await prisma.duel.updateMany({
    where: { status: "OFFEN", createdAt: { lt: verfallsgrenze } },
    data: { status: "VERFALLEN", decidedAt: new Date() },
  });

  const faellig = await prisma.duel.findMany({
    where: { status: "LAEUFT", endDay: { lt: heute } },
  });

  for (const duel of faellig) {
    const stand = await duellStand(duel);
    await prisma.duel.update({
      where: { id: duel.id },
      data: {
        status: "ENTSCHIEDEN",
        challengerScore: stand.links,
        opponentScore: stand.rechts,
        decidedAt: new Date(),
      },
    });
  }
}

// --- Sprint -----------------------------------------------------------------

// Der Sprint zaehlt ueber createdAt, nicht ueber date: 25 Minuten sind kein
// Kalendertag. Gezaehlt werden Stueck, nicht Punkte - in einem Sprint geht es
// um Griffe, nicht um Gewichtung.
export async function sprintStand(
  sprint: { startAt: Date; endAt: Date },
  personIds: string[]
): Promise<Map<string, number>> {
  if (personIds.length === 0) return new Map();
  const logs = await prisma.dailyLog.findMany({
    where: {
      personId: { in: personIds },
      createdAt: { gte: sprint.startAt, lte: sprint.endAt },
    },
    select: { personId: true, count: true },
  });
  const stand = new Map<string, number>(personIds.map((id) => [id, 0]));
  for (const log of logs) {
    stand.set(log.personId, (stand.get(log.personId) ?? 0) + log.count);
  }
  return stand;
}
