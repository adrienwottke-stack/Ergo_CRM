"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser, requireUserPerson } from "@/lib/auth";
import type { FeatureState } from "@/lib/generated/prisma/enums";

// Drei Stimmen je Kopf. Wer alles gut findet, sagt nichts aus.
export const WUNSCH_STIMMEN = 3;

const zustaende: FeatureState[] = ["TEST", "LAEUFT", "AUS", "ABGERISSEN"];

// Der Schalter. Liegt beim Admin, nicht bei der Mehrheit: eine bindende
// Abstimmung wird zur Fessel, eine folgenlose wird nicht mehr benutzt. Wer
// gegen die Stimmen entscheidet, hinterlaesst einen Grund - und der steht
// sichtbar in der Werkstatt.
export async function schalten(formData: FormData) {
  await requireAdmin();
  const key = (formData.get("key") as string | null)?.trim();
  const state = (formData.get("state") as string | null)?.trim();
  const grund = (formData.get("grund") as string | null)?.trim() || null;
  if (!key || !state || !zustaende.includes(state as FeatureState)) return;

  await prisma.feature.update({
    where: { key },
    data: { state: state as FeatureState, grund },
  });

  revalidatePath("/werkstatt");
  revalidatePath("/leaderboard");
  revalidatePath("/log");
}

export async function wunschStimme(formData: FormData) {
  const user = await requireUser();
  const person = await requireUserPerson(user.id);
  const wunschId = (formData.get("wunschId") as string | null)?.trim();
  if (!wunschId) return;

  const vorhanden = await prisma.wunschVote.findUnique({
    where: { wunschId_personId: { wunschId, personId: person.id } },
  });

  if (vorhanden) {
    // Nochmal tippen nimmt die Stimme zurueck - so kommt man aus einer
    // verbrauchten Stimme wieder heraus, ohne eine zweite Bedienung zu lernen.
    await prisma.wunschVote.delete({ where: { id: vorhanden.id } });
  } else {
    const verbraucht = await prisma.wunschVote.count({
      where: { personId: person.id },
    });
    if (verbraucht >= WUNSCH_STIMMEN) return;
    await prisma.wunschVote.create({ data: { wunschId, personId: person.id } });
  }

  revalidatePath("/werkstatt");
}

// Neue Wuensche traegt der Admin ein. Gemeldet werden sie in der Gruppe - das
// spart ein Freitextfeld fuer alle und damit die Moderation.
export async function wunschAnlegen(formData: FormData) {
  await requireAdmin();
  const titel = (formData.get("titel") as string | null)?.trim();
  if (!titel) return;
  await prisma.wunsch.create({ data: { titel: titel.slice(0, 120) } });
  revalidatePath("/werkstatt");
}
