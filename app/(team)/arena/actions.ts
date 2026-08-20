"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, requireUserPerson } from "@/lib/auth";
import { berlinToday, dayToUtcDate, mondayOf, shiftDay } from "@/lib/dates";
import { isQuotaType } from "@/lib/labels";
import { duellStand } from "@/lib/arena";
import { merkeNutzung } from "@/lib/features";
import type { QuotaType } from "@/lib/generated/prisma/enums";

// Hoechstens zwei laufende Duelle je Kopf. Wer gegen alle gleichzeitig
// antritt, hat kein Duell mehr, sondern wieder eine Rangliste.
export const MAX_DUELLE = 2;
// Eine Forderung, die keiner annimmt, verschwindet nach einem Tag - geraeuschlos.
export const ANNAHME_STUNDEN = 24;
export const SPRINT_MINUTEN = 25;

function duellEnde(dauer: string, heute = berlinToday()): string {
  if (dauer === "tag") return heute;
  // Wochenduell endet Freitag. Ist der schon vorbei, gilt der naechste.
  const freitag = shiftDay(mondayOf(heute), 4);
  return freitag >= heute ? freitag : shiftDay(freitag, 7);
}

export async function duellFordern(formData: FormData) {
  const user = await requireUser();
  const person = await requireUserPerson(user.id);
  const opponentId = (formData.get("opponentId") as string | null)?.trim();
  const metricRaw = (formData.get("metric") as string | null)?.trim();
  const dauer = (formData.get("dauer") as string | null)?.trim() ?? "woche";
  if (!opponentId || opponentId === person.id) return;

  const gegner = await prisma.person.findUnique({ where: { id: opponentId } });
  if (!gegner) return;

  const laufend = await prisma.duel.count({
    where: {
      status: { in: ["OFFEN", "LAEUFT"] },
      OR: [{ challengerId: person.id }, { opponentId: person.id }],
    },
  });
  if (laufend >= MAX_DUELLE) return;

  // Gegen denselben Gegner nicht zweimal gleichzeitig.
  const schonOffen = await prisma.duel.findFirst({
    where: {
      status: { in: ["OFFEN", "LAEUFT"] },
      OR: [
        { challengerId: person.id, opponentId },
        { challengerId: opponentId, opponentId: person.id },
      ],
    },
  });
  if (schonOffen) return;

  const heute = berlinToday();
  await prisma.duel.create({
    data: {
      challengerId: person.id,
      opponentId,
      metric: metricRaw && isQuotaType(metricRaw) ? (metricRaw as QuotaType) : null,
      startDay: dayToUtcDate(heute),
      endDay: dayToUtcDate(duellEnde(dauer, heute)),
    },
  });

  await merkeNutzung("duell", person.id);
  revalidatePath("/arena");
}

export async function duellAntwort(formData: FormData) {
  const user = await requireUser();
  const person = await requireUserPerson(user.id);
  const duelId = (formData.get("duelId") as string | null)?.trim();
  const antwort = (formData.get("antwort") as string | null)?.trim();
  if (!duelId) return;

  // Nur der Geforderte darf antworten.
  const duel = await prisma.duel.findFirst({
    where: { id: duelId, opponentId: person.id, status: "OFFEN" },
  });
  if (!duel) return;

  if (antwort === "ja") {
    await prisma.duel.update({
      where: { id: duel.id },
      data: { status: "LAEUFT", acceptedAt: new Date() },
    });
    await merkeNutzung("duell", person.id);
  } else {
    await prisma.duel.update({
      where: { id: duel.id },
      data: { status: "ABGELEHNT", decidedAt: new Date() },
    });
  }

  revalidatePath("/arena");
}

// Abpfiff ohne Cron: wer die Seite als Erster nach Ablauf oeffnet, schliesst
// ab. Ein naechtlicher Lauf, der einmal ausfaellt, verschluckt einen ganzen
// Spieltag - das hier kann nicht ausfallen.
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

export async function sprintStarten() {
  const user = await requireUser();
  const person = await requireUserPerson(user.id);

  // Laeuft schon einer, tritt man ihm bei statt einen zweiten aufzumachen.
  const laufend = await prisma.sprint.findFirst({
    where: { endAt: { gt: new Date() } },
    orderBy: { startAt: "desc" },
  });

  const sprint =
    laufend ??
    (await prisma.sprint.create({
      data: {
        startAt: new Date(),
        endAt: new Date(Date.now() + SPRINT_MINUTEN * 60_000),
        startedById: person.id,
      },
    }));

  await prisma.sprintTeilnahme.upsert({
    where: { sprintId_personId: { sprintId: sprint.id, personId: person.id } },
    create: { sprintId: sprint.id, personId: person.id },
    update: {},
  });

  await merkeNutzung("sprint", person.id);
  revalidatePath("/arena");
  revalidatePath("/log");
}
