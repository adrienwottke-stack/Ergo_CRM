"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ablaufDatum, neuerCode } from "@/lib/einladung";

// Einladen kann JEDER, nicht nur der Admin: im Strukturvertrieb ist Werben
// der Kern des Berufs, und wer einlaedt, wird damit Fuehrungskraft. Der Neue
// haengt immer unter dem Einladenden selbst - wer Leute woanders einhaengen
// will, macht das als Admin unter /team.

function text(formData: FormData, field: string): string | null {
  const value = formData.get(field);
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed ? trimmed : null;
}

export type NeueEinladung = {
  code: string;
  greeting: string | null;
  mehrfach: boolean;
};

export async function einladungFuerMich(formData: FormData): Promise<NeueEinladung> {
  const user = await requireUser();

  const note = text(formData, "note")?.slice(0, 80) ?? null;
  // Die persoenliche erste Chatnachricht im Willkommens-Ablauf des Neuen.
  // Beste Wirkung pro Zeile im ganzen Projekt - deshalb steht sie prominent
  // im Formular, nicht versteckt in einem Aufklapper.
  const greeting = text(formData, "greeting")?.slice(0, 240) ?? null;
  // Der Einsatz fuer die Startwoche ("Essen geht auf mich") - landet auf dem
  // Starterpass des Neuen.
  const stake = text(formData, "stake")?.slice(0, 120) ?? null;
  // Mehrfach-Code fuer den Infoabend: ein QR-Code, zwanzig Handys.
  const mehrfach = text(formData, "mehrfach") === "1";

  const invite = await prisma.invite.create({
    data: {
      code: neuerCode(),
      leaderId: user.id,
      note,
      greeting,
      stake,
      maxUses: mehrfach ? null : 1,
      expiresAt: ablaufDatum(),
    },
    select: { code: true, greeting: true, maxUses: true },
  });

  revalidatePath("/einladen");
  revalidatePath("/team");
  return { code: invite.code, greeting: invite.greeting, mehrfach: invite.maxUses === null };
}

// Nur eigene, noch unbenutzte Einladungen lassen sich zuruecknehmen.
export async function eigeneEinladungZuruecknehmen(formData: FormData) {
  const user = await requireUser();
  const inviteId = text(formData, "inviteId");
  if (inviteId) {
    await prisma.invite.deleteMany({
      where: { id: inviteId, leaderId: user.id, usedCount: 0 },
    });
  }
  revalidatePath("/einladen");
  revalidatePath("/team");
}
