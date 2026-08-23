"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import type { FeatureState } from "@/lib/generated/prisma/enums";

const zustaende: FeatureState[] = ["TEST", "LAEUFT", "AUS", "ABGERISSEN"];

// Der Schalter. Liegt beim Admin, nicht bei der Mehrheit: eine bindende
// Abstimmung wird zur Fessel, eine folgenlose wird nicht mehr benutzt. Wer
// gegen die Stimmen entscheidet, hinterlaesst einen Grund.
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
  revalidatePath("/arena");
  revalidatePath("/leaderboard");
  revalidatePath("/log");
}
