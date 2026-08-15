"use server";

// Die vier Gespraechsergebnisse als Ein-Tipp-Aktionen.
//
// Sie lagen bisher in app/(app)/namen/actions.ts und waren damit nur von der
// Namensliste aus zu finden. Sie sind aber nicht namenslisten-spezifisch: die
// Heute-Liste braucht genau dieselben vier Knoepfe.
//
// Jedes Ergebnis laeuft ueber die bestehenden Server-Actions – gleiche
// Pruefungen, gleiche Wettbewerbspunkte, gleiche Phasenhistorie. Es gibt
// keinen zweiten Weg in die Datenbank, der eigene Fehler machen kann.

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, requireUserPerson } from "@/lib/auth";
import { offenerUndoEintrag, undoAusfuehren, withUndo } from "@/lib/undo";
import { addDays, berlinToday, dayToUtcDate } from "@/lib/dates";
import { isLostReason } from "@/lib/pipeline";
import { createActivity, quickLogCall } from "@/app/(app)/contacts/actions";
import { markContactLost, setContactStage } from "@/app/(app)/pipeline/actions";

export type CallResult = "appointment" | "unreachable" | "later" | "lost";

const RESULT_NOTES: Record<CallResult, string> = {
  appointment: "Termin vereinbart",
  unreachable: "Nicht erreicht",
  later: "Später nochmal ansprechen",
  lost: "Kein Interesse",
};

const RESULT_LABELS: Record<CallResult, string> = {
  appointment: "Termin vereinbart",
  unreachable: "Nicht erreicht",
  later: "Auf später gelegt",
  lost: "Kein Interesse",
};

function text(formData: FormData, field: string): string | null {
  const value = (formData.get(field) as string | null)?.trim();
  return value ? value : null;
}

function refreshViews(contactId: string) {
  revalidatePath("/heute");
  revalidatePath("/namen");
  revalidatePath("/pipeline");
  revalidatePath("/contacts");
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
  revalidatePath(`/contacts/${contactId}`);
}

async function loadOwnContact(userId: string, contactId: string) {
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, ownerId: userId },
    select: { id: true, name: true, nextStepType: true },
  });
  if (!contact) throw new Error("Kontakt nicht gefunden.");
  return contact;
}

export async function recordCallResult(formData: FormData) {
  const user = await requireUser();
  const person = await requireUserPerson(user.id);
  const contactId = text(formData, "contactId");
  const resultRaw = text(formData, "result");
  if (!contactId || !resultRaw) throw new Error("Ergebnis fehlt.");

  const result = resultRaw as CallResult;
  if (!(result in RESULT_NOTES)) throw new Error("Unbekanntes Ergebnis.");

  const contact = await loadOwnContact(user.id, contactId);
  const note = text(formData, "note") ?? RESULT_NOTES[result];

  await withUndo(
    {
      userId: user.id,
      personId: person.id,
      contactId,
      label: `${RESULT_LABELS[result]}: ${contact.name}`,
    },
    async () => {
      switch (result) {
        case "unreachable":
        case "later": {
          // quickLogCall loggt den Anruf, hebt NEU auf KONTAKTIERT und setzt
          // die Wiedervorlage – genau das, was hier gebraucht wird.
          const days = result === "unreachable" ? "2" : (text(formData, "days") ?? "7");
          const data = new FormData();
          data.set("contactId", contactId);
          data.set("note", note);
          data.set("followUpDays", days);
          await quickLogCall(data);
          break;
        }

        case "appointment": {
          const appointment = text(formData, "appointmentAt");
          if (!appointment) {
            throw new Error("Für den Termin werden Datum und Uhrzeit gebraucht.");
          }
          const call = new FormData();
          call.set("contactId", contactId);
          call.set("type", "CALL");
          call.set("text", note);
          await createActivity(call);

          const stage = new FormData();
          stage.set("contactId", contactId);
          stage.set("stage", "TERMIN_VEREINBART");
          stage.set("appointmentAt", appointment);
          await setContactStage(stage);
          break;
        }

        case "lost": {
          const call = new FormData();
          call.set("contactId", contactId);
          call.set("type", "CALL");
          call.set("text", note);
          await createActivity(call);

          const reason = text(formData, "lostReason");
          const lost = new FormData();
          lost.set("contactId", contactId);
          lost.set(
            "lostReason",
            reason && isLostReason(reason) ? reason : "KEIN_INTERESSE"
          );
          await markContactLost(lost);
          break;
        }
      }
    }
  );

  refreshViews(contactId);
}

/**
 * Faelligkeit verschieben, ohne Dialog. Anders als `snoozeContactStep` traegt
 * das hier ein Rueckgaengig – die Chips sind Ein-Tipp-Aktionen.
 */
export async function snoozeStepQuick(formData: FormData) {
  const user = await requireUser();
  const person = await requireUserPerson(user.id);
  const contactId = text(formData, "contactId");
  const days = Number(text(formData, "days") ?? "0");
  if (!contactId || !isFinite(days)) throw new Error("Ungueltige Daten.");

  const contact = await loadOwnContact(user.id, contactId);
  const label =
    days <= 1
      ? `Auf morgen gelegt: ${contact.name}`
      : `Um ${days} Tage verschoben: ${contact.name}`;

  await withUndo({ userId: user.id, personId: person.id, contactId, label }, async () => {
    await prisma.contact.update({
      where: { id: contactId },
      data: {
        nextStepAt: addDays(dayToUtcDate(berlinToday()), days),
        nextStepType: contact.nextStepType ?? "ANRUF",
      },
    });
  });

  refreshViews(contactId);
}

/**
 * Schritt erledigen ohne Pflicht-Freitext. Der Notiztext ist freiwillig; fehlt
 * er, wird der Schritt selbst als Text festgehalten.
 */
export async function completeStepQuick(formData: FormData) {
  const user = await requireUser();
  const person = await requireUserPerson(user.id);
  const contactId = text(formData, "contactId");
  if (!contactId) throw new Error("Kontakt-ID fehlt.");

  const contact = await loadOwnContact(user.id, contactId);
  const doneType = contact.nextStepType;
  const activityType =
    doneType === "TERMIN" ? "MEETING" : doneType === "ANRUF" ? "CALL" : "EMAIL";
  const note = text(formData, "note") ?? "Schritt erledigt";

  await withUndo(
    {
      userId: user.id,
      personId: person.id,
      contactId,
      label: `Erledigt: ${contact.name}`,
    },
    async () => {
      const activity = new FormData();
      activity.set("contactId", contactId);
      activity.set("type", activityType);
      activity.set("text", note);
      await createActivity(activity);

      // Ohne Folgeschritt bleibt der Kontakt in der Warnliste "ohne naechsten
      // Schritt" stehen – das ist gewollt und sichtbar, kein stiller Verlust.
      await prisma.contact.update({
        where: { id: contactId },
        data: { nextStepType: null, nextStepAt: null, nextStepNote: null },
      });
    }
  );

  refreshViews(contactId);
}

/** Der juengste noch zurueckenehmbare Eintrag, fuer die Anzeige unten. */
export async function getOpenUndo() {
  const user = await requireUser();
  return offenerUndoEintrag(user.id);
}

export async function undoLast(formData: FormData) {
  const user = await requireUser();
  const entryId = text(formData, "entryId");
  const label = await undoAusfuehren(user.id, entryId ?? undefined);

  revalidatePath("/heute");
  revalidatePath("/namen");
  revalidatePath("/pipeline");
  revalidatePath("/contacts");
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
  return label;
}
