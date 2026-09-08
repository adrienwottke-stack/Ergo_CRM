// Rueckgaengig fuer Schnellaktionen.
//
// Der Ansatz ist bewusst kein Aktions-Protokoll, sondern ein Vorher-Nachher-
// Vergleich: vor der Aktion wird der Kontakt und die Menge der vorhandenen
// Zeilen festgehalten, danach noch einmal. Was neu ist, wurde von der Aktion
// erzeugt; was sich am Kontakt geaendert hat, steht im Vorher-Zustand.
//
// Der Vorteil: es funktioniert fuer jede bestehende Server-Action, ohne sie
// anzufassen. Kein zweiter Weg in die Datenbank, keine doppelte Pflege.

import { prisma } from "@/lib/prisma";
import { berlinToday, dayToUtcDate } from "@/lib/dates";
import { UNDO_WINDOW_SECONDS } from "@/lib/undo-window";
import { Prisma } from "@/lib/generated/prisma/client";

export { UNDO_WINDOW_SECONDS };

// Etwas Luft fuer den Weg zum Server: wer bei Sekunde 29 tippt, soll nicht
// ins Leere greifen.
const SERVER_GRACE_SECONDS = 15;

// Felder, die eine Schnellaktion am Kontakt veraendern kann.
const CONTACT_FIELDS = [
  "stage",
  "outcome",
  "lostReason",
  "lostAt",
  "nextStepType",
  "nextStepAt",
  "nextStepNote",
  "appointmentAt",
  "appointmentLoggedAt",
  "appointmentHeldLoggedAt",
  "wonLoggedAt",
  "rating",
  "listKinds",
  "note",
  "phone",
] as const;

// Aus JSON kommen Zeitpunkte als Zeichenkette zurueck und muessen wieder zu
// Date werden, sonst lehnt Prisma sie ab.
const DATE_FIELDS = new Set([
  "lostAt",
  "nextStepAt",
  "appointmentAt",
  "appointmentLoggedAt",
  "appointmentHeldLoggedAt",
  "wonLoggedAt",
]);

type ContactState = Record<string, unknown>;

type Snapshot = {
  contact: ContactState | null;
  activityIds: string[];
  stageEventIds: string[];
  dailyLogIds: string[];
};

export type UndoPatch = {
  contactId: string;
  contactBefore: ContactState | null;
  newActivityIds: string[];
  newStageEventIds: string[];
  newDailyLogIds: string[];
};

async function snapshot(contactId: string, personId: string): Promise<Snapshot> {
  const today = dayToUtcDate(berlinToday());
  const [contact, activities, stageEvents, dailyLogs] = await Promise.all([
    prisma.contact.findUnique({ where: { id: contactId } }),
    prisma.activity.findMany({ where: { contactId }, select: { id: true } }),
    prisma.stageEvent.findMany({ where: { contactId }, select: { id: true } }),
    // Punkte ohne Aktivitaetsbezug (Termin vereinbart, Abschluss) haengen nicht
    // am Kontakt – deshalb ueber Person und heutigen Tag eingegrenzt.
    prisma.dailyLog.findMany({
      where: { personId, date: today },
      select: { id: true },
    }),
  ]);

  const state: ContactState | null = contact
    ? Object.fromEntries(CONTACT_FIELDS.map((field) => [field, contact[field]]))
    : null;

  return {
    contact: state,
    activityIds: activities.map((row) => row.id),
    stageEventIds: stageEvents.map((row) => row.id),
    dailyLogIds: dailyLogs.map((row) => row.id),
  };
}

function added(before: string[], after: string[]): string[] {
  const known = new Set(before);
  return after.filter((id) => !known.has(id));
}

function changed(before: ContactState | null, after: ContactState | null): boolean {
  if (!before || !after) return false;
  return CONTACT_FIELDS.some(
    (field) => JSON.stringify(before[field]) !== JSON.stringify(after[field])
  );
}

/**
 * Fuehrt eine Aktion aus und legt daneben einen Rueckgaengig-Eintrag an.
 *
 * Schlaegt das Festhalten fehl, laeuft die Aktion trotzdem durch – lieber
 * eine gespeicherte Aenderung ohne Rueckgaengig als ein verlorenes Ergebnis.
 */
