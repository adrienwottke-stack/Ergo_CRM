"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, requireUserPerson } from "@/lib/auth";
import { isQuotaType } from "@/lib/labels";
import { berlinToday, dayToUtcDate } from "@/lib/dates";

export async function quickLog(type: string, count: number) {
  const user = await requireUser();
  const person = await requireUserPerson(user.id);
  if (!isQuotaType(type) || !Number.isFinite(count)) return;

  await prisma.dailyLog.create({
    data: {
      personId: person.id,
      type,
      count: Math.min(Math.max(Math.trunc(count), 1), 999),
      date: dayToUtcDate(berlinToday()),
    },
  });

  revalidatePath("/log");
  revalidatePath("/leaderboard");
  revalidatePath("/report");
}
