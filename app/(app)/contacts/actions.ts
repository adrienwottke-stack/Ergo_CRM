"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, requireUserPerson } from "@/lib/auth";
import { isActivityType, isContactStatus } from "@/lib/labels";
import { berlinDayOf, berlinToday, dayToUtcDate, isValidDay } from "@/lib/dates";
import type { ContactStatus } from "@/lib/generated/prisma/enums";

function contactDataFromForm(formData: FormData) {
  const name = (formData.get("name") as string | null)?.trim();
  if (!name) throw new Error("Name ist ein Pflichtfeld.");

  const statusRaw = (formData.get("status") as string | null) ?? "NEW";
  const status: ContactStatus = isContactStatus(statusRaw) ? statusRaw : "NEW";
  const optional = (field: string) => {
    const value = (formData.get(field) as string | null)?.trim();
    return value || null;
  };
  const followUpRaw = (formData.get("nextFollowUp") as string | null)?.trim();
  const nextFollowUp =
    followUpRaw && isValidDay(followUpRaw) ? dayToUtcDate(followUpRaw) : null;

  return { name, status, phone: optional("phone"), email: optional("email"), source: optional("source"), note: optional("note"), nextFollowUp };
}

function refreshContactViews(contactId?: string) {
  revalidatePath("/contacts");
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
  revalidatePath("/report");
  if (contactId) revalidatePath(`/contacts/${contactId}`);
}

export async function createContact(formData: FormData) {
  const user = await requireUser();
  const person = await requireUserPerson(user.id);
  const data = contactDataFromForm(formData);
  const date = dayToUtcDate(berlinToday());
  const appointmentSet = data.status === "APPOINTMENT";

  const contact = await prisma.$transaction(async (tx) => {
    const created = await tx.contact.create({
      data: {
        ...data,
        ownerId: user.id,
        appointmentLoggedAt: appointmentSet ? new Date() : null,
      },
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
    where: { id: contactId, ownerId: user.id },
    select: { appointmentLoggedAt: true },
  });
  if (!current) throw new Error("Kontakt nicht gefunden.");

  const appointmentSet = data.status === "APPOINTMENT" && !current.appointmentLoggedAt;
  await prisma.$transaction(async (tx) => {
    await tx.contact.update({
      where: { id: contactId },
      data: {
        ...data,
        ...(appointmentSet ? { appointmentLoggedAt: new Date() } : {}),
      },
    });
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

export async function createActivity(formData: FormData) {
  const user = await requireUser();
  const person = await requireUserPerson(user.id);
  const contactId = (formData.get("contactId") as string | null)?.trim();
  const text = (formData.get("text") as string | null)?.trim();
  if (!contactId || !text) throw new Error("Kontakt-ID und Beschreibung sind Pflichtfelder.");

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, ownerId: user.id },
    select: { id: true },
  });
  if (!contact) throw new Error("Kontakt nicht gefunden.");

  const typeRaw = (formData.get("type") as string | null) ?? "CALL";
  const type = isActivityType(typeRaw) ? typeRaw : "CALL";
  const dateRaw = (formData.get("date") as string | null)?.trim();
  const activityDate = dateRaw ? new Date(dateRaw) : new Date();

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
    where: { id: activityId, contactId, contact: { is: { ownerId: user.id } } },
  });
  // Automatisch aus Anrufen erzeugte Ranglistenpunkte werden per Cascade mit gelöscht.
  refreshContactViews(contactId);
}

