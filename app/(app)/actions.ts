"use server";

import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Haelt fest, dass dieses Konto die App wirklich auf dem Startbildschirm hat
// (docs/willkommen-plan.md, Abschnitt 7.7). Einmal gesetzt, danach nie wieder
// angefasst - der Zeitpunkt der ersten Installation soll stehen bleiben.
export async function installationMelden() {
  const user = await currentUser();
  if (!user || user.installedAt) return;
  await prisma.user.update({
    where: { id: user.id },
    data: { installedAt: new Date() },
  });
}
