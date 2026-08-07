import type { ContactStatus } from "@/lib/generated/prisma/enums";
import { contactStatusBadgeClasses, contactStatusLabels } from "@/lib/labels";

export default function StatusBadge({ status }: { status: ContactStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${contactStatusBadgeClasses[status]}`}
    >
      {contactStatusLabels[status]}
    </span>
  );
}