export async function quickLogCall(formData: FormData) {
  const user = await requireUser();
  const person = await requireUserPerson(user.id);
  const contactId = (formData.get("contactId") as string | null)?.trim();
  if (!contactId) throw new Error("Kontakt-ID fehlt.");

  const note = (formData.get("note") as string | null)?.trim() || "Anruf getätigt";
  const followUpDaysRaw = formData.get("followUpDays") as string | null;
  const followUpDays = followUpDaysRaw ? parseInt(followUpDaysRaw, 10) : null;

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, ownerId: user.id },
    select: { id: true, status: true },
  });
  if (!contact) throw new Error("Kontakt nicht gefunden.");

  const now = new Date();
  const todayDate = dayToUtcDate(berlinToday());

  let nextFollowUpDate: Date | null = null;
  if (followUpDays !== null && followUpDays > 0) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + followUpDays);
    nextFollowUpDate = dayToUtcDate(targetDate.toISOString().slice(0, 10));
  }

  await prisma.$transaction(async (tx) => {
    const activity = await tx.activity.create({
      data: {
        contactId,
        type: "CALL",
        text: note,
        date: now,
      },
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

    const updateData: { status?: ContactStatus; nextFollowUp?: Date | null } = {};
    if (contact.status === "NEW") {
      updateData.status = "CONTACTED";
    }
    if (followUpDays !== null) {
      updateData.nextFollowUp = nextFollowUpDate;
    }

    if (Object.keys(updateData).length > 0) {
      await tx.contact.update({
        where: { id: contactId },
        data: updateData,
      });
    }
  });

  refreshContactViews(contactId);
}

export async function quickSetFollowUp(formData: FormData) {
  const user = await requireUser();
  const contactId = (formData.get("contactId") as string | null)?.trim();
  if (!contactId) throw new Error("Kontakt-ID fehlt.");

  const daysRaw = formData.get("days") as string | null;
  const days = daysRaw ? parseInt(daysRaw, 10) : null;

  let nextFollowUp: Date | null = null;
  if (days !== null && days >= 0) {
    const target = new Date();
    target.setDate(target.getDate() + days);
    nextFollowUp = dayToUtcDate(target.toISOString().slice(0, 10));
  }

  await prisma.contact.updateMany({
    where: { id: contactId, ownerId: user.id },
    data: { nextFollowUp },
  });

  refreshContactViews(contactId);
}

export async function quickSetStatus(formData: FormData) {
  const user = await requireUser();
  const person = await requireUserPerson(user.id);
  const contactId = (formData.get("contactId") as string | null)?.trim();
  const statusRaw = (formData.get("status") as string | null)?.trim();

  if (!contactId || !statusRaw || !isContactStatus(statusRaw)) {
    throw new Error("Ungültige Daten für Statusaktualisierung.");
  }

  const newStatus = statusRaw as ContactStatus;
  const current = await prisma.contact.findFirst({
    where: { id: contactId, ownerId: user.id },
    select: { appointmentLoggedAt: true },
  });
  if (!current) throw new Error("Kontakt nicht gefunden.");

  const appointmentSet = newStatus === "APPOINTMENT" && !current.appointmentLoggedAt;

  await prisma.$transaction(async (tx) => {
    await tx.contact.update({
      where: { id: contactId },
      data: {
        status: newStatus,
        ...(appointmentSet ? { appointmentLoggedAt: new Date() } : {}),
      },
    });

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
}

export async function bulkImportContacts(contactsData: Array<{ name: string; phone?: string; email?: string; source?: string; note?: string; status?: string }>) {
  const user = await requireUser();
  const person = await requireUserPerson(user.id);
  const todayDate = dayToUtcDate(berlinToday());

  let importedCount = 0;
  for (const c of contactsData) {
    if (!c.name?.trim()) continue;

    const status: ContactStatus = isContactStatus(c.status ?? "") ? (c.status as ContactStatus) : "NEW";
    const appointmentSet = status === "APPOINTMENT";

    await prisma.$transaction(async (tx) => {
      await tx.contact.create({
        data: {
          name: c.name.trim(),
          phone: c.phone?.trim() || null,
          email: c.email?.trim() || null,
          source: c.source?.trim() || "CSV Import",
          note: c.note?.trim() || null,
          status,
          ownerId: user.id,
          appointmentLoggedAt: appointmentSet ? new Date() : null,
        },
      });

      await tx.dailyLog.createMany({
        data: [
          { personId: person.id, type: "NUMBERS_PULLED", count: 1, date: todayDate },
          ...(appointmentSet
            ? [{ personId: person.id, type: "APPOINTMENT_SET" as const, count: 1, date: todayDate }]
            : []),
        ],
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
      ownerId: user.id,
      OR: [
        { name: { contains: trimmed, mode: "insensitive" } },
        { phone: { contains: trimmed, mode: "insensitive" } },
        { email: { contains: trimmed, mode: "insensitive" } },
        { note: { contains: trimmed, mode: "insensitive" } },
      ],
    },
    take: 8,
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      status: true,
    },
  });

  return contacts;
}

