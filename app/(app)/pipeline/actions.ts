"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, requireUserPerson } from "@/lib/auth";
import { eigene } from "@/lib/scope";
import {
  addDays,
  addMonths,
  berlinDayOf,
  berlinLocalToUtc,
  berlinToday,
  dayToUtcDate,
} from "@/lib/dates";
import {
  CONTACT_PLAYBOOK,
  isContactStage,
  isLostReason,
  isNextStepType,
  playbookDueDate,
} from "@/lib/pipeline";
import type { ContactStage, NextStepType } from "@/lib/generated/prisma/enums";
import {
  empfehlungenAnlegen,
  empfehlungenAusFormular,
  rueckmeldungAnEmpfehlungsgeber,
} from "@/lib/empfehlungen";
import type { Prisma } from "@/lib/generated/prisma/client";

// --- gemeinsame Bausteine ---------------------------------------------------

function refreshPipelineViews(contactId?: string) {
  revalidatePath("/heute");
  revalidatePath("/namen");
  revalidatePath("/trichter");
  revalidatePath("/leaderboard");
  if (contactId) revalidatePath(`/contacts/${contactId}`);
}

type Tx = Prisma.TransactionClient;

type StepInput = {
  type: NextStepType | null;
  at: Date | null;
  note: string | null;
};

const EMPTY_STEP: StepInput = { type: null, at: null, note: null };

function text(formData: FormData, field: string): string | null {
  const value = (formData.get(field) as string | null)?.trim();
  return value ? value : null;
}

// Faelligkeit aus Datum (+ optionaler Uhrzeit). Ohne Uhrzeit gilt der Tag.
function parseDue(day: string | null, time: string | null): Date | null {
  if (!day) return null;
  if (time) return berlinLocalToUtc(`${day}T${time}`);
  return dayToUtcDate(day);
}

// Liest den naechsten Schritt aus dem Formular.
// null = Feld gar nicht mitgeschickt (dann greift das Playbook),
// EMPTY_STEP = bewusst "kein weiterer Schritt" gewaehlt.
function readNextStep(formData: FormData): StepInput | null {
  if (!formData.has("nextStepType")) return null;
  const typeRaw = text(formData, "nextStepType");
  if (!typeRaw || !isNextStepType(typeRaw)) return EMPTY_STEP;
  const at =
    parseDue(text(formData, "nextStepDate"), text(formData, "nextStepTime")) ??
    dayToUtcDate(berlinToday());
  return { type: typeRaw, at, note: text(formData, "nextStepNote") };
}

// Vorbelegung aus dem Playbook, wenn das Formular nichts mitgibt.
function stepFromPlaybook(stage: ContactStage, appointmentAt?: Date | null): StepInput {
  const entry = CONTACT_PLAYBOOK[stage];
  if (!entry) return EMPTY_STEP;
  const raw = playbookDueDate(entry, new Date(), appointmentAt);
  // Reine Fristen liegen auf dem Tag, Termin-Schritte behalten die Uhrzeit.
  const at = entry.useAppointment && appointmentAt ? raw : dayToUtcDate(berlinDayOf(raw));
  return { type: entry.type, at, note: entry.note };
}

function stepData(step: StepInput) {
  return {
    nextStepType: step.type,
    nextStepAt: step.at,
    nextStepNote: step.note,
  };
}

async function recordStageEvent(
  tx: Tx,
  params: { contactId: string; from: string | null; to: string; userId: string }
) {
  if (params.from === params.to) return;
  await tx.stageEvent.create({
    data: {
      contactId: params.contactId,
      fromStage: params.from,
      toStage: params.to,
      userId: params.userId,
    },
  });
}

async function award(
  tx: Tx,
  personId: string,
  type: "APPOINTMENT_SET" | "APPOINTMENT_HELD" | "DEAL_WON",
  count: number
) {
  await tx.dailyLog.create({
    data: { personId, type, count, date: dayToUtcDate(berlinToday()) },
  });
}

async function loadOwnContact(userId: string, contactId: string) {
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, ...eigene(userId).kontakte },
  });
  if (!contact) throw new Error("Kontakt nicht gefunden.");
  return contact;
}

// --- Kontakt: Phasenwechsel -------------------------------------------------

