import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { ContactStatus } from "@/lib/generated/prisma/enums";
import { allContactStatuses, contactStatusLabels } from "@/lib/labels";
import StatusBadge from "@/components/StatusBadge";
import { ChevronRightIcon, UsersIcon } from "@/components/icons";
import { card, pageTitle } from "@/components/ui";

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
    <div className="space-y-8">
      <div>
        <h1 className={pageTitle}>Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Dein Netzwerk auf einen Blick.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Link
          href="/contacts"
          className={`${card} group relative flex flex-col justify-between overflow-hidden p-6 transition hover:border-navy-300 lg:row-span-2`}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-navy-50"
          />
          <div className="relative flex items-center gap-2 text-slate-500">
            <UsersIcon className="h-5 w-5 text-navy-600" />
            <span className="text-[13px] font-medium">Kontakte gesamt</span>
          </div>
          <div className="relative mt-6">
            <p className="text-6xl font-semibold tracking-tight text-slate-900">
              {totalCount}
            </p>
            <p className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-navy-600 transition group-hover:gap-2">
              Alle Kontakte ansehen
              <ChevronRightIcon className="h-4 w-4" />
            </p>
          </div>
        </Link>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-3">
          {allContactStatuses.map((status) => {
            const count = countsByStatus.get(status) ?? 0;
            const share =
              totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
            return (
              <Link
                key={status}
                href={`/contacts?status=${status}`}
                className={`${card} group p-5 transition hover:border-navy-300`}
              >
                <StatusBadge status={status} />
                <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
                  {count}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {share} % · {contactStatusLabels[status]}
                </p>
              </Link>
            );
          })}
          <Link
            href="/leaderboard"
            className={`${card} group flex flex-col justify-between bg-navy-800 p-5 transition hover:bg-navy-900`}
          >
            <p className="text-[13px] font-medium text-slate-300">
              Team-Wettbewerb
            </p>
            <p className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-white transition group-hover:gap-2">
              Zur Rangliste
              <ChevronRightIcon className="h-4 w-4 text-gold-400" />
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
