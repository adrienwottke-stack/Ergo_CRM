import { ActivityType, ContactStatus } from "@/lib/generated/prisma/enums";

export const contactStatusLabels: Record<ContactStatus, string> = {
  NEW: "Neu",
  CONTACTED: "Kontaktiert",
  APPOINTMENT: "Termin",
  CLOSED: "Abgeschlossen",
  REJECTED: "Abgelehnt",
};

export const contactStatusBadgeClasses: Record<ContactStatus, string> = {
  NEW: "bg-blue-100 text-blue-800",
  CONTACTED: "bg-amber-100 text-amber-800",
  APPOINTMENT: "bg-violet-100 text-violet-800",
  CLOSED: "bg-green-100 text-green-800",
  REJECTED: "bg-stone-200 text-stone-600",
};

export const activityTypeLabels: Record<ActivityType, string> = {
  CALL: "Anruf",
  MEETING: "Meeting",
  EMAIL: "E-Mail",
};

export const allContactStatuses = Object.values(
  ContactStatus
) as ContactStatus[];

export const allActivityTypes = Object.values(ActivityType) as ActivityType[];

export function isContactStatus(value: string): value is ContactStatus {
  return (allContactStatuses as string[]).includes(value);
}

export function isActivityType(value: string): value is ActivityType {
  return (allActivityTypes as string[]).includes(value);
}
