import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  authCookieName,
  reportCookieName,
  reportTokenValue,
  sessionUserId,
} from "@/lib/session";

export {
  authCookieName,
  reportCookieName,
  reportTokenValue,
  sessionCookieOptions,
  sessionUserId,
} from "@/lib/session";
export { createSession } from "@/lib/session";

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

export function newPasswordSalt(): string {
  return toBase64(crypto.getRandomValues(new Uint8Array(16)));
}

export async function hashPassword(
  password: string,
  salt: string
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode(salt),
      iterations: 310_000,
      hash: "SHA-256",
    },
    key,
    256
  );
  return toBase64(new Uint8Array(bits));
}

export async function currentUser() {
  const store = await cookies();
  const userId = await sessionUserId(store.get(authCookieName)?.value);
  return userId ? prisma.user.findUnique({ where: { id: userId } }) : null;
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

// Wie requireUser, plus die Willkommens-Weiche: wer den Start noch nie
// gesehen hat, wird einmalig dorthin geschickt (docs/willkommen-plan.md).
// Bewusst hier und nicht in der Middleware - die laeuft auf der Edge-Runtime
// und hat keine Datenbankverbindung. Die Layouts laden den Benutzer ohnehin.
export async function requireOnboardedUser() {
  const user = await requireUser();
  if (user.onboardingDoneAt === null) redirect("/willkommen");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}

export async function requireUserPerson(userId: string) {
  const person = await prisma.person.findUnique({ where: { userId } });
  if (!person) throw new Error("Dem Benutzerkonto fehlt ein Teamprofil.");
  return person;
}

export async function hasReportAccess(): Promise<boolean> {
  const store = await cookies();
  const userId = await sessionUserId(store.get(authCookieName)?.value);
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (user?.role === "ADMIN") return true;
  }
  const reportToken = store.get(reportCookieName)?.value;
  return !!reportToken && reportToken === (await reportTokenValue());
}

export async function requireReportAccess() {
  if (!(await hasReportAccess())) redirect("/login");
}
