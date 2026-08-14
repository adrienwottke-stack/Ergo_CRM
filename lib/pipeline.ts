// Fachlogik der Pipeline: Phasen, Playbook (welcher Schritt folgt auf welche
// Phase) und die Umrechnung von Beitrag in interne Einheiten.
// Diese Datei ist die einzige Quelle fuer Reihenfolge, Beschriftung und Farbe.

import {
  ContactStage,
  DealLine,
  DealStage,
  LostReason,
  NextStepType,
  Outcome,
} from "@/lib/generated/prisma/enums";
import { addDays, addMonths } from "@/lib/dates";

// --- Phasen -----------------------------------------------------------------

export const CONTACT_STAGES: ContactStage[] = [
  "NEU",
  "KONTAKTIERT",
  "TERMIN_VEREINBART",
  "IN_BERATUNG",
  "KUNDE",
  "EMPFEHLUNG_ERFRAGT",
  "CHECKUP_GEPLANT",
  "BESTAND",
];

// Akquise = Weg zum ersten Abschluss, Betreuung = alles danach.
export const ACQUISITION_STAGES: ContactStage[] = CONTACT_STAGES.slice(0, 4);
export const CARE_STAGES: ContactStage[] = CONTACT_STAGES.slice(4);

export const contactStageLabels: Record<ContactStage, string> = {
  NEU: "Neu",
  KONTAKTIERT: "Kontaktiert",
  TERMIN_VEREINBART: "Termin vereinbart",
  IN_BERATUNG: "In Beratung",
  KUNDE: "Kunde",
  EMPFEHLUNG_ERFRAGT: "Empfehlung erfragt",
  CHECKUP_GEPLANT: "Checkup geplant",
  BESTAND: "Bestand",
};

export const contactStageHints: Record<ContactStage, string> = {
  NEU: "Nummer gezogen, noch kein Kontakt",
  KONTAKTIERT: "Erreicht, noch kein Termin",
  TERMIN_VEREINBART: "Termindatum steht",
  IN_BERATUNG: "Termin gehalten, Vorgaenge laufen",
  KUNDE: "Mindestens ein Abschluss",
  EMPFEHLUNG_ERFRAGT: "Empfehlungsfrage erledigt",
  CHECKUP_GEPLANT: "Checkup-Termin steht",
  BESTAND: "Betreut, ruhend bis zum naechsten Checkup",
};

export type StagePalette = {
  pill: string;
  dot: string;
  bg: string;
  border: string;
  headerBg: string;
  text: string;
  bar: string;
};

export const contactStagePalette: Record<ContactStage, StagePalette> = {
  NEU: {
    pill: "bg-blue-50 text-blue-800 ring-blue-600/15",
    dot: "bg-blue-500",
    bg: "bg-blue-50/50",
    border: "border-blue-200",
    headerBg: "bg-blue-100",
    text: "text-blue-700",
    bar: "bg-blue-500",
  },
  KONTAKTIERT: {
    pill: "bg-amber-50 text-amber-800 ring-amber-600/20",
    dot: "bg-amber-500",
    bg: "bg-amber-50/50",
    border: "border-amber-200",
    headerBg: "bg-amber-100",
    text: "text-amber-700",
    bar: "bg-amber-500",
  },
  TERMIN_VEREINBART: {
    pill: "bg-violet-50 text-violet-800 ring-violet-600/15",
    dot: "bg-violet-500",
    bg: "bg-violet-50/50",
    border: "border-violet-200",
    headerBg: "bg-violet-100",
    text: "text-violet-700",
    bar: "bg-violet-500",
  },
  IN_BERATUNG: {
    pill: "bg-indigo-50 text-indigo-800 ring-indigo-600/15",
    dot: "bg-indigo-500",
    bg: "bg-indigo-50/50",
    border: "border-indigo-200",
    headerBg: "bg-indigo-100",
    text: "text-indigo-700",
    bar: "bg-indigo-500",
  },
  KUNDE: {
    pill: "bg-emerald-50 text-emerald-800 ring-emerald-600/15",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50/50",
    border: "border-emerald-200",
    headerBg: "bg-emerald-100",
    text: "text-emerald-700",
    bar: "bg-emerald-500",
  },
  EMPFEHLUNG_ERFRAGT: {
    pill: "bg-teal-50 text-teal-800 ring-teal-600/15",
    dot: "bg-teal-500",
    bg: "bg-teal-50/50",
    border: "border-teal-200",
    headerBg: "bg-teal-100",
    text: "text-teal-700",
    bar: "bg-teal-500",
  },
  CHECKUP_GEPLANT: {
    pill: "bg-cyan-50 text-cyan-800 ring-cyan-600/15",
    dot: "bg-cyan-500",
    bg: "bg-cyan-50/50",
    border: "border-cyan-200",
    headerBg: "bg-cyan-100",
    text: "text-cyan-700",
    bar: "bg-cyan-500",
  },
  BESTAND: {
    pill: "bg-slate-100 text-slate-700 ring-slate-500/15",
    dot: "bg-slate-400",
    bg: "bg-slate-50",
    border: "border-slate-200",
    headerBg: "bg-slate-200",
    text: "text-slate-600",
    bar: "bg-slate-400",
  },
};

