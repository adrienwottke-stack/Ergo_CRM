import { ActivityType, QuotaType } from "@/lib/generated/prisma/enums";

export const activityTypeLabels: Record<ActivityType, string> = {
  CALL: "Anruf",
  MEETING: "Termin",
  EMAIL: "E-Mail",
};

export const allActivityTypes = Object.values(ActivityType) as ActivityType[];

export function isActivityType(value: string): value is ActivityType {
  return (allActivityTypes as string[]).includes(value);
}

export const quotaTypeLabels: Record<QuotaType, string> = {
  CALL: "Anrufe",
  NUMBERS_PULLED: "Nummern gezogen",
  APPOINTMENT_SET: "Termine vereinbart",
  APPOINTMENT_HELD: "Termine gehalten",
  DEAL_WON: "Abschlüsse",
};

// Gewichtung im Wettbewerb: ein Abschluss zaehlt fuenffach.
export const quotaTypePoints: Record<QuotaType, number> = {
  CALL: 1,
  NUMBERS_PULLED: 1,
  APPOINTMENT_SET: 1,
  APPOINTMENT_HELD: 1,
  DEAL_WON: 5,
};

export const allQuotaTypes = Object.values(QuotaType) as QuotaType[];

// Gehaltene Termine und Abschluesse entstehen ausschliesslich aus der
// Pipeline – sonst waeren sie doppelt zaehlbar.
export const manualQuotaTypes: QuotaType[] = [
  "CALL",
  "NUMBERS_PULLED",
  "APPOINTMENT_SET",
];

export function isQuotaType(value: string): value is QuotaType {
  return (allQuotaTypes as string[]).includes(value);
}

export const emptyQuotaCounts = (): Record<QuotaType, number> => ({
  CALL: 0,
  NUMBERS_PULLED: 0,
  APPOINTMENT_SET: 0,
  APPOINTMENT_HELD: 0,
  DEAL_WON: 0,
});
