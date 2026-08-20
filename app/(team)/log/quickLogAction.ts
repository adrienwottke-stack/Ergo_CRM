"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, requireUserPerson } from "@/lib/auth";
import { isQuotaType, manualQuotaTypes } from "@/lib/labels";
import { kappeRest } from "@/lib/fairness";
import { berlinToday, dayToUtcDate } from "@/lib/dates";

export async function quickLog(type: string, count: number) {
  const user = await requireUser();
  const person = await requireUserPerson(user.id);
  if (!isQuotaType(type) || !manualQuotaTypes.includes(type) || !Number.isFinite(count)) return;

  const heute = berlinToday();
  // Tageskappe: der Schnellzaehler ist der bequemste Weg, aus Versehen (oder
  // aus Uebermut) eine Zahl zu erfinden. Ist die Kappe erreicht, passiert
  // schlicht nichts mehr.
  const rest = await kappeRest(person.id, type, heute);
  const erlaubt = Math.min(Math.max(Math.trunc(count), 1), 999, rest);
  if (erlaubt <= 0) return;

  await prisma.dailyLog.create({
    data: {
      personId: person.id,
      type,
      count: erlaubt,
      date: dayToUtcDate(heute),
    },
  });

  revalidatePath("/log");
  revalidatePath("/leaderboard");
  revalidatePath("/report");
}
