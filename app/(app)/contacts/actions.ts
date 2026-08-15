"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, requireUserPerson } from "@/lib/auth";
import { eigene } from "@/lib/scope";
import { isActivityType } from "@/lib/labels";
import {
  CONTACT_PLAYBOOK,
  isContactStage,
  isNextStepType,
  playbookDueDate,
} from "@/lib/pipeline";
import {
  addDays,
  berlinDayOf,
  berlinLocalToUtc,
  berlinToday,
  dayToUtcDate,
  isValidDay,
} from "@/lib/dates";
import type { ContactStage, NextStepType } from "@/lib/generated/prisma/enums";

function optional(formData: FormData, field: string) {
  const value = (formData.get(field) as string | null)?.trim();
  return value || null;
}

function contactDataFromForm(formData: FormData) {
  const name = (formData.get("name") as string | null)?.trim();
  if (!name) throw new Error("Name ist ein Pflichtfeld.");

  const stageRaw = (formData.get("stage") as string | null) ?? "NEU";
  const stage: ContactStage = isContactStage(stageRaw) ? stageRaw : "NEU";

  const appointmentRaw = optional(formData, "appointmentAt");
  const appointmentAt = appointmentRaw ? berlinLocalToUtc(appointmentRaw) : null;

  const stepTypeRaw = optional(formData, "nextStepType");
  const stepDay = optional(formData, "nextStepDate");
  let nextStepType: NextStepType | null =
    stepTypeRaw && isNextStepType(stepTypeRaw) ? stepTypeRaw : null;
  let nextStepAt: Date | null =
    stepDay && isValidDay(stepDay) ? dayToUtcDate(stepDay) : null;
  let nextStepNote = optional(formData, "nextStepNote");

  // Ohne eigene Angabe schlaegt das Playbook den Schritt zur Phase vor.
  if (!nextStepType) {
    const entry = CONTACT_PLAYBOOK[stage];
    if (entry) {
      nextStepType = entry.type;
      const due = playbookDueDate(entry, new Date(), appointmentAt);
      nextStepAt =
        entry.useAppointment && appointmentAt ? due : dayToUtcDate(berlinDayOf(due));
      nextStepNote = nextStepNote ?? entry.note;
    }
  } else if (!nextStepAt) {
    nextStepAt = dayToUtcDate(berlinToday());
  }

  return {
    name,
    stage,
    phone: optional(formData, "phone"),
    email: optional(formData, "email"),
    job: optional(formData, "job"),
    source: optional(formData, "source"),
    note: optional(formData, "note"),
    appointmentAt,
    nextStepType,
    nextStepAt,
    nextStepNote,
  };
}

function refreshContactViews(contactId?: string) {
  revalidatePath("/contacts");
  revalidatePath("/namen");
  revalidatePath("/heute");
  revalidatePath("/pipeline");
  revalidatePath("/vorgaenge");
  revalidatePath("/dashboard");
  revalidatePath("/trichter");
  revalidatePath("/leaderboard");
  revalidatePath("/report");
  if (contactId) revalidatePath(`/contacts/${contactId}`);
}

// Wurde dieses Formular schon einmal abgeschickt?
//   null        – noch nicht, der Schluessel ist frei
//   { id }      – derselbe Mensch steht schon da, dorthin weiterleiten
//   { id: null} – Schluessel vergeben, aber fuer jemand anderen: wer ueber die
//                 Zurueck-Taste dasselbe Formular neu benutzt, meint wirklich
//                 einen zweiten Kontakt
async function contactFromSameForm(
  formToken: string,
  name: string,
  userId: string
): Promise<{ id: string | null } | null> {
  const twin = await prisma.contact.findUnique({
    where: { formToken },
    select: { id: true, name: true, ownerId: true },
  });
  if (!twin || twin.ownerId !== userId) return null;
  const sameName = twin.name.trim().toLowerCase() === name.trim().toLowerCase();
  return { id: sameName ? twin.id : null };
}

// Prisma meldet einen verletzten Eindeutigkeits-Index als P2002.
function isDuplicate(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "P2002"
  );
}

