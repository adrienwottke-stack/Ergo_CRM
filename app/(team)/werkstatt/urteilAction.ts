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

  // Eine Stimme je Person und Baustein, einmalig. `create` statt `upsert`:
  // wer schon gestimmt hat, sieht die Frage gar nicht mehr - ein zweiter
  // Aufruf ist entweder ein Doppelklick oder ein Nachbau von aussen. Beides
  // laeuft still ins Leere, statt die erste Stimme zu ueberschreiben.
  try {
    await prisma.featureVote.create({
      data: { featureKey, personId: person.id, urteil: urteil as Urteil },
    });
  } catch {
    return;
  }

  revalidatePath("/arena");
  revalidatePath("/werkstatt");
}