export const DEAL_STAGES: DealStage[] = ["BEDARF", "ANGEBOT", "ANTRAG", "GEWONNEN"];

export const dealStageLabels: Record<DealStage, string> = {
  BEDARF: "Bedarf erkannt",
  ANGEBOT: "Angebot raus",
  ANTRAG: "Antrag gestellt",
  GEWONNEN: "Abgeschlossen",
};

export const dealStagePalette: Record<DealStage, StagePalette> = {
  BEDARF: contactStagePalette.NEU,
  ANGEBOT: contactStagePalette.KONTAKTIERT,
  ANTRAG: contactStagePalette.TERMIN_VEREINBART,
  GEWONNEN: contactStagePalette.KUNDE,
};

export const dealLineLabels: Record<DealLine, string> = {
  PAV: "Private Altersvorsorge",
  BU: "BU / Grundfaehigkeit",
  UNBEKANNT: "Unbekannt (Altbestand)",
};

export const dealLineShortLabels: Record<DealLine, string> = {
  PAV: "PAV",
  BU: "BU",
  UNBEKANNT: "?",
};

// Nur diese Sparten sind neu anlegbar; UNBEKANNT stammt aus der Migration.
export const SELECTABLE_DEAL_LINES: DealLine[] = ["PAV", "BU"];

export const outcomeLabels: Record<Outcome, string> = {
  OFFEN: "Offen",
  GEWONNEN: "Gewonnen",
  VERLOREN: "Verloren",
};

export const lostReasonLabels: Record<LostReason, string> = {
  KEIN_BEDARF: "Kein Bedarf",
  KEIN_INTERESSE: "Kein Interesse",
  UNERREICHBAR: "Nicht erreichbar",
  KONKURRENZ: "Zur Konkurrenz",
  PREIS: "Preis",
  TERMIN_GEPLATZT: "Termin geplatzt",
  SPAETER_NOCHMAL: "Spaeter nochmal",
  SONSTIGES: "Sonstiges",
};

export const ALL_LOST_REASONS: LostReason[] = [
  "KEIN_BEDARF",
  "KEIN_INTERESSE",
  "UNERREICHBAR",
  "KONKURRENZ",
  "PREIS",
  "TERMIN_GEPLATZT",
  "SPAETER_NOCHMAL",
  "SONSTIGES",
];

export const nextStepLabels: Record<NextStepType, string> = {
  ANRUF: "Anrufen",
  TERMIN: "Termin durchfuehren",
  TERMIN_VORBEREITEN: "Termin vorbereiten",
  ANGEBOT_ERSTELLEN: "Angebot erstellen",
  NACHFASSEN: "Nachfassen",
  ANTRAG_EINREICHEN: "Antrag einreichen / Police pruefen",
  EMPFEHLUNG_ERFRAGEN: "Empfehlungen erfragen",
  CHECKUP_TERMINIEREN: "Checkup terminieren",
  SONSTIGES: "Sonstiges",
};

export const ALL_NEXT_STEP_TYPES: NextStepType[] = [
  "ANRUF",
  "TERMIN",
  "TERMIN_VORBEREITEN",
  "ANGEBOT_ERSTELLEN",
  "NACHFASSEN",
  "ANTRAG_EINREICHEN",
  "EMPFEHLUNG_ERFRAGEN",
  "CHECKUP_TERMINIEREN",
  "SONSTIGES",
];

// --- Playbook ---------------------------------------------------------------
// Beim Phasenwechsel vorbelegter naechster Schritt. `useAppointment` heisst:
// Faelligkeit ist der Termin selbst, nicht heute + X Tage.

