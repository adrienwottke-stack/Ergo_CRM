import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { ContactStatus } from "@/lib/generated/prisma/enums";
import { allContactStatuses, contactStatusLabels } from "@/lib/labels";
import { berlinToday, dayToUtcDate, mondayOf, shiftDay } from "@/lib/dates";
import { weeklyTotals } from "@/lib/stats";
import StatusBadge from "@/components/StatusBadge";
import SparkBars from "@/components/SparkBars";
import {
  BellIcon,
  ChevronRightIcon,
  ClockIcon,
  UsersIcon,
} from "@/components/icons";
import { card, kicker, pageTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

const WEEKS_SHOWN = 8;
const STALE_DAYS = 14;

const dateFormat = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
});

export default async function DashboardPage() {
  const today = berlinToday();
  const thisMonday = mondayOf(today);
  const oldestMonday = shiftDay(thisMonday, -7 * (WEEKS_SHOWN - 1));
  const staleBefore = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000);

  const [grouped, recentActivities, dueFollowUps, staleContacts] =
    await Promise.all([
      prisma.contact.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.activity.findMany({
        where: { date: { gte: dayToUtcDate(oldestMonday) } },
        select: { date: true },
      }),
      prisma.contact.findMany({
        where: {
          nextFollowUp: { lte: dayToUtcDate(today) },
          status: { notIn: ["CLOSED", "REJECTED"] },
        },
        orderBy: { nextFollowUp: "asc" },
        take: 5,
        select: { id: true, name: true, nextFollowUp: true, status: true },
      }),
      prisma.contact.findMany({
        where: {
          updatedAt: { lt: staleBefore },
          status: { in: ["NEW", "CONTACTED", "APPOINTMENT"] },
        },
        orderBy: { updatedAt: "asc" },
        take: 5,
        select: { id: true, name: true, updatedAt: true, status: true },
      }),
    ]);

  const countsByStatus = new Map<ContactStatus, number>(
    grouped.map((entry) => [entry.status, entry._count._all])
  );
  const totalCount = grouped.reduce(
    (sum, entry) => sum + entry._count._all,
    0
  );

  const weekly = weeklyTotals(
    recentActivities.map((a) => a.date),
    thisMonday,
    WEEKS_SHOWN
  );
  const thisWeek = weekly[WEEKS_SHOWN - 1]!;
  const lastWeek = weekly[WEEKS_SHOWN - 2]!;
  const delta = thisWeek - lastWeek;

  const hasTodos = dueFollowUps.length > 0 || staleContacts.length > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className={pageTitle}>Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Dein Netzwerk auf einen Blick.
        </p>
      </div>

      <section className={`${card} p-6 sm:p-7`}>
        <div className="flex items-center gap-2">
          <BellIcon className="h-4.5 w-4.5 text-navy-600" />
          <h2 className="text-sm font-semibold text-slate-900">Heute dran</h2>
        </div>
        {hasTodos ? (
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <p className={kicker}>Fällige Wiedervorlagen</p>
              {dueFollowUps.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">Keine – sauber.</p>
              ) : (
                <ul className="mt-2 divide-y divide-slate-100">
                  {dueFollowUps.map((contact) => (
                    <li key={contact.id}>
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="group flex items-center justify-between gap-3 py-2"
                      >
                        <span className="text-sm font-medium text-slate-900 group-hover:text-navy-700">
                          {contact.name}
                        </span>
                        <span className="flex items-center gap-2 text-xs text-amber-700">
                          fällig {dateFormat.format(contact.nextFollowUp!)}
                          <ChevronRightIcon className="h-3.5 w-3.5 text-slate-400" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className={kicker}>
                Länger als {STALE_DAYS} Tage unberührt
              </p>
              {staleContacts.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">Keine – stark.</p>
              ) : (
                <ul className="mt-2 divide-y divide-slate-100">
                  {staleContacts.map((contact) => (
                    <li key={contact.id}>
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="group flex items-center justify-between gap-3 py-2"
                      >
                        <span className="text-sm font-medium text-slate-900 group-hover:text-navy-700">
                          {contact.name}
                        </span>
                        <span className="flex items-center gap-2 text-xs text-slate-500">
                          <ClockIcon className="h-3.5 w-3.5" />
                          zuletzt {dateFormat.format(contact.updatedAt)}
                          <ChevronRightIcon className="h-3.5 w-3.5 text-slate-400" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">
            Keine fälligen Wiedervorlagen, nichts liegt lange still – alles im
            Griff. Wiedervorlagen setzt du beim Bearbeiten eines Kontakts.
          </p>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Link
          href="/contacts"
          className={`${card} group relative flex flex-col justify-between overflow-hidden p-6 transition hover:border-navy-300 lg:row-span-2`}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-navy-50"
          />
          <div className="relative flex items-center gap-2 text-slate-600">
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
          <Link
            href="/report"
            className={`${card} group p-5 transition hover:border-navy-300 sm:col-span-2`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[13px] font-medium text-slate-600">
                  Aktivitäten diese Woche
                </p>
                <div className="mt-3 flex items-baseline gap-3">
                  <p className="text-3xl font-semibold tracking-tight text-slate-900">
                    {thisWeek}
                  </p>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                      delta >= 0
                        ? "bg-emerald-50 text-emerald-800 ring-emerald-600/15"
                        : "bg-red-50 text-red-700 ring-red-600/15"
                    }`}
                  >
                    {delta >= 0 ? `+${delta}` : delta} vs. Vorwoche
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Letzte {WEEKS_SHOWN} Wochen · Details im Bericht
                </p>
              </div>
              <SparkBars values={weekly} className="mt-1 h-12 w-24 shrink-0" />
            </div>
          </Link>

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
                <p className="mt-1 text-xs text-slate-500">
                  {share} % · {contactStatusLabels[status]}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