export async function withUndo<T>(
  params: { userId: string; personId: string; contactId: string; label: string },
  run: () => Promise<T>
): Promise<T> {
  const before = await snapshot(params.contactId, params.personId);
  const result = await run();

  try {
    const after = await snapshot(params.contactId, params.personId);

    const patch: UndoPatch = {
      contactId: params.contactId,
      contactBefore: changed(before.contact, after.contact) ? before.contact : null,
      newActivityIds: added(before.activityIds, after.activityIds),
      newStageEventIds: added(before.stageEventIds, after.stageEventIds),
      newDailyLogIds: added(before.dailyLogIds, after.dailyLogIds),
    };

    const nothingToUndo =
      !patch.contactBefore &&
      patch.newActivityIds.length === 0 &&
      patch.newStageEventIds.length === 0 &&
      patch.newDailyLogIds.length === 0;

    if (!nothingToUndo) {
      await prisma.undoEntry.create({
        data: {
          userId: params.userId,
          contactId: params.contactId,
          label: params.label,
          patch: patch as unknown as object,
        },
      });
    }
  } catch {
    // Bewusst geschluckt: die eigentliche Aktion ist gelaufen.
  }

  return result;
}

/** Der juengste zurueckenehmbare Eintrag, sofern er noch im Fenster liegt. */
export async function offenerUndoEintrag(userId: string) {
  const since = new Date(Date.now() - UNDO_WINDOW_SECONDS * 1000);
  return prisma.undoEntry.findFirst({
    where: { userId, undoneAt: null, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    select: { id: true, label: true, createdAt: true },
  });
}

/**
 * Nimmt einen Eintrag zurueck: erzeugte Zeilen loeschen, Kontaktfelder auf den
 * Vorher-Zustand setzen.
 *
 * Reihenfolge ist wichtig – Aktivitaeten zuerst, weil ihr Wettbewerbspunkt per
 * Cascade mitgeht; die uebrigen Punkte werden danach einzeln entfernt.
 */
export async function undoAusfuehren(userId: string, entryId?: string) {
  const since = new Date(
    Date.now() - (UNDO_WINDOW_SECONDS + SERVER_GRACE_SECONDS) * 1000
  );
  const entry = await prisma.undoEntry.findFirst({
    where: {
      ...(entryId ? { id: entryId } : {}),
      userId,
      undoneAt: null,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!entry) return null;

  const patch = entry.patch as unknown as UndoPatch;

  await prisma.$transaction(async (tx) => {
    // Das Abschlussfenster kann nach der Kontaktaktion bereits Einheiten
    // zugeordnet haben. Diese Verbindung muss vor dem Löschen der StageEvents
    // gelesen werden: deren Cascade entfernt die Erinnerung, aber nicht die
    // eigentliche Buchung. Nur explizit an DIESE neuen Abschlüsse gebundene
    // Buchungen gehören zum Undo; freie Einträge und andere Abschlüsse bleiben.
    if (patch.newStageEventIds?.length) {
      // Auch noch ungebuchte Erinnerungen sperren. Sonst könnte zwischen dem
      // Lesen und der Cascade eine gleichzeitig abgeschickte Einheit ankommen
      // und ohne ihre Zuordnung übrig bleiben.
      await tx.$queryRaw(Prisma.sql`
        SELECT "id" FROM "EinheitenErinnerung"
        WHERE "userId" = ${userId} AND "contactId" = ${patch.contactId}
          AND "abschlussId" IN (${Prisma.join(patch.newStageEventIds)})
        FOR UPDATE
      `);
      const zugeordnet = await tx.einheitenErinnerung.findMany({
        where: {
          userId,
          contactId: patch.contactId,
          abschlussId: { in: patch.newStageEventIds },
          buchungId: { not: null },
          abschluss: { toStage: "ABSCHLUSS", userId },
        },
        select: { buchungId: true },
      });
      const buchungIds = zugeordnet.flatMap((erinnerung) => erinnerung.buchungId ? [erinnerung.buchungId] : []);
      if (buchungIds.length > 0) {
        await tx.einheitenbuchung.deleteMany({ where: { userId, id: { in: buchungIds } } });
      }
    }
    if (patch.newActivityIds?.length) {
      await tx.activity.deleteMany({ where: { id: { in: patch.newActivityIds } } });
    }
    if (patch.newDailyLogIds?.length) {
      await tx.dailyLog.deleteMany({ where: { id: { in: patch.newDailyLogIds } } });
    }
    if (patch.newStageEventIds?.length) {
      await tx.stageEvent.deleteMany({ where: { id: { in: patch.newStageEventIds } } });
    }

    if (patch.contactBefore) {
      const data: Record<string, unknown> = {};
      for (const [field, value] of Object.entries(patch.contactBefore)) {
        if (field === "listKinds") {
          data[field] = { set: (value as string[]) ?? [] };
        } else if (DATE_FIELDS.has(field)) {
          data[field] = value ? new Date(value as string) : null;
        } else {
          data[field] = value;
        }
      }
      // Der Kontakt kann zwischenzeitlich geloescht worden sein.
      await tx.contact.updateMany({
        where: { id: patch.contactId, ownerId: userId },
        data,
      });
    }

    await tx.undoEntry.update({
      where: { id: entry.id },
      data: { undoneAt: new Date() },
    });
  });

  return entry.label;
}
