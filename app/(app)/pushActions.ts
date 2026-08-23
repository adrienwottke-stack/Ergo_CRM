"use server";

// Eigene Datei, weil eine Client-Komponente sie importiert - "use server"-
// Module ueber der Client-Grenze bleiben in diesem Projekt strikt getrennt
// (siehe quickLogAction.ts).

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export type AboDaten = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

/**
 * Traegt das Geraet ein oder schreibt es fort.
 *
 * Der Endpunkt ist der Schluessel: derselbe Browser erneuert seinen Eintrag,
 * statt einen zweiten anzulegen. Wechselt das Konto am selben Geraet, wandert
 * das Abo mit - sonst bekaeme der Vorgaenger die Meldungen des Nachfolgers.
 */
export async function aboSpeichern(daten: AboDaten) {
  const user = await requireUser();
  if (!daten.endpoint || !daten.p256dh || !daten.auth) return;

  await prisma.pushAbo.upsert({
    where: { endpoint: daten.endpoint },
    create: {
      userId: user.id,
      endpoint: daten.endpoint,
      p256dh: daten.p256dh,
      auth: daten.auth,
    },
    update: { userId: user.id, p256dh: daten.p256dh, auth: daten.auth },
  });
}

export async function aboLoeschen(endpoint: string) {
  const user = await requireUser();
  if (!endpoint) return;
  await prisma.pushAbo.deleteMany({ where: { endpoint, userId: user.id } });
}
