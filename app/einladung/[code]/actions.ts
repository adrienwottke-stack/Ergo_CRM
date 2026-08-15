"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  authCookieName,
  createSession,
  hashPassword,
  newPasswordSalt,
  sessionCookieOptions,
} from "@/lib/auth";
import { normalisiereCode, statusVon } from "@/lib/einladung";
import { pfadUnter } from "@/lib/struktur";

// Zwei Anmeldungen auf denselben Code zur selben Sekunde. Die Pruefung oben hat
// beide durchgelassen, das Entwerten in der Transaktion laesst nur eine durch.
const VERBRAUCHT = "EINLADUNG_VERBRAUCHT";

function text(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function einladungEinloesen(formData: FormData) {
  const code = normalisiereCode(text(formData, "code"));
  const name = text(formData, "name").slice(0, 60);
  const email = text(formData, "email").toLowerCase();
  const password = text(formData, "password");

  // Die Typannotation gehoert an die Variable, nicht nur an die Funktion: nur
  // dann weiss TypeScript, dass der Aufruf nie zurueckkehrt, und haelt danach
  // nicht weiter alles fuer moeglich.
  const zurueck: (fehler: string) => never = (fehler) =>
    redirect(`/einladung/${encodeURIComponent(code)}?error=${fehler}`);

  if (!name || !validEmail(email) || password.length < 8) zurueck("invalid");

  const invite = await prisma.invite.findUnique({
    where: { code },
    select: {
      id: true,
      usedById: true,
      expiresAt: true,
      leader: { select: { id: true, path: true } },
    },
  });
  if (!invite) zurueck("unbekannt");
  if (statusVon(invite) !== "offen") zurueck("verbraucht");

  const [existingUser, existingPerson] = await Promise.all([
    prisma.user.findUnique({ where: { email }, select: { id: true } }),
    prisma.person.findUnique({ where: { name }, select: { id: true, userId: true } }),
  ]);
  if (existingUser) zurueck("email_vergeben");
  if (existingPerson?.userId) zurueck("name_vergeben");

  const salt = newPasswordSalt();
  const passwordHash = await hashPassword(password, salt);

  let neuId: string;
  try {
    neuId = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name,
          passwordSalt: salt,
          passwordHash,
          leaderId: invite.leader.id,
          recruitedById: invite.leader.id,
          startedAt: new Date(),
        },
      });

      // Der Pfad braucht die eigene Id und kann deshalb erst jetzt stehen.
      await tx.user.update({
        where: { id: user.id },
        data: { path: pfadUnter(invite.leader.path, user.id) },
      });

      // updateMany statt update: nur hier laesst sich "nur wenn noch offen"
      // ausdruecken. Trifft es keine Zeile, war jemand schneller - dann faellt
      // die ganze Transaktion, und es entsteht kein zweites Konto.
      const entwertet = await tx.invite.updateMany({
        where: { id: invite.id, usedById: null },
        data: { usedById: user.id, usedAt: new Date() },
      });
      if (entwertet.count !== 1) throw new Error(VERBRAUCHT);

      if (existingPerson) {
        await tx.person.update({
          where: { id: existingPerson.id },
          data: { userId: user.id },
        });
      } else {
        await tx.person.create({ data: { name, userId: user.id } });
      }

      return user.id;
    });
  } catch (error) {
    if (error instanceof Error && error.message === VERBRAUCHT) zurueck("verbraucht");
    throw error;
  }

  const cookieStore = await cookies();
  cookieStore.set(authCookieName, await createSession(neuId), sessionCookieOptions);
  redirect("/heute");
}
