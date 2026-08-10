import type { ContactStatus } from "@/lib/generated/prisma/enums";
import { contactStatusLabels } from "@/lib/labels";

const badgeStyles: Record<ContactStatus, { pill: string; dot: string }> = {
  NEW: {
    pill: "bg-blue-50 text-blue-800 ring-blue-600/15",
    dot: "bg-blue-500",
  },
  CONTACTED: {
    pill: "bg-amber-50 text-amber-800 ring-amber-600/20",
    dot: "bg-amber-500",
  },
  APPOINTMENT: {
    pill: "bg-violet-50 text-violet-800 ring-violet-600/15",
    dot: "bg-violet-500",
  },
  CLOSED: {
    pill: "bg-emerald-50 text-emerald-800 ring-emerald-600/15",
    dot: "bg-emerald-500",
  },
  REJECTED: {
    pill: "bg-slate-100 text-slate-600 ring-slate-500/15",
    dot: "bg-slate-400",
  },
};

export default function StatusBadge({ status }: { status: ContactStatus }) {
  const style = badgeStyles[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${style.pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {contactStatusLabels[status]}
    </span>
  );
}