export async function setContactStage(formData: FormData) {
  const user = await requireUser();
  const person = await requireUserPerson(user.id);
  const contactId = text(formData, "contactId");
  const stageRaw = text(formData, "stage");
  if (!contactId || !stageRaw || !isContactStage(stageRaw)) {
    throw new Error("Ungueltige Daten fuer den Phasenwechsel.");
  }
  const stage: ContactStage = stageRaw;
  const contact = await loadOwnContact(user.id, contactId);

  const appointmentLocal = text(formData, "appointmentAt");
  const appointmentAt = appointmentLocal
    ? berlinLocalToUtc(appointmentLocal)
    : contact.appointmentAt;

  const needsAppointment = stage === "TERMIN_VEREINBART";
  if (needsAppointment && !appointmentAt) {
    throw new Error("Fuer diese Phase wird ein Termin mit Datum und Uhrzeit gebraucht.");
  }

  const step = readNextStep(formData) ?? stepFromPlaybook(stage, appointmentAt);

  const setsAppointmentPoint =
    stage === "TERMIN_VEREINBART" && !contact.appointmentLoggedAt;
  // Der gehaltene Termin wird einmal je Kontakt gezaehlt, nicht bei jedem
  // Rueckwechsel in die Beratung.
  const heldAppointmentPoint =
    stage === "TERMIN_GEHALTEN" && !contact.appointmentHeldLoggedAt;
  // Der Abschluss ebenso: ein Kontakt schliesst einmal ab, nicht bei jedem
  // Speichern der Phase aufs Neue.
  const wonPoint = stage === "ABSCHLUSS" && !contact.wonLoggedAt;

  await prisma.$transaction(async (tx) => {
    await tx.contact.update({
      where: { id: contactId },
      data: {
        stage,
        // Ein Phasenwechsel holt einen verlorenen Kontakt zurueck; als Kunde
        // gilt er als gewonnen.
        ...(stage === "ABSCHLUSS"
          ? { outcome: "GEWONNEN" as const, lostReason: null, lostAt: null }
          : contact.outcome === "VERLOREN"
            ? { outcome: "OFFEN" as const, lostReason: null, lostAt: null }
            : {}),
        ...(appointmentAt && needsAppointment ? { appointmentAt } : {}),
        ...(setsAppointmentPoint ? { appointmentLoggedAt: new Date() } : {}),
        ...(heldAppointmentPoint ? { appointmentHeldLoggedAt: new Date() } : {}),
        ...(wonPoint ? { wonLoggedAt: new Date() } : {}),
        ...stepData(step),
      },
    });

    await recordStageEvent(tx, {
      contactId,
      from: contact.stage,
      to: stage,
      userId: user.id,
    });

    if (setsAppointmentPoint) await award(tx, person.id, "APPOINTMENT_SET", 1);
    if (heldAppointmentPoint) await award(tx, person.id, "APPOINTMENT_HELD", 1);
    // Zaehler bleibt 1 = ein Abschluss; die Gewichtung macht die Rangliste
    // ueber quotaTypePoints.
    if (wonPoint) await award(tx, person.id, "DEAL_WON", 1);

    // Der Kreis schliesst sich: wer einen Namen gegeben hat, erfaehrt, was
    // daraus geworden ist. Genau daran haengt die ZWEITE Empfehlung - ohne
    // Rueckmeldung hoert der Geber nie wieder etwas von seinem Namen.
    //
    // Ausgeloest beim ersten gehaltenen Termin oder Abschluss, nicht schon
    // beim vereinbarten: ein Termin, der noch platzen kann, ist keine
    // Nachricht wert.
    if (contact.referredById && (heldAppointmentPoint || wonPoint)) {
      await rueckmeldungAnEmpfehlungsgeber(tx, {
        empfohlenerId: contactId,
        empfohlenerName: contact.name,
        referredById: contact.referredById,
        ereignis: wonPoint ? "ein Abschluss" : "ein gehaltener Termin",
      });
    }
  });

  refreshPipelineViews(contactId);
}

// --- Kontakt: Schritt erledigen --------------------------------------------

