import type { NextStepType } from "@/lib/generated/prisma/enums";
import type { DueState } from "@/lib/dates";
import { nextStepLabels } from "@/lib/pipeline";

// Datum und Uhrzeit immer in Berliner Zeit, unabhaengig von der Server-Zone.
const dayFormat = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Europe/Berlin",
});
const timeFormat = new Intl.DateTimeFormat("de-DE", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Berlin",
});

const dueStyles: Record<DueState, string> = {
  overdue: "bg-red-50 text-red-700 ring-red-600/20",
  today: "bg-amber-50 text-amber-800 ring-amber-600/20",
  week: "bg-slate-100 text-slate-700 ring-slate-500/15",
  later: "bg-slate-50 text-slate-500 ring-slate-400/15",
};

export function formatDue(at: string | Date, withTime: boolean): string {
  const date = typeof at === "string" ? new Date(at) : at;
  return withTime
    ? `${dayFormat.format(date)}, ${timeFormat.format(date)} Uhr`
    : dayFormat.format(date);
}

export default function NextStepBadge({
  type,
  at,
  state,
  withTime = false,
}: {
  type: NextStepType;
  at: string | Date;
  state: DueState;
  withTime?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${dueStyles[state]}`}
    >
      {nextStepLabels[type]}
      <span className="opacity-70">·</span>
      {state === "overdue" ? "überfällig " : ""}
      {formatDue(at, withTime)}
    </span>
  );
}
