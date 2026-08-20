"use server";

// Eigene Datei, weil eine Client-Komponente sie importiert - "use server"-
// Module, die ueber die Client-Grenze gehen, bleiben in diesem Projekt strikt
// getrennt (siehe quickLogAction.ts).

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, requireUserPerson } from "@/lib/auth";
import type { Urteil } from "@/lib/generated/prisma/enums";

const erlaubt: Urteil[] = ["STARK", "GEHT_SO", "WEG_DAMIT"];

export async function urteilen(featureKey: string, urteil: string) {
  const user = await requireUser();
  const person = await requireUserPerson(user.id);
  if (!erlaubt.includes(urteil as Urteil)) return;

  // Eine Stimme je Person und Baustein, jederzeit aenderbar.
  await prisma.featureVote.upsert({
    where: { featureKey_personId: { featureKey, personId: person.id } },
    create: { featureKey, personId: person.id, urteil: urteil as Urteil },
    update: { urteil: urteil as Urteil },
  });

  revalidatePath("/werkstatt");
  revalidatePath("/leaderboard");
}
