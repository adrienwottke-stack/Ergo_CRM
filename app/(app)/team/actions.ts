"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hashPassword, newPasswordSalt, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

export async function createTeamMember(formData: FormData) {
  await requireAdmin();
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

  const salt = newPasswordSalt();
  const passwordHash = await hashPassword(password, salt);
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email, name, passwordSalt: salt, passwordHash },
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
