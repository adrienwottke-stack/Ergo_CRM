"use server";

// Bewusst separat von actions.ts: Diese Action wird von der Client-Komponente
// QuickCounter importiert. Wandert sie mit in actions.ts, bricht der
// No-JS-Fallback der dortigen Formular-Actions (Server-Reference-Lookup).

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { personCookieName } from "@/lib/auth";
import { isQuotaType } from "@/lib/labels";
import { berlinToday, dayToUtcDate } from "@/lib/dates";

export async function quickLog(type: string, count: number) {
  const cookieStore = await cookies();
  const personId = cookieStore.get(personCookieName)?.value;
  if (!personId || !isQuotaType(type) || !Number.isFinite(count)) {
    redirect("/log");
  }

  const person = await prisma.person.findUnique({ where: { id: personId } });
  if (!person) {
    cookieStore.delete(personCookieName);
    redirect("/log");
  }

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
}