export async function createContact(formData: FormData) {
  const user = await requireUser();
  const person = await requireUserPerson(user.id);
  const data = contactDataFromForm(formData);
  const date = dayToUtcDate(berlinToday());
  const appointmentSet = data.stage === "TERMIN_VEREINBART";

  // Ein Formular darf genau einen Kontakt erzeugen. Der zweite Klick landet
  // beim bereits angelegten Kontakt statt bei einer Dublette.
  let formToken = optional(formData, "formToken");
  if (formToken) {
    const twin = await contactFromSameForm(formToken, data.name, user.id);
    if (twin?.id) redirect(`/contacts/${twin.id}`);
    // Schluessel schon vergeben, aber fuer jemand anderen: dieser Kontakt
    // laeuft ohne – sonst wuerde der eindeutige Index ihn abweisen.
    if (twin) formToken = null;
  }

  let contact;
  try {
    contact = await prisma.$transaction(async (tx) => {
      const created = await tx.contact.create({
        data: {
          ...data,
          formToken,
          ownerId: user.id,
          outcome: data.stage === "KUNDE" ? "GEWONNEN" : "OFFEN",
          appointmentLoggedAt: appointmentSet ? new Date() : null,
        },
      });
      await tx.stageEvent.create({
        data: { contactId: created.id, toStage: data.stage, userId: user.id },
      });
      await tx.dailyLog.createMany({
        data: [
          { personId: person.id, type: "NUMBERS_PULLED", count: 1, date },
          ...(appointmentSet
            ? [{ personId: person.id, type: "APPOINTMENT_SET" as const, count: 1, date }]
            : []),
        ],
      });
      return created;
    });
  } catch (error) {
    // Beide Klicks gleichzeitig unterwegs: die Abfrage oben sah noch nichts,
    // der Index hat den Nachzuegler gestoppt. Der Kontakt existiert bereits.
    if (!isDuplicate(error) || !formToken) throw error;
    const winner = await contactFromSameForm(formToken, data.name, user.id);
    if (!winner?.id) throw error;
    redirect(`/contacts/${winner.id}`);
  }

  refreshContactViews(contact.id);
  redirect(`/contacts/${contact.id}`);
}

export async function updateContact(formData: FormData) {
  const user = await requireUser();
  const person = await requireUserPerson(user.id);
  const contactId = (formData.get("contactId") as string | null)?.trim();
  if (!contactId) throw new Error("Kontakt-ID fehlt.");
  const data = contactDataFromForm(formData);
  const current = await prisma.contact.findFirst({
    where: { id: contactId, ...eigene(user.id).kontakte },
    select: { appointmentLoggedAt: true, stage: true },
  });
  if (!current) throw new Error("Kontakt nicht gefunden.");

  const appointmentSet =
    data.stage === "TERMIN_VEREINBART" && !current.appointmentLoggedAt;

  await prisma.$transaction(async (tx) => {
    await tx.contact.update({
      where: { id: contactId },
      data: {
        ...data,
        ...(data.stage === "KUNDE" ? { outcome: "GEWONNEN" as const } : {}),
        ...(appointmentSet ? { appointmentLoggedAt: new Date() } : {}),
      },
    });
    if (current.stage !== data.stage) {
      await tx.stageEvent.create({
        data: {
          contactId,
          fromStage: current.stage,
          toStage: data.stage,
          userId: user.id,
        },
      });
    }
    if (appointmentSet) {
      await tx.dailyLog.create({
        data: {
          personId: person.id,
          type: "APPOINTMENT_SET",
          count: 1,
          date: dayToUtcDate(berlinToday()),
        },
      });
    }
  });

  refreshContactViews(contactId);
  redirect(`/contacts/${contactId}`);
}

/**
 * Loescht einen Kontakt endgueltig.
 *
 * Was per Cascade mitgeht: Aktivitaeten, Vorgaenge, Phasenwechsel – und mit den
 * Aktivitaeten auch die daraus entstandenen Anruf-Punkte. Was bewusst stehen
 * bleibt: empfohlene Kontakte (nur die Verknuepfung faellt weg) und die Punkte
 * ohne Kontaktbezug (Nummer gezogen, Termin vereinbart, Abschluss) – die haengen
 * an der Person, nicht am Kontakt.
 *
 * Kein Papierkorb: der Weg dahin ist "Verloren", der den Kontakt auswertbar
 * haelt. Loeschen ist fuer Fehleingaben und Dubletten gedacht.
 */
export async function deleteContact(formData: FormData) {
  const user = await requireUser();
  const contactId = (formData.get("contactId") as string | null)?.trim();
  if (!contactId) throw new Error("Kontakt-ID fehlt.");

  const { count } = await prisma.contact.deleteMany({
    where: { id: contactId, ...eigene(user.id).kontakte },
  });
  if (count === 0) throw new Error("Kontakt nicht gefunden.");

  // UndoEntry haengt ohne Fremdschluessel am Kontakt: sonst bliebe in der
  // Rueckgaengig-Leiste ein Eintrag stehen, der ins Leere greift.
  await prisma.undoEntry.deleteMany({ where: { userId: user.id, contactId } });

  refreshContactViews(contactId);
  redirect("/contacts");
}

export async function createActivity(formData: FormData) {
  const user = await requireUser();
  const person = await requireUserPerson(user.id);
  const contactId = (formData.get("contactId") as string | null)?.trim();
  const text = (formData.get("text") as string | null)?.trim();
  if (!contactId || !text) throw new Error("Kontakt-ID und Beschreibung sind Pflichtfelder.");

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, ...eigene(user.id).kontakte },
    select: { id: true },
  });
  if (!contact) throw new Error("Kontakt nicht gefunden.");

  const typeRaw = (formData.get("type") as string | null) ?? "CALL";
  const type = isActivityType(typeRaw) ? typeRaw : "CALL";
  const dateRaw = (formData.get("date") as string | null)?.trim();
  const activityDate = dateRaw ? (berlinLocalToUtc(dateRaw) ?? new Date()) : new Date();

  await prisma.$transaction(async (tx) => {
    const activity = await tx.activity.create({
      data: { contactId, type, text, date: activityDate },
    });
    if (type === "CALL") {
      await tx.dailyLog.create({
        data: {
          personId: person.id,
          activityId: activity.id,
          type: "CALL",
          count: 1,
          date: dayToUtcDate(berlinDayOf(activityDate)),
        },
      });
    }
  });

  refreshContactViews(contactId);
}

