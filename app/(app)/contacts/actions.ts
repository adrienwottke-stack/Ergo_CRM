"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isActivityType, isContactStatus } from "@/lib/labels";
import type { ContactStatus } from "@/lib/generated/prisma/enums";

function contactDataFromForm(formData: FormData) {
  const name = (formData.get("name") as string | null)?.trim();
  if (!name) {
    throw new Error("Name ist ein Pflichtfeld.");
  }

  const statusRaw = (formData.get("status") as string | null) ?? "NEW";
  const status: ContactStatus = isContactStatus(statusRaw) ? statusRaw : "NEW";

  const optional = (field: string) => {
    const value = (formData.get(field) as string | null)?.trim();
    return value ? value : null;
  };

  return {
    name,
    status,
    phone: optional("phone"),
    email: optional("email"),
    source: optional("source"),
    note: optional("note"),
  };
}

export async function createContact(formData: FormData) {
  const contact = await prisma.contact.create({
    data: contactDataFromForm(formData),
  });

  revalidatePath("/contacts");
  revalidatePath("/dashboard");
  redirect(`/contacts/${contact.id}`);
}

export async function updateContact(contactId: string, formData: FormData) {
  await prisma.contact.update({
    where: { id: contactId },
    data: contactDataFromForm(formData),
  });

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${contactId}`);
  revalidatePath("/dashboard");
  redirect(`/contacts/${contactId}`);
}

export async function createActivity(contactId: string, formData: FormData) {
  const text = (formData.get("text") as string | null)?.trim();
  if (!text) {
    throw new Error("Beschreibung ist ein Pflichtfeld.");
  }

  const typeRaw = (formData.get("type") as string | null) ?? "CALL";
  const dateRaw = (formData.get("date") as string | null)?.trim();

  await prisma.activity.create({
    data: {
      contactId,
      type: isActivityType(typeRaw) ? typeRaw : "CALL",
      text,
      date: dateRaw ? new Date(dateRaw) : new Date(),
    },
  });

  revalidatePath(`/contacts/${contactId}`);
}
