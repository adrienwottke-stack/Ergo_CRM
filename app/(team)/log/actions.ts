"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { personCookieName } from "@/lib/auth";
import { berlinToday, dayToUtcDate, isValidDay } from "@/lib/dates";
import { QuotaType } from "@/lib/generated/prisma/enums";

export async function selectPerson(formData: FormData) {
  const name = (formData.get("name") as string | null)?.trim().slice(0, 60);
  if (!name) {
    redirect("/log");
  }

  const person = await prisma.person.upsert({
    where: { name },
    update: {},
    create: { name },
  });

  const cookieStore = await cookies();
  cookieStore.set(personCookieName, person.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 180, // 180 Tage
    path: "/",
  });

  revalidatePath("/log");
  redirect("/log");
}

export async function switchPerson() {
  const cookieStore = await cookies();
  cookieStore.delete(personCookieName);
  revalidatePath("/log");
  redirect("/log");
}

export async function logDaily(formData: FormData) {
  const cookieStore = await cookies();
  const personId = cookieStore.get(personCookieName)?.value;
  if (!personId) {
    redirect("/log");
  }

  const person = await prisma.person.findUnique({ where: { id: personId } });
  if (!person) {
    cookieStore.delete(personCookieName);
    redirect("/log");
  }

  const dayRaw = (formData.get("day") as string | null)?.trim();
  const day = dayRaw && isValidDay(dayRaw) ? dayRaw : berlinToday();
  const date = dayToUtcDate(day);

  const entries: { type: QuotaType; count: number }[] = [];
  for (const type of Object.values(QuotaType)) {
    const raw = (formData.get(type) as string | null)?.trim();
    const count = raw ? parseInt(raw, 10) : 0;
    if (Number.isFinite(count) && count > 0) {
      entries.push({ type, count: Math.min(count, 999) });
    }
  }

  if (entries.length > 0) {
    await prisma.dailyLog.createMany({
      data: entries.map((entry) => ({
        personId: person.id,
        type: entry.type,
        count: entry.count,
        date,
      })),
    });
  }

  revalidatePath("/log");
  revalidatePath("/leaderboard");
  redirect("/log");
}

export async function deleteLog(formData: FormData) {
  const logId = (formData.get("logId") as string | null)?.trim();
  const cookieStore = await cookies();
  const personId = cookieStore.get(personCookieName)?.value;
  if (!personId || !logId) {
    redirect("/log");
  }

  // Nur eigene Einträge vom heutigen Tag lassen sich löschen (Tipp-Fehler-Korrektur).
  await prisma.dailyLog.deleteMany({
    where: {
      id: logId,
      personId,
      date: dayToUtcDate(berlinToday()),
    },
  });

  revalidatePath("/log");
  revalidatePath("/leaderboard");
}
