// Der Empfehlungs-Loop: aus einem gehaltenen Termin werden neue Namen.
//
// Das ist der Motor der Schleife. Ohne ihn ist die Namensliste ein Vorrat, der
// sich leert; mit ihm fuellt sie sich aus der Arbeit selbst.
//
// Zwei Festlegungen, die den Rest erklaeren:
//
// 1. Die Frage ist KEINE Phase, sondern ein Zeitstempel (`referralsAskedAt`).
//    Als Phase konnte sie nur einmal je Kontakt gestellt werden - und erst
//    nach einem Abschluss. Gefordert ist sie nach JEDEM gehaltenen Termin.
// 2. Gefragt zaehlt, nicht geerntet. Auch null Namen setzen den Zeitstempel:
//    sonst stuende dieselbe Frage morgen wieder da und der Partner lernt, sie
//    wegzuklicken.
//
// Liegt in lib/ und nicht in einer Aktionsdatei, weil zwei Server-Actions sie
// teilen - und "use server"-Module ausschliesslich async Funktionen
// exportieren duerfen.

import { berlinToday, dayToUtcDate } from "@/lib/dates";
import type { Prisma } from "@/lib/generated/prisma/client";

export type EmpfehlungsEintrag = { name: string; phone: string };

/** Liest die Empfehlungszeilen aus einem Formular; leere Zeilen fallen weg. */
export function empfehlungenAusFormular(formData: FormData): EmpfehlungsEintrag[] {
  const names = formData.getAll("referralName").map((value) => String(value).trim());
  const phones = formData.getAll("referralPhone").map((value) => String(value).trim());
  return names
    .map((name, index) => ({ name, phone: phones[index] ?? "" }))
    .filter((entry) => entry.name.length > 0);
}

/**
 * Legt die empfohlenen Namen an und haelt fest, dass gefragt wurde.
 * Laeuft innerhalb einer bestehenden Transaktion.
 */
export async function empfehlungenAnlegen(
  tx: Prisma.TransactionClient,
  params: {
    userId: string;
    personId: string;
    contactId: string;
    contactName: string;
    entries: EmpfehlungsEintrag[];
  }
): Promise<number> {
  const today = dayToUtcDate(berlinToday());

  for (const entry of params.entries) {
    const created = await tx.contact.create({
      data: {
        name: entry.name,
        phone: entry.phone || null,
        source: `Empfehlung von ${params.contactName}`,
        ownerId: params.userId,
        referredById: params.contactId,
        stage: "NEU",
        // Eine Empfehlung ist frisch und warm: sie bekommt als einziger neuer
        // Name sofort eine Frist. Wer drei Tage wartet, ruft einen Fremden an.
        nextStepType: "ANRUF",
        nextStepAt: today,
        nextStepNote: "Erstanruf (Empfehlung)",
      },
    });
    await tx.stageEvent.create({
      data: { contactId: created.id, toStage: "NEU", userId: params.userId },
    });
    await tx.dailyLog.create({
      data: { personId: params.personId, type: "NUMBERS_PULLED", count: 1, date: today },
    });
  }

  await tx.contact.update({
    where: { id: params.contactId },
    data: { referralsAskedAt: new Date() },
  });

  return params.entries.length;
}
