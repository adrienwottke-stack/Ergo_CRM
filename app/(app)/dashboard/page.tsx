import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { ContactStatus } from "@/lib/generated/prisma/enums";
import {
  allContactStatuses,
  contactStatusBadgeClasses,
  contactStatusLabels,
} from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const grouped = await prisma.contact.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const countsByStatus = new Map<ContactStatus, number>(
    grouped.map((entry) => [entry.status, entry._count._all])
  );
  const totalCount = grouped.reduce(
    (sum, entry) => sum + entry._count._all,
    0
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Link
          href="/contacts"
          className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-stone-400"
        >
          <p className="text-sm text-stone-500">Kontakte gesamt</p>
          <p className="mt-2 text-3xl font-semibold">{totalCount}</p>
        </Link>

        {allContactStatuses.map((status) => (
          <Link
            key={status}
            href={`/contacts?status=${status}`}
            className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-stone-400"
          >
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${contactStatusBadgeClasses[status]}`}
            >
              {contactStatusLabels[status]}
            </span>
            <p className="mt-2 text-3xl font-semibold">
              {countsByStatus.get(status) ?? 0}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