export async function deleteActivity(formData: FormData) {
  const user = await requireUser();
  const activityId = (formData.get("activityId") as string | null)?.trim();
  const contactId = (formData.get("contactId") as string | null)?.trim();
  if (!activityId || !contactId) throw new Error("Aktivität oder Kontakt-ID fehlt.");

  await prisma.activity.deleteMany({
    where: { id: activityId, contactId, ...eigene(user.id).ueberKontakt },
  });
  // Automatisch aus Anrufen erzeugte Ranglistenpunkte werden per Cascade mit gelöscht.
  refreshContactViews(contactId);
}

// Ein-Klick-Anruf aus Fokus-Modus und Board: loggt den Anruf, hebt neue
// Kontakte auf "Kontaktiert" und setzt die naechste Wiedervorlage.
export async function quickLogCall(formData: FormData) {
  const user = await requireUser();
  const person = await requireUserPerson(user.id);
  const contactId = (formData.get("contactId") as string | null)?.trim();
  if (!contactId) throw new Error("Kontakt-ID fehlt.");

  const note = (formData.get("note") as string | null)?.trim() || "Anruf getätigt";
  const followUpDaysRaw = formData.get("followUpDays") as string | null;
  const followUpDays = followUpDaysRaw ? parseInt(followUpDaysRaw, 10) : null;

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, ...eigene(user.id).kontakte },
    select: { id: true, stage: true },
  });
  if (!contact) throw new Error("Kontakt nicht gefunden.");

  const now = new Date();
  const todayDate = dayToUtcDate(berlinToday());

  await prisma.$transaction(async (tx) => {
    const activity = await tx.activity.create({
      data: { contactId, type: "CALL", text: note, date: now },
    });

    await tx.dailyLog.create({
      data: {
        personId: person.id,
        activityId: activity.id,
        type: "CALL",
        count: 1,
        date: todayDate,
      },
    });

    const updateData: {
      stage?: ContactStage;
      nextStepAt?: Date | null;
      nextStepType?: NextStepType | null;
      nextStepNote?: string | null;
    } = {};
    if (contact.stage === "NEU") {
      updateData.stage = "KONTAKTIERT";
      await tx.stageEvent.create({
        data: {
          contactId,
          fromStage: "NEU",
          toStage: "KONTAKTIERT",
          userId: user.id,
        },
      });
    }
    if (followUpDays !== null && followUpDays > 0) {
      updateData.nextStepAt = addDays(todayDate, followUpDays);
      updateData.nextStepType = "ANRUF";
      updateData.nextStepNote = "Wiedervorlage-Anruf";
    }

    if (Object.keys(updateData).length > 0) {
      await tx.contact.update({ where: { id: contactId }, data: updateData });
    }
  });

  refreshContactViews(contactId);
}

export async function bulkImportContacts(
  contactsData: Array<{
    name: string;
    phone?: string;
    email?: string;
    source?: string;
    note?: string;
  }>
) {
  const user = await requireUser();
  const person = await requireUserPerson(user.id);
  const todayDate = dayToUtcDate(berlinToday());

  let importedCount = 0;
  for (const c of contactsData) {
    if (!c.name?.trim()) continue;

    await prisma.$transaction(async (tx) => {
      const created = await tx.contact.create({
        data: {
          name: c.name.trim(),
          phone: c.phone?.trim() || null,
          email: c.email?.trim() || null,
          source: c.source?.trim() || "CSV Import",
          note: c.note?.trim() || null,
          stage: "NEU",
          ownerId: user.id,
          // Frisch importierte Nummern gehoeren sofort in die Heute-Liste.
          nextStepType: "ANRUF",
          nextStepAt: todayDate,
          nextStepNote: "Erstanruf",
        },
      });
      await tx.stageEvent.create({
        data: { contactId: created.id, toStage: "NEU", userId: user.id },
      });
      await tx.dailyLog.create({
        data: { personId: person.id, type: "NUMBERS_PULLED", count: 1, date: todayDate },
      });
    });

    importedCount++;
  }

  refreshContactViews();
  return { success: true, count: importedCount };
}

export async function searchContacts(query: string) {
  const user = await requireUser();
  const trimmed = query.trim();
  if (!trimmed) return [];

  const contacts = await prisma.contact.findMany({
    where: {
      ...eigene(user.id).kontakte,
      OR: [
        { name: { contains: trimmed, mode: "insensitive" } },
        { phone: { contains: trimmed, mode: "insensitive" } },
        { email: { contains: trimmed, mode: "insensitive" } },
        { job: { contains: trimmed, mode: "insensitive" } },
        { note: { contains: trimmed, mode: "insensitive" } },
      ],
    },
    take: 8,
    select: { id: true, name: true, phone: true, email: true, stage: true },
  });

  return contacts;
}
