"use server";

// Die drei Gespraechsergebnisse als Ein-Tipp-Aktionen.
//
// Sie lagen bisher in app/(app)/namen/actions.ts und waren damit nur von der
// Namensliste aus zu finden. Sie sind aber nicht namenslisten-spezifisch: die
// Heute-Liste braucht genau dieselben drei Knoepfe.
//
// Jedes Ergebnis laeuft ueber die bestehenden Server-Actions – gleiche
// Pruefungen, gleiche Wettbewerbspunkte, gleiche Phasenhistorie. Es gibt
// keinen zweiten Weg in die Datenbank, der eigene Fehler machen kann.

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, requireUserPerson } from "@/lib/auth";
import { offenerUndoEintrag, undoAusfuehren, withUndo } from "@/lib/undo";
import { addDays, berlinToday, dayToUtcDate } from "@/lib/dates";
import { empfehlungenAnlegen, empfehlungenAusFormular } from "@/lib/empfehlungen";
import { meldeNebenbei } from "@/lib/push";
import { fortschrittJetzt } from "@/lib/liegenbleiber";
import { createActivity, quickLogCall } from "@/app/(app)/contacts/actions";
import { markContactLost, setContactStage } from "@/app/(app)/pipeline/actions";

export type CallResult = "appointment" | "unreachable" | "later";

const RESULT_NOTES: Record<CallResult, string> = {
  appointment: "Termin vereinbart",
  unreachable: "Nicht erreicht",
  later: "Später nochmal ansprechen",
};

const RESULT_LABELS: Record<CallResult, string> = {
  appointment: "Termin vereinbart",
  unreachable: "Nicht erreicht",
  later: "Auf später gelegt",
};

function text(formData: FormData, field: string): string | null {
  const value = (formData.get(field) as string | null)?.trim();
  return value ? value : null;
}

function refreshViews(contactId: string) {
  revalidatePath("/heute");
  revalidatePath("/namen");
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

// --- Der gehaltene Termin ---------------------------------------------------
//
// Der wichtigste Erfassungsmoment der ganzen Schleife, und der einzige, an dem
// bewusst mehr als ein Ergebnis abgefragt wird: Was kam raus - UND wen hat er
// dir empfohlen. Die zweite Frage steht auf demselben Bildschirm, weil sie
// sonst umgangen wird. Als Playbook-Vorschlag drei Tage spaeter war sie es.
//
// Bezahlt wird das mit null zusaetzlichen Tipps: das Antippen des Ergebnisses
// speichert beides.

export type AppointmentResult = "abschluss" | "offen" | "kein_abschluss";

const APPOINTMENT_LABELS: Record<AppointmentResult, string> = {
  abschluss: "Abschluss",
  offen: "Termin gehalten, Ergebnis offen",
  kein_abschluss: "Termin gehalten, kein Abschluss",
};

export async function recordAppointmentResult(formData: FormData) {
  const user = await requireUser();
  const person = await requireUserPerson(user.id);
  const contactId = text(formData, "contactId");
  const resultRaw = text(formData, "result");
  if (!contactId || !resultRaw) throw new Error("Ergebnis fehlt.");

  const result = resultRaw as AppointmentResult;
  if (!(result in APPOINTMENT_LABELS)) throw new Error("Unbekanntes Ergebnis.");

  const contact = await loadOwnContact(user.id, contactId);
  const empfehlungen = empfehlungenAusFormular(formData);

  await withUndo(
    {
      userId: user.id,
      personId: person.id,
      contactId,
      label: `${APPOINTMENT_LABELS[result]}: ${contact.name}`,
    },
    async () => {
      // Der Termin selbst laeuft ueber setContactStage: dort haengen der
      // Punkt fuer den gehaltenen Termin, der fuer den Abschluss und die
      // Phasenhistorie. Kein zweiter Weg in die Datenbank.
      const meeting = new FormData();
      meeting.set("contactId", contactId);
      meeting.set("type", "MEETING");
      meeting.set("text", APPOINTMENT_LABELS[result]);
      await createActivity(meeting);

      const stage = new FormData();
      stage.set("contactId", contactId);
      stage.set("stage", result === "abschluss" ? "ABSCHLUSS" : "TERMIN_GEHALTEN");
      await setContactStage(stage);

      if (result === "kein_abschluss") {
        const lost = new FormData();
        lost.set("contactId", contactId);
        lost.set("lostReason", "KEIN_BEDARF");
        await markContactLost(lost);
      }

      await prisma.$transaction(async (tx) => {
        await empfehlungenAnlegen(tx, {
          userId: user.id,
          personId: person.id,
          contactId,
          contactName: contact.name,
          entries: empfehlungen,
        });
      });
    }
  );

  // Ein Abschluss ist das seltenste Ereignis im Netzwerk - und das einzige,
  // fuer das es sich lohnt, alle anderen zu stoeren. Der Rest der Rangliste
  // erfaehrt es beim naechsten Aufruf von selbst.
  if (result === "abschluss") {
    const andere = await prisma.user.findMany({
      where: { id: { not: user.id }, deactivatedAt: null },
      select: { id: true },
    });
    meldeNebenbei(
      andere.map((konto) => konto.id),
      {
        titel: `${user.name} hat abgeschlossen.`,
        text: "Steht in der Rangliste. Wo stehst du?",
        url: "/arena",
        kennung: "abschluss",
      }
    );
  }

  refreshViews(contactId);
}

/**
 * Der Termin ist geplatzt. Der Kontakt bleibt in "Termin vereinbart" und
 * bekommt einen Anruf in zwei Tagen - ein geplatzter Termin ist kein
 * verlorener Mensch. Bewusst OHNE Punkt: die Fruehwarnung der Fuehrungskraft
 * lebt genau von der Luecke zwischen vereinbart und gehalten.
 */
export async function recordAppointmentMissed(formData: FormData) {
  const user = await requireUser();
  const person = await requireUserPerson(user.id);
  const contactId = text(formData, "contactId");
  if (!contactId) throw new Error("Kontakt-ID fehlt.");
  const contact = await loadOwnContact(user.id, contactId);

  await withUndo(
    {
      userId: user.id,
      personId: person.id,
      contactId,
      label: `Termin geplatzt: ${contact.name}`,
    },
    async () => {
      const note = new FormData();
      note.set("contactId", contactId);
      note.set("type", "MEETING");
      note.set("text", "Termin geplatzt");
      await createActivity(note);

      await prisma.contact.update({
        where: { id: contactId },
        data: {
          appointmentAt: null,
          nextStepType: "ANRUF",
          nextStepAt: addDays(dayToUtcDate(berlinToday()), 2),
          nextStepNote: "Neuen Termin holen",
        },
      });
    }
  );

  refreshViews(contactId);
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
        // Wer verschiebt, hat sich gekuemmert - der Liegenbleiber-Alarm
        // schweigt bis zur neuen Frist. Ohne das waere "auf morgen legen"
        // ein Knopf, der die Meldung NICHT wegbekommt.
        ...fortschrittJetzt(),
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
  revalidatePath("/leaderboard");
  return label;
}
