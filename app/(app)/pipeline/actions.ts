"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, requireUserPerson } from "@/lib/auth";
import {
  addDays,
  addMonths,
  berlinDayOf,
  berlinLocalToUtc,
  berlinToday,
  dayToUtcDate,
} from "@/lib/dates";
import {
  CHECKUP_INTERVAL_MONTHS,
  CONTACT_PLAYBOOK,
  DEAL_PLAYBOOK,
  calcUnits,
  euroToCents,
  isContactStage,
  isDealLine,
  isDealStage,
  isLostReason,
  isNextStepType,
  playbookDueDate,
} from "@/lib/pipeline";
import type {
  ContactStage,
  DealStage,
  NextStepType,
} from "@/lib/generated/prisma/enums";
import type { Prisma } from "@/lib/generated/prisma/client";

// --- gemeinsame Bausteine ---------------------------------------------------

function refreshPipelineViews(contactId?: string) {
  revalidatePath("/heute");
  revalidatePath("/pipeline");
  revalidatePath("/vorgaenge");
  revalidatePath("/contacts");
  revalidatePath("/dashboard");
  revalidatePath("/trichter");
  revalidatePath("/leaderboard");
  revalidatePath("/report");
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
function stepFromPlaybook(
  stage: ContactStage | DealStage,
  kind: "contact" | "deal",
  appointmentAt?: Date | null
): StepInput {
  const entry =
    kind === "contact"
      ? CONTACT_PLAYBOOK[stage as ContactStage]
      : DEAL_PLAYBOOK[stage as DealStage];
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
  params: {
    contactId?: string;
    dealId?: string;
    from: string | null;
    to: string;
    userId: string;
  }
) {
  if (params.from === params.to) return;
  await tx.stageEvent.create({
    data: {
      contactId: params.contactId ?? null,
      dealId: params.dealId ?? null,
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

// Der Kontakt in Beratung fuehrt keinen eigenen Schritt, solange ein Vorgang
// offen ist. Ohne offenen Vorgang darf er aber auch nicht schrittlos liegen.
async function syncBeratungStep(tx: Tx, contactId: string) {
  const contact = await tx.contact.findUnique({
    where: { id: contactId },
    select: {
      stage: true,
      nextStepType: true,
      deals: { where: { outcome: "OFFEN" }, select: { id: true } },
    },
  });
  if (!contact || contact.stage !== "IN_BERATUNG") return;

  if (contact.deals.length > 0) {
    await tx.contact.update({
      where: { id: contactId },
      data: stepData(EMPTY_STEP),
    });
    return;
  }
  // Ohne offenen Vorgang darf der Kontakt nicht schrittlos liegen bleiben –
  // ein selbst gesetzter Schritt bleibt aber unangetastet.
  if (contact.nextStepType) return;
  await tx.contact.update({
    where: { id: contactId },
    data: stepData({
      type: "SONSTIGES",
      at: dayToUtcDate(berlinToday()),
      note: "Vorgang anlegen oder Kontakt abschliessen",
    }),
  });
}

async function loadOwnContact(userId: string, contactId: string) {
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, ownerId: userId },
  });
  if (!contact) throw new Error("Kontakt nicht gefunden.");
  return contact;
}

async function loadOwnDeal(userId: string, dealId: string) {
  const deal = await prisma.deal.findFirst({
    where: { id: dealId, contact: { is: { ownerId: userId } } },
    include: { contact: { select: { id: true, stage: true, outcome: true } } },
  });
  if (!deal) throw new Error("Vorgang nicht gefunden.");
  return deal;
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

  const needsAppointment = stage === "TERMIN_VEREINBART" || stage === "CHECKUP_GEPLANT";
  if (needsAppointment && !appointmentAt) {
    throw new Error("Fuer diese Phase wird ein Termin mit Datum und Uhrzeit gebraucht.");
  }

  const step =
    readNextStep(formData) ?? stepFromPlaybook(stage, "contact", appointmentAt);

  const setsAppointmentPoint =
    stage === "TERMIN_VEREINBART" && !contact.appointmentLoggedAt;
  // Der gehaltene Termin wird einmal je Kontakt gezaehlt, nicht bei jedem
  // Rueckwechsel in die Beratung.
  const heldAppointmentPoint =
    stage === "IN_BERATUNG" && !contact.appointmentHeldLoggedAt;

  await prisma.$transaction(async (tx) => {
    await tx.contact.update({
      where: { id: contactId },
      data: {
        stage,
        // Ein Phasenwechsel holt einen verlorenen Kontakt zurueck; als Kunde
        // gilt er als gewonnen.
        ...(stage === "KUNDE"
          ? { outcome: "GEWONNEN" as const, lostReason: null, lostAt: null }
          : contact.outcome === "VERLOREN"
            ? { outcome: "OFFEN" as const, lostReason: null, lostAt: null }
            : {}),
        ...(appointmentAt && needsAppointment ? { appointmentAt } : {}),
        ...(setsAppointmentPoint ? { appointmentLoggedAt: new Date() } : {}),
        ...(heldAppointmentPoint ? { appointmentHeldLoggedAt: new Date() } : {}),
        ...(stage === "BESTAND"
          ? { checkupDueAt: addMonths(new Date(), CHECKUP_INTERVAL_MONTHS) }
          : {}),
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

    if (stage === "IN_BERATUNG") await syncBeratungStep(tx, contactId);
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
    // Offene Vorgaenge sterben mit dem Kontakt.
    await tx.deal.updateMany({
      where: { contactId, outcome: "OFFEN" },
      data: {
        outcome: "VERLOREN",
        lostReason: reasonRaw,
        closedAt: new Date(),
        nextStepType: null,
        nextStepAt: null,
        nextStepNote: null,
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

  const step = stepFromPlaybook(contact.stage, "contact", contact.appointmentAt);
  await prisma.contact.update({
    where: { id: contactId },
    data: {
      outcome: contact.stage === "KUNDE" ? "GEWONNEN" : "OFFEN",
      lostReason: null,
      lostAt: null,
      ...stepData(step),
    },
  });

  refreshPipelineViews(contactId);
}

// --- Vorgaenge --------------------------------------------------------------

function readDealValue(formData: FormData) {
  const premiumRaw = text(formData, "monthlyPremium");
  const monthlyPremiumCents = premiumRaw ? euroToCents(premiumRaw) : null;
  const unitsRaw = text(formData, "units");
  const manualUnits = unitsRaw ? Number(unitsRaw.replace(",", ".")) : null;
  const unitsManual = manualUnits != null && isFinite(manualUnits);
  return {
    monthlyPremiumCents,
    unitsManual,
    units: unitsManual ? Math.round(manualUnits!) : calcUnits(monthlyPremiumCents),
  };
}

export async function createDeal(formData: FormData) {
  const user = await requireUser();
  const person = await requireUserPerson(user.id);
  const contactId = text(formData, "contactId");
  const lineRaw = text(formData, "line");
  if (!contactId || !lineRaw || !isDealLine(lineRaw)) {
    throw new Error("Bitte eine Sparte waehlen.");
  }
  const contact = await loadOwnContact(user.id, contactId);
  const value = readDealValue(formData);
  const step = stepFromPlaybook("BEDARF", "deal");

  // Ein Vorgang entsteht erst nach dem gehaltenen Termin: der Kontakt rueckt
  // mit auf, inklusive Punkt fuer den gehaltenen Termin.
  const movesToBeratung =
    contact.stage === "NEU" ||
    contact.stage === "KONTAKTIERT" ||
    contact.stage === "TERMIN_VEREINBART";
  const heldAppointmentPoint = movesToBeratung && !contact.appointmentHeldLoggedAt;

  await prisma.$transaction(async (tx) => {
    const deal = await tx.deal.create({
      data: {
        contactId,
        line: lineRaw,
        title: text(formData, "title"),
        stage: "BEDARF",
        ...value,
        ...stepData(step),
      },
    });
    await recordStageEvent(tx, {
      dealId: deal.id,
      contactId,
      from: null,
      to: "BEDARF",
      userId: user.id,
    });

    if (movesToBeratung) {
      await tx.contact.update({
        where: { id: contactId },
        data: {
          stage: "IN_BERATUNG",
          ...(heldAppointmentPoint ? { appointmentHeldLoggedAt: new Date() } : {}),
        },
      });
      await recordStageEvent(tx, {
        contactId,
        from: contact.stage,
        to: "IN_BERATUNG",
        userId: user.id,
      });
      if (heldAppointmentPoint) await award(tx, person.id, "APPOINTMENT_HELD", 1);
    }

    await syncBeratungStep(tx, contactId);
  });

  refreshPipelineViews(contactId);
}

export async function updateDeal(formData: FormData) {
  const user = await requireUser();
  const dealId = text(formData, "dealId");
  const lineRaw = text(formData, "line");
  if (!dealId || !lineRaw || !isDealLine(lineRaw)) {
    throw new Error("Ungueltige Daten fuer den Vorgang.");
  }
  const deal = await loadOwnDeal(user.id, dealId);
  const value = readDealValue(formData);

  await prisma.deal.update({
    where: { id: dealId },
    data: { line: lineRaw, title: text(formData, "title"), ...value },
  });

  refreshPipelineViews(deal.contactId);
}

export async function setDealStage(formData: FormData) {
  const user = await requireUser();
  const person = await requireUserPerson(user.id);
  const dealId = text(formData, "dealId");
  const stageRaw = text(formData, "stage");
  if (!dealId || !stageRaw || !isDealStage(stageRaw)) {
    throw new Error("Ungueltige Daten fuer den Vorgang.");
  }
  const stage: DealStage = stageRaw;
  const deal = await loadOwnDeal(user.id, dealId);

  const step = readNextStep(formData) ?? stepFromPlaybook(stage, "deal");
  const isWin = stage === "GEWONNEN";
  const awardsPoints = isWin && !deal.wonLoggedAt;

  await prisma.$transaction(async (tx) => {
    await tx.deal.update({
      where: { id: dealId },
      data: {
        stage,
        ...(isWin
          ? {
              outcome: "GEWONNEN" as const,
              closedAt: new Date(),
              lostReason: null,
              ...(awardsPoints ? { wonLoggedAt: new Date() } : {}),
            }
          : { outcome: "OFFEN" as const, closedAt: null, lostReason: null }),
        ...stepData(isWin ? EMPTY_STEP : step),
      },
    });
    await recordStageEvent(tx, {
      dealId,
      contactId: deal.contactId,
      from: deal.stage,
      to: stage,
      userId: user.id,
    });

    // Zaehler bleibt 1 = ein Abschluss; die Gewichtung mit 5 Punkten macht
    // die Rangliste ueber quotaTypePoints.
    if (awardsPoints) await award(tx, person.id, "DEAL_WON", 1);

    if (isWin) {
      // Abschluss macht den Kontakt zum Kunden und stoesst die
      // Empfehlungsfrage an - aber nur, wenn er noch nicht weiter ist.
      const contact = await tx.contact.findUniqueOrThrow({
        where: { id: deal.contactId },
        select: { stage: true },
      });
      const beforeCustomer =
        contact.stage === "NEU" ||
        contact.stage === "KONTAKTIERT" ||
        contact.stage === "TERMIN_VEREINBART" ||
        contact.stage === "IN_BERATUNG";
      if (beforeCustomer) {
        await tx.contact.update({
          where: { id: deal.contactId },
          data: {
            stage: "KUNDE",
            outcome: "GEWONNEN",
            ...stepData(stepFromPlaybook("KUNDE", "contact")),
          },
        });
        await recordStageEvent(tx, {
          contactId: deal.contactId,
          from: contact.stage,
          to: "KUNDE",
          userId: user.id,
        });
      }
    }

    await syncBeratungStep(tx, deal.contactId);
  });

  refreshPipelineViews(deal.contactId);
}

export async function completeDealStep(formData: FormData) {
  const user = await requireUser();
  const dealId = text(formData, "dealId");
  if (!dealId) throw new Error("Vorgang-ID fehlt.");
  const deal = await loadOwnDeal(user.id, dealId);
  const note = text(formData, "text") ?? "Schritt erledigt";
  const step = readNextStep(formData) ?? EMPTY_STEP;

  await prisma.$transaction(async (tx) => {
    await tx.activity.create({
      data: { contactId: deal.contactId, type: "EMAIL", text: note },
    });
    await tx.deal.update({ where: { id: dealId }, data: stepData(step) });
  });

  refreshPipelineViews(deal.contactId);
}

export async function snoozeDealStep(formData: FormData) {
  const user = await requireUser();
  const dealId = text(formData, "dealId");
  const days = Number(text(formData, "days") ?? "0");
  if (!dealId || !isFinite(days)) throw new Error("Ungueltige Daten.");
  const deal = await loadOwnDeal(user.id, dealId);

  await prisma.deal.update({
    where: { id: dealId },
    data: {
      nextStepAt: addDays(dayToUtcDate(berlinToday()), days),
      nextStepType: deal.nextStepType ?? "NACHFASSEN",
    },
  });

  refreshPipelineViews(deal.contactId);
}

export async function markDealLost(formData: FormData) {
  const user = await requireUser();
  const dealId = text(formData, "dealId");
  const reasonRaw = text(formData, "lostReason");
  if (!dealId || !reasonRaw || !isLostReason(reasonRaw)) {
    throw new Error("Bitte einen Verlustgrund angeben.");
  }
  const deal = await loadOwnDeal(user.id, dealId);

  await prisma.$transaction(async (tx) => {
    await tx.deal.update({
      where: { id: dealId },
      data: {
        outcome: "VERLOREN",
        lostReason: reasonRaw,
        closedAt: new Date(),
        ...stepData(EMPTY_STEP),
      },
    });
    await recordStageEvent(tx, {
      dealId,
      contactId: deal.contactId,
      from: deal.stage,
      to: `VERLOREN:${reasonRaw}`,
      userId: user.id,
    });
    await syncBeratungStep(tx, deal.contactId);
  });

  refreshPipelineViews(deal.contactId);
}

// --- Empfehlungen -----------------------------------------------------------

export async function addReferrals(formData: FormData) {
  const user = await requireUser();
  const person = await requireUserPerson(user.id);
  const contactId = text(formData, "contactId");
  if (!contactId) throw new Error("Kontakt-ID fehlt.");
  const contact = await loadOwnContact(user.id, contactId);

  const names = formData.getAll("referralName").map((v) => String(v).trim());
  const phones = formData.getAll("referralPhone").map((v) => String(v).trim());
  const entries = names
    .map((name, index) => ({ name, phone: phones[index] ?? "" }))
    .filter((entry) => entry.name.length > 0);

  const today = dayToUtcDate(berlinToday());
  const step = stepFromPlaybook("EMPFEHLUNG_ERFRAGT", "contact");

  await prisma.$transaction(async (tx) => {
    for (const entry of entries) {
      const created = await tx.contact.create({
        data: {
          name: entry.name,
          phone: entry.phone || null,
          source: `Empfehlung von ${contact.name}`,
          ownerId: user.id,
          referredById: contactId,
          stage: "NEU",
          nextStepType: "ANRUF",
          nextStepAt: today,
          nextStepNote: "Erstanruf (Empfehlung)",
        },
      });
      await tx.stageEvent.create({
        data: { contactId: created.id, toStage: "NEU", userId: user.id },
      });
      await tx.dailyLog.create({
        data: { personId: person.id, type: "NUMBERS_PULLED", count: 1, date: today },
      });
    }

    // Auch ohne erhaltene Namen gilt die Frage als erledigt.
    await tx.contact.update({
      where: { id: contactId },
      data: { stage: "EMPFEHLUNG_ERFRAGT", ...stepData(step) },
    });
    await recordStageEvent(tx, {
      contactId,
      from: contact.stage,
      to: "EMPFEHLUNG_ERFRAGT",
      userId: user.id,
    });
  });

  refreshPipelineViews(contactId);
}

// --- Checkup ----------------------------------------------------------------

export async function scheduleCheckup(formData: FormData) {
  const user = await requireUser();
  const contactId = text(formData, "contactId");
  const appointmentLocal = text(formData, "appointmentAt");
  if (!contactId || !appointmentLocal) {
    throw new Error("Bitte Datum und Uhrzeit des Checkups angeben.");
  }
  const appointmentAt = berlinLocalToUtc(appointmentLocal);
  if (!appointmentAt) throw new Error("Termin konnte nicht gelesen werden.");
  const contact = await loadOwnContact(user.id, contactId);

  await prisma.$transaction(async (tx) => {
    await tx.contact.update({
      where: { id: contactId },
      data: {
        stage: "CHECKUP_GEPLANT",
        appointmentAt,
        ...stepData({
          type: "TERMIN",
          at: appointmentAt,
          note: "Checkup durchfuehren",
        }),
      },
    });
    await recordStageEvent(tx, {
      contactId,
      from: contact.stage,
      to: "CHECKUP_GEPLANT",
      userId: user.id,
    });
  });

  refreshPipelineViews(contactId);
}
