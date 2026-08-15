"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, requireUserPerson } from "@/lib/auth";
import { eigene } from "@/lib/scope";
import { berlinToday, dayToUtcDate } from "@/lib/dates";
import { isContactRating, isListKind } from "@/lib/namelist";
import { DEFAULT_GUIDES, isGuideKey } from "@/lib/guides";
import type { ListKind } from "@/lib/generated/prisma/enums";

function text(formData: FormData, field: string): string | null {
  const value = (formData.get(field) as string | null)?.trim();
  return value ? value : null;
}

function refreshNameViews() {
  revalidatePath("/namen");
  revalidatePath("/heute");
  revalidatePath("/contacts");
  revalidatePath("/leaderboard");
}

async function loadOwnContact(userId: string, contactId: string) {
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, ...eigene(userId).kontakte },
    select: { id: true, name: true, listKinds: true, stage: true },
  });
  if (!contact) throw new Error("Kontakt nicht gefunden.");
  return contact;
}

// --- Namen sammeln ----------------------------------------------------------

export type AddNameResult =
  | { status: "created"; name: string }
  | { status: "linked"; name: string } // gab es schon im CRM, jetzt auch auf der Liste
  | { status: "already"; name: string }; // steht auf dieser Liste bereits

// Legt einen Namen an. Bewusst OHNE naechsten Schritt: sonst stuenden zwanzig
// frische Namen sofort in /heute und wuerden die Terminliste zumuellen. Die
// Namensliste ist ihr eigener Arbeitsvorrat.
export async function addName(formData: FormData): Promise<AddNameResult> {
  const user = await requireUser();
  const person = await requireUserPerson(user.id);

  const name = text(formData, "name");
  if (!name) throw new Error("Name ist ein Pflichtfeld.");

  const kindRaw = text(formData, "listKind");
  if (!kindRaw || !isListKind(kindRaw)) throw new Error("Liste fehlt.");
  const kind: ListKind = kindRaw;

  const phone = text(formData, "phone");
  const ratingRaw = text(formData, "rating");
  const rating = ratingRaw && isContactRating(ratingRaw) ? ratingRaw : null;

  // Gibt es den Menschen schon? Dann nicht doppelt anlegen, sondern den
  // bestehenden Kontakt auf die Liste holen – sonst entstehen zwei Wahrheiten.
  const existing = await prisma.contact.findFirst({
    where: {
      ...eigene(user.id).kontakte,
      name: { equals: name, mode: "insensitive" },
    },
    select: { id: true, name: true, listKinds: true, phone: true, rating: true },
  });

  if (existing) {
    if (existing.listKinds.includes(kind)) {
      return { status: "already", name: existing.name };
    }
    await prisma.contact.update({
      where: { id: existing.id },
      data: {
        listKinds: { set: [...existing.listKinds, kind] },
        ...(phone && !existing.phone ? { phone } : {}),
        ...(rating && !existing.rating ? { rating } : {}),
      },
    });
    refreshNameViews();
    return { status: "linked", name: existing.name };
  }

  const today = dayToUtcDate(berlinToday());
  await prisma.$transaction(async (tx) => {
    const created = await tx.contact.create({
      data: {
        name,
        phone,
        rating,
        listKinds: [kind],
        source: "Namensliste",
        stage: "NEU",
        ownerId: user.id,
      },
    });
    await tx.stageEvent.create({
      data: { contactId: created.id, toStage: "NEU", userId: user.id },
    });
    await tx.dailyLog.create({
      data: { personId: person.id, type: "NUMBERS_PULLED", count: 1, date: today },
    });
  });

  refreshNameViews();
  return { status: "created", name };
}

export async function setRating(formData: FormData) {
  const user = await requireUser();
  const contactId = text(formData, "contactId");
  if (!contactId) throw new Error("Kontakt-ID fehlt.");
  await loadOwnContact(user.id, contactId);

  const ratingRaw = text(formData, "rating");
  const rating = ratingRaw && isContactRating(ratingRaw) ? ratingRaw : null;

  await prisma.contact.update({ where: { id: contactId }, data: { rating } });
  revalidatePath("/namen");
}

export async function setPhone(formData: FormData) {
  const user = await requireUser();
  const contactId = text(formData, "contactId");
  if (!contactId) throw new Error("Kontakt-ID fehlt.");
  await loadOwnContact(user.id, contactId);

  await prisma.contact.update({
    where: { id: contactId },
    data: { phone: text(formData, "phone") },
  });
  refreshNameViews();
}

// Denselben Menschen auf die andere Liste setzen oder wieder herunternehmen.
export async function toggleListKind(formData: FormData) {
  const user = await requireUser();
  const contactId = text(formData, "contactId");
  const kindRaw = text(formData, "listKind");
  if (!contactId || !kindRaw || !isListKind(kindRaw)) {
    throw new Error("Ungueltige Daten fuer die Liste.");
  }
  const contact = await loadOwnContact(user.id, contactId);
  const kind: ListKind = kindRaw;

  const next = contact.listKinds.includes(kind)
    ? contact.listKinds.filter((entry) => entry !== kind)
    : [...contact.listKinds, kind];

  await prisma.contact.update({
    where: { id: contactId },
    data: { listKinds: { set: next } },
  });
  refreshNameViews();
}

// Von der Namensliste nehmen, ohne den Kontakt zu loeschen: leere listKinds
// heisst "normaler CRM-Kontakt".
export async function removeFromList(formData: FormData) {
  const user = await requireUser();
  const contactId = text(formData, "contactId");
  if (!contactId) throw new Error("Kontakt-ID fehlt.");
  await loadOwnContact(user.id, contactId);

  await prisma.contact.update({
    where: { id: contactId },
    data: { listKinds: { set: [] } },
  });
  refreshNameViews();
}

// Die vier Gespraechsergebnisse liegen jetzt in
// app/(app)/contacts/results.ts – sie sind nicht namenslisten-spezifisch,
// die Heute-Liste benutzt dieselben.

// --- Leitfaeden -------------------------------------------------------------

export async function saveGuide(formData: FormData) {
  const user = await requireUser();
  const keyRaw = text(formData, "key");
  const body = (formData.get("body") as string | null)?.trim();
  if (!keyRaw || !isGuideKey(keyRaw)) throw new Error("Leitfaden nicht gefunden.");
  if (!body) throw new Error("Der Leitfaden darf nicht leer sein.");

  const title = text(formData, "title") ?? DEFAULT_GUIDES[keyRaw].title;

  await prisma.guide.upsert({
    where: { ownerId_key: { ownerId: user.id, key: keyRaw } },
    create: { ownerId: user.id, key: keyRaw, title, body },
    update: { title, body },
  });
  revalidatePath("/namen");
}

// Zuruecksetzen loescht die persoenliche Zeile – danach gilt wieder der
// Standardtext aus dem Code.
export async function resetGuide(formData: FormData) {
  const user = await requireUser();
  const keyRaw = text(formData, "key");
  if (!keyRaw || !isGuideKey(keyRaw)) throw new Error("Leitfaden nicht gefunden.");

  await prisma.guide.deleteMany({ where: { ownerId: user.id, key: keyRaw } });
  revalidatePath("/namen");
}

// --- Einsteiger-Modus -------------------------------------------------------

export async function setBeginnerMode(formData: FormData) {
  const user = await requireUser();
  const on = text(formData, "on") === "1";
  await prisma.user.update({
    where: { id: user.id },
    data: { beginnerMode: on },
  });
  revalidatePath("/", "layout");
}