export async function completeContactStep(formData: FormData) {
  const user = await requireUser();
  const person = await requireUserPerson(user.id);
  const contactId = text(formData, "contactId");
  if (!contactId) throw new Error("Kontakt-ID fehlt.");
  const contact = await loadOwnContact(user.id, contactId);

  const doneType = contact.nextStepType;
  const activityType =
    doneType === "TERMIN" ? "MEETING" : doneType === "ANRUF" ? "CALL" : "EMAIL";
  const note = text(formData, "text") ?? "Schritt erledigt";

  const step = readNextStep(formData) ?? EMPTY_STEP;

  await prisma.$transaction(async (tx) => {
    const activity = await tx.activity.create({
      data: { contactId, type: activityType, text: note },
    });
    if (activityType === "CALL") {
      await tx.dailyLog.create({
        data: {
          personId: person.id,
          activityId: activity.id,
          type: "CALL",
          count: 1,
          date: dayToUtcDate(berlinToday()),
        },
      });
    }
    await tx.contact.update({
      where: { id: contactId },
      data: stepData(step),
    });
  });

  refreshPipelineViews(contactId);
}

export async function snoozeContactStep(formData: FormData) {
  const user = await requireUser();
  const contactId = text(formData, "contactId");
  const days = Number(text(formData, "days") ?? "0");
  if (!contactId || !isFinite(days)) throw new Error("Ungueltige Daten.");
  const contact = await loadOwnContact(user.id, contactId);

  const base = dayToUtcDate(berlinToday());
  await prisma.contact.update({
    where: { id: contactId },
    data: {
      nextStepAt: addDays(base, days),
      nextStepType: contact.nextStepType ?? "ANRUF",
    },
  });

  refreshPipelineViews(contactId);
}

// --- Kontakt: verloren / reaktivieren --------------------------------------

export async function markContactLost(formData: FormData) {
  const user = await requireUser();
  const contactId = text(formData, "contactId");
  const reasonRaw = text(formData, "lostReason");
  if (!contactId || !reasonRaw || !isLostReason(reasonRaw)) {
    throw new Error("Bitte einen Verlustgrund angeben.");
  }
  const contact = await loadOwnContact(user.id, contactId);
  const askReferral = text(formData, "askReferral") === "on";

  // "Spaeter nochmal" bleibt verloren, meldet sich aber von selbst zurueck.
  const step: StepInput = askReferral
    ? {
        type: "EMPFEHLUNG_ERFRAGEN",
        at: addDays(dayToUtcDate(berlinToday()), 2),
        note: "Trotz Absage nach Empfehlungen fragen",
      }
    : reasonRaw === "SPAETER_NOCHMAL"
      ? {
          type: "ANRUF",
          at: addMonths(dayToUtcDate(berlinToday()), 6),
          note: "Erneut ansprechen",
        }
      : EMPTY_STEP;

  await prisma.$transaction(async (tx) => {
    await tx.contact.update({
      where: { id: contactId },
      data: {
        outcome: "VERLOREN",
        lostReason: reasonRaw,
        lostAt: new Date(),
        ...stepData(step),
      },
    });
    await recordStageEvent(tx, {
      contactId,
      from: contact.stage,
      to: `VERLOREN:${reasonRaw}`,
      userId: user.id,
    });
  });

  refreshPipelineViews(contactId);
}

export async function reopenContact(formData: FormData) {
  const user = await requireUser();
  const contactId = text(formData, "contactId");
  if (!contactId) throw new Error("Kontakt-ID fehlt.");
  const contact = await loadOwnContact(user.id, contactId);

  const step = stepFromPlaybook(contact.stage, contact.appointmentAt);
  await prisma.contact.update({
    where: { id: contactId },
    data: {
      outcome: contact.stage === "ABSCHLUSS" ? "GEWONNEN" : "OFFEN",
      lostReason: null,
      lostAt: null,
      ...stepData(step),
    },
  });

  refreshPipelineViews(contactId);
}

// --- Empfehlungen -----------------------------------------------------------
// Der Motor der Schleife: jeder gehaltene Termin bringt neue Namen. Die Frage
// ist deshalb KEINE Phase mehr - als Phase konnte sie nur einmal je Kontakt
// gestellt werden, und erst nach einem Abschluss. Sie ist ein Zeitstempel.

export async function addReferrals(formData: FormData) {
  const user = await requireUser();
  const person = await requireUserPerson(user.id);
  const contactId = text(formData, "contactId");
  if (!contactId) throw new Error("Kontakt-ID fehlt.");
  const contact = await loadOwnContact(user.id, contactId);

  await prisma.$transaction(async (tx) => {
    await empfehlungenAnlegen(tx, {
      userId: user.id,
      personId: person.id,
      contactId,
      contactName: contact.name,
      entries: empfehlungenAusFormular(formData),
    });
  });

  refreshPipelineViews(contactId);
}