export type PlaybookEntry = {
  type: NextStepType;
  days?: number;
  months?: number;
  useAppointment?: boolean;
  note: string;
};

export const CONTACT_PLAYBOOK: Record<ContactStage, PlaybookEntry | null> = {
  NEU: { type: "ANRUF", days: 0, note: "Erstanruf" },
  KONTAKTIERT: { type: "ANRUF", days: 3, note: "Wiedervorlage-Anruf" },
  TERMIN_VEREINBART: {
    type: "TERMIN",
    useAppointment: true,
    days: 0,
    note: "Termin durchfuehren",
  },
  // In Beratung fuehrt der Vorgang den Schritt, nicht der Kontakt.
  IN_BERATUNG: null,
  KUNDE: { type: "EMPFEHLUNG_ERFRAGEN", days: 3, note: "Empfehlungen erfragen" },
  EMPFEHLUNG_ERFRAGT: {
    type: "CHECKUP_TERMINIEREN",
    days: 7,
    note: "Checkup terminieren",
  },
  CHECKUP_GEPLANT: {
    type: "TERMIN",
    useAppointment: true,
    days: 0,
    note: "Checkup durchfuehren",
  },
  BESTAND: {
    type: "CHECKUP_TERMINIEREN",
    months: 6,
    note: "Naechster Checkup",
  },
};

export const DEAL_PLAYBOOK: Record<DealStage, PlaybookEntry | null> = {
  BEDARF: { type: "ANGEBOT_ERSTELLEN", days: 2, note: "Angebot erstellen" },
  ANGEBOT: { type: "NACHFASSEN", days: 3, note: "Nachfassen, Entscheidung holen" },
  ANTRAG: { type: "ANTRAG_EINREICHEN", days: 14, note: "Policierung pruefen" },
  // Ab hier uebernimmt der Kontakt (Empfehlung, Checkup).
  GEWONNEN: null,
};

export const CHECKUP_INTERVAL_MONTHS = 6;

// Faelligkeit aus einem Playbook-Eintrag.
export function playbookDueDate(
  entry: PlaybookEntry,
  from: Date,
  appointmentAt?: Date | null
): Date {
  if (entry.useAppointment && appointmentAt) return appointmentAt;
  if (entry.months) return addMonths(from, entry.months);
  return addDays(from, entry.days ?? 0);
}

// --- Einheiten --------------------------------------------------------------
// Vertriebswaehrung: 100 EUR Monatsbeitrag = 82 Einheiten.
// unitFactorPermille (1000 = 1,0) haelt spaetere Laufzeitfaktoren offen.

export const UNITS_PER_EURO = 0.82;
export const POINTS_DEAL_WON = 5;

export function calcUnits(
  monthlyPremiumCents: number | null | undefined,
  unitFactorPermille = 1000
): number | null {
  if (monthlyPremiumCents == null) return null;
  const euro = monthlyPremiumCents / 100;
  return Math.round((euro * UNITS_PER_EURO * unitFactorPermille) / 1000);
}

// "84,50" oder "84.50" -> 8450
export function euroToCents(value: string): number | null {
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100);
}

const euroFormat = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

export function formatEuro(cents: number | null | undefined): string {
  if (cents == null) return "–";
  return euroFormat.format(cents / 100);
}

// --- Hilfen -----------------------------------------------------------------

export function contactStageIndex(stage: ContactStage): number {
  return CONTACT_STAGES.indexOf(stage);
}

export function isAtOrAfter(stage: ContactStage, reference: ContactStage): boolean {
  return contactStageIndex(stage) >= contactStageIndex(reference);
}

export const ALL_CONTACT_STAGES = Object.values(ContactStage) as ContactStage[];
export const ALL_DEAL_STAGES = Object.values(DealStage) as DealStage[];
export const ALL_DEAL_LINES = Object.values(DealLine) as DealLine[];

export function isContactStage(value: string): value is ContactStage {
  return (ALL_CONTACT_STAGES as string[]).includes(value);
}

export function isDealStage(value: string): value is DealStage {
  return (ALL_DEAL_STAGES as string[]).includes(value);
}

export function isDealLine(value: string): value is DealLine {
  return (ALL_DEAL_LINES as string[]).includes(value);
}

export function isNextStepType(value: string): value is NextStepType {
  return (ALL_NEXT_STEP_TYPES as string[]).includes(value);
}

export function isLostReason(value: string): value is LostReason {
  return (ALL_LOST_REASONS as string[]).includes(value);
}
