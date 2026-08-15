"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hashPassword, newPasswordSalt, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pfadUnter, umhaengen } from "@/lib/struktur";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

export async function createTeamMember(formData: FormData) {
  const admin = await requireAdmin();
  const name = value(formData, "name").slice(0, 60);
  const email = value(formData, "email").toLowerCase();
  const password = value(formData, "password");
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
    redirect("/team?error=invalid");
  }

  const [existingUser, existingPerson] = await Promise.all([
    prisma.user.findUnique({ where: { email }, select: { id: true } }),
    prisma.person.findUnique({ where: { name }, select: { id: true, userId: true } }),
  ]);
  if (existingUser || existingPerson?.userId) redirect("/team?error=exists");

  // Ohne Angabe haengt der Neue unter dem Admin, der ihn anlegt - das ist im
  // Zweifel richtiger, als ihn als eigene Wurzel neben die Struktur zu stellen.
  const leaderIdRaw = value(formData, "leaderId");
  const leaderId = leaderIdRaw || admin.id;
  const leader = await prisma.user.findUnique({
    where: { id: leaderId },
    select: { id: true, path: true },
  });
  if (!leader) redirect("/team?error=invalid");

  const salt = newPasswordSalt();
  const passwordHash = await hashPassword(password, salt);
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        name,
        passwordSalt: salt,
        passwordHash,
        leaderId: leader.id,
        recruitedById: leader.id,
        startedAt: new Date(),
      },
    });
    // Der Pfad braucht die eigene Id und kann deshalb erst nach dem Anlegen
    // gesetzt werden. Zusammen in einer Transaktion, damit kein Konto ohne
    // gueltigen Pfad zurueckbleibt.
    await tx.user.update({
      where: { id: user.id },
      data: { path: pfadUnter(leader.path, user.id) },
    });
    if (existingPerson) {
      await tx.person.update({ where: { id: existingPerson.id }, data: { userId: user.id } });
    } else {
      await tx.person.create({ data: { name, userId: user.id } });
    }
  });

  revalidatePath("/team");
  revalidatePath("/leaderboard");
  redirect("/team?created=1");
}

// Berater unter eine andere Fuehrungskraft haengen. Leere Auswahl macht ihn zur
// eigenen Wurzel.
export async function beraterUmhaengen(formData: FormData) {
  await requireAdmin();
  const userId = value(formData, "userId");
  const leaderIdRaw = value(formData, "leaderId");
  if (!userId) redirect("/team?error=invalid");

  const fehler = await umhaengen(userId, leaderIdRaw || null);
  if (fehler) redirect(`/team?error=${fehler}`);

  revalidatePath("/team");
  redirect("/team?moved=1");
}
