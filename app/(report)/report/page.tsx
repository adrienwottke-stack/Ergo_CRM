import { prisma } from "@/lib/prisma";
import type {
  ActivityType,
  ContactStatus,
} from "@/lib/generated/prisma/enums";
import {
  activityTypeLabels,
  allActivityTypes,
  allContactStatuses,
} from "@/lib/labels";
import {
  berlinDayOf,
  berlinToday,
  dayToUtcDate,
  mondayOf,
  shiftDay,
} from "@/lib/dates";
import StatusBadge from "@/components/StatusBadge";
import { LockIcon } from "@/components/icons";
import { card, pageTitle, sectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

const WEEKS_SHOWN = 8;

const shortDate = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
});

const statusBarColors: Record<ContactStatus, string> = {
  NEW: "bg-blue-500",
  CONTACTED: "bg-amber-500",
  APPOINTMENT: "bg-violet-500",
  CLOSED: "bg-emerald-500",
  REJECTED: "bg-slate-400",
};

function weekLabel(monday: string): string {
  return `${shortDate.format(dayToUtcDate(monday))} – ${shortDate.format(
    dayToUtcDate(shiftDay(monday, 6))
  )}`;
}

export default async function ReportPage() {
  const today = berlinToday();
  const thisMonday = mondayOf(today);
  const monthStartDay = `${today.slice(0, 7)}-01`;
  const oldestMonday = shiftDay(thisMonday, -7 * (WEEKS_SHOWN - 1));

  const [
    statusGroups,
    totalContacts,
    newContactsMonth,
    sourceGroups,
    totalActivities,
    recentActivities,
  ] = await Promise.all([
    prisma.contact.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.contact.count(),
    prisma.contact.count({
      where: { createdAt: { gte: dayToUtcDate(monthStartDay) } },
    }),
    prisma.contact.groupBy({ by: ["source"], _count: { _all: true } }),
    prisma.activity.count(),
    prisma.activity.findMany({
      where: { date: { gte: dayToUtcDate(oldestMonday) } },
      select: { type: true, date: true },
    }),
  ]);

  // Wochen-Buckets (Berliner Kalendertage), neueste Woche zuerst
  const weeks: string[] = Array.from({ length: WEEKS_SHOWN }, (_, i) =>
    shiftDay(thisMonday, -7 * i)
  );
  const emptyTypeCounts = (): Record<ActivityType, number> => ({
    CALL: 0,
    MEETING: 0,
    EMAIL: 0,
  });
  const byWeek = new Map<
    string,
    { byType: Record<ActivityType, number>; total: number }
  >(weeks.map((monday) => [monday, { byType: emptyTypeCounts(), total: 0 }]));

  let activitiesThisWeek = 0;
  let activitiesThisMonth = 0;
  for (const activity of recentActivities) {
    const day = berlinDayOf(activity.date);
    if (day >= monthStartDay) activitiesThisMonth += 1;
    const monday = mondayOf(day);
    if (monday === thisMonday) activitiesThisWeek += 1;
    const bucket = byWeek.get(monday);
    if (bucket) {
      bucket.byType[activity.type] += 1;
      bucket.total += 1;
    }
  }
  const maxWeekTotal = Math.max(
    1,
    ...[...byWeek.values()].map((entry) => entry.total)
  );

  const countsByStatus = new Map<ContactStatus, number>(
    statusGroups.map((entry) => [entry.status, entry._count._all])
  );

  const sources = sourceGroups
    .map((entry) => ({
      name: entry.source ?? "Ohne Angabe",
      count: entry._count._all,
    }))
    .sort((a, b) => b.count - a.count);
  const maxSource = Math.max(1, ...sources.map((entry) => entry.count));

  const kpis = [
    { label: "Aktivitäten diese Woche", value: activitiesThisWeek },
    { label: "Aktivitäten diesen Monat", value: activitiesThisMonth },
    { label: "Aktivitäten gesamt", value: totalActivities },
    {
      label: "Kontakte im Netzwerk",
      value: totalContacts,
      sub: `davon ${newContactsMonth} neu diesen Monat`,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className={pageTitle}>Tätigkeitsbericht</h1>
        <p className="mt-1 text-sm text-slate-500">
          Aggregierte Übersicht · Stand{" "}
          {new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }).format(
            dayToUtcDate(today)
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`${card} p-5`}>
            <p className="text-[13px] font-medium text-slate-500">
              {kpi.label}
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              {kpi.value}
            </p>
            {kpi.sub && (
              <p className="mt-1 text-xs text-slate-400">{kpi.sub}</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={`${card} p-6 sm:p-8`}>
          <h2 className={sectionTitle}>Pipeline nach Status</h2>
          <p className="mt-1 text-sm text-slate-500">
            Wo die Kontakte im Prozess stehen.
          </p>
          <ul className="mt-6 space-y-4">
            {allContactStatuses.map((status) => {
              const count = countsByStatus.get(status) ?? 0;
              const share =
                totalContacts > 0 ? (count / totalContacts) * 100 : 0;
              return (
                <li key={status}>
                  <div className="flex items-center justify-between gap-4">
                    <StatusBadge status={status} />
                    <span className="text-sm font-semibold tabular-nums text-slate-900">
                      {count}
                      <span className="ml-1.5 font-normal text-slate-400">
                        · {Math.round(share)} %
                      </span>
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${statusBarColors[status]}`}
                      style={{ width: `${count > 0 ? Math.max(share, 2) : 0}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className={`${card} p-6 sm:p-8`}>
          <h2 className={sectionTitle}>Woher die Kontakte kommen</h2>
          <p className="mt-1 text-sm text-slate-500">
            Verteilung nach Quelle.
          </p>
          {sources.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">
              Noch keine Kontakte erfasst.
            </p>
          ) : (
            <ul className="mt-6 space-y-4">
              {sources.map((source) => (
                <li key={source.name}>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-slate-700">
                      {source.name}
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-slate-900">
                      {source.count}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-navy-100">
                    <div
                      className="h-full rounded-full bg-navy-600"
                      style={{
                        width: `${Math.max((source.count / maxSource) * 100, 2)}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className={`${card} overflow-x-auto`}>
        <div className="p-6 pb-0 sm:p-8 sm:pb-0">
          <h2 className={sectionTitle}>
            Aktivitäten der letzten {WEEKS_SHOWN} Wochen
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Anrufe, Meetings und E-Mails aus dem Kontakt-Log – ohne Inhalte.
          </p>
        </div>
        <table className="mt-4 w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-slate-200/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-6 py-3 sm:px-8">Woche</th>
              {allActivityTypes.map((type) => (
                <th key={type} className="px-4 py-3 text-right">
                  {activityTypeLabels[type]}
                </th>
              ))}
              <th className="w-56 px-6 py-3 text-right sm:px-8">Gesamt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {weeks.map((monday) => {
              const entry = byWeek.get(monday)!;
              return (
                <tr key={monday} className={monday === thisMonday ? "bg-navy-50/40" : ""}>
                  <td className="px-6 py-3.5 font-medium text-slate-700 sm:px-8">
                    {weekLabel(monday)}
                    {monday === thisMonday && (
                      <span className="ml-2 text-xs font-medium text-navy-600">
                        aktuell
                      </span>
                    )}
                  </td>
                  {allActivityTypes.map((type) => (
                    <td
                      key={type}
                      className="px-4 py-3.5 text-right tabular-nums text-slate-600"
                    >
                      {entry.byType[type]}
                    </td>
                  ))}
                  <td className="px-6 py-3.5 sm:px-8">
                    <div className="flex items-center justify-end gap-3">
                      <span className="w-8 text-right font-semibold tabular-nums text-slate-900">
                        {entry.total}
                      </span>
                      <span
                        aria-hidden
                        className="h-1 w-24 shrink-0 overflow-hidden rounded-full bg-navy-100"
                      >
                        <span
                          className="block h-full rounded-full bg-navy-600"
                          style={{
                            width: `${entry.total > 0 ? Math.max((entry.total / maxWeekTotal) * 100, 4) : 0}%`,
                          }}
                        />
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <div className="flex items-start gap-3 rounded-2xl border border-navy-100 bg-navy-50/60 px-5 py-4">
        <LockIcon className="mt-0.5 h-4.5 w-4.5 shrink-0 text-navy-600" />
        <p className="text-sm leading-relaxed text-navy-800">
          <span className="font-semibold">Datenschutz:</span> Dieser Bericht
          zeigt ausschließlich aggregierte Zahlen. Kundendaten – Namen,
          Kontaktdaten, Gesprächsnotizen – sind hier nicht einsehbar.
        </p>
      </div>
    </div>
  );
}
