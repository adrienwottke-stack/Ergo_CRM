"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  authCookieName,
  createSession,
  hashPassword,
  newPasswordSalt,
  reportCookieName,
  reportTokenValue,
} from "@/lib/auth";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 30,
  path: "/",
};

function text(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function bootstrapAdmin(formData: FormData, password: string) {
  const name = text(formData, "name").slice(0, 60);
  const email = text(formData, "email").toLowerCase();
  if (!name || !validEmail(email) || password !== process.env.APP_PASSWORD) {
    redirect("/login?error=1");
  }

  const salt = newPasswordSalt();
  const passwordHash = await hashPassword(password, salt);
  const admin = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email, name, passwordSalt: salt, passwordHash, role: "ADMIN" },
    });
    const existingPerson = await tx.person.findUnique({ where: { name } });
    if (existingPerson) {
      await tx.person.update({ where: { id: existingPerson.id }, data: { userId: user.id } });
    } else {
      await tx.person.create({ data: { name, userId: user.id } });
    }
    // Der bisherige APP_PASSWORD-Bereich wird einmalig diesem Admin zugeordnet.
    await tx.contact.updateMany({ where: { ownerId: null }, data: { ownerId: user.id } });
    return user;
  });

  const cookieStore = await cookies();
  cookieStore.set(authCookieName, await createSession(admin.id), cookieOptions);
  redirect("/dashboard");
}

export async function login(formData: FormData) {
  const password = text(formData, "password");
  if (!password) redirect("/login?error=1");

  // Der Bericht kann weiterhin ohne eigenes CRM-Konto aufgerufen werden.
  if (process.env.REPORT_PASSWORD && password === process.env.REPORT_PASSWORD) {
    const cookieStore = await cookies();
    cookieStore.set(reportCookieName, await reportTokenValue(), cookieOptions);
    redirect("/report");
  }

  const userCount = await prisma.user.count();
  if (userCount === 0) {
    await bootstrapAdmin(formData, password);
  }

  const email = text(formData, "email").toLowerCase();
  if (!validEmail(email)) redirect("/login?error=1");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || (await hashPassword(password, user.passwordSalt)) !== user.passwordHash) {
    redirect("/login?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(authCookieName, await createSession(user.id), cookieOptions);
  redirect("/dashboard");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(authCookieName);
  cookieStore.delete(reportCookieName);
  redirect("/login");
}
