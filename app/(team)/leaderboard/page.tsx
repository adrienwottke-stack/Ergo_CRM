import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { allQuotaTypes, quotaTypeLabels } from "@/lib/labels";
import {
  berlinToday,
  dayToUtcDate,
  startOfMonth,
  startOfWeek,
} from "@/lib/dates";
import type { QuotaType } from "@/lib/generated/prisma/enums";
import { PlusIcon, TrophyIcon } from "@/components/icons";
import { btnPrimary, card, filterPill, pageTitle, td, th } from "@/components/ui";

export const dynamic = "force-dynamic";

const ranges = {
  today: "Heute",
  week: "Diese Woche",
  month: "Dieser Monat",
} as const;

type RangeKey = keyof typeof ranges;

function RankChip({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gold-100 text-[13px] font-bold text-gold-600 ring-1 ring-inset ring-gold-600/25">
        1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-[13px] font-bold text-slate-600 ring-1 ring-inset ring-slate-500/20">
        2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-[13px] font-bold text-orange-700 ring-1 ring-inset ring-orange-600/20">
        3
      </span>
    );
  }
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center text-[13px] font-medium tabular-nums text-slate-400">
      {rank}
    </span>
  );
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const rangeKey: RangeKey =
    range && range in ranges ? (range as RangeKey) : "week";

  const today = berlinToday();
  const start =
    rangeKey === "today"
      ? dayToUtcDate(today)
      : rangeKey === "week"
        ? startOfWeek(today)
        : startOfMonth(today);

  const [sums, persons] = await Promise.all([
    prisma.dailyLog.groupBy({
      by: ["personId", "type"],
      where: { date: { gte: start } },
      _sum: { count: true },
    }),
    prisma.person.findMany(),
  ]);

  const nameById = new Map(persons.map((p) => [p.id, p.name]));

  const rows = new Map<
    string,
    { name: string; byType: Record<QuotaType, number>; total: number }
  >();
  for (const entry of sums) {
    const count = entry._sum.count ?? 0;
    if (count === 0) continue;
    let row = rows.get(entry.personId);
    if (!row) {
      row = {
        name: nameById.get(entry.personId) ?? "Unbekannt",
        byType: { CALL: 0, NUMBERS_PULLED: 0, APPOINTMENT_SET: 0 },
        total: 0,
      };
      rows.set(entry.personId, row);
    }
    row.byType[entry.type] += count;
    row.total += count;
  }

  const ranking = [...rows.values()].sort((a, b) => b.total - a.total);
  const maxTotal = ranking[0]?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={pageTitle}>Rangliste</h1>
          <p className="mt-1 text-sm text-slate-500">
            {ranking.length === 0
              ? "Noch alles offen."
              : `${ranking[0]!.name} führt mit ${ranking[0]!.total} Aktivitäten.`}
          </p>
        </div>
        <Link href="/log" className={btnPrimary}>
          <PlusIcon className="h-4 w-4" />
          Aktivität loggen
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(ranges) as RangeKey[]).map((key) => (
          <Link
            key={key}
            href={`/leaderboard?range=${key}`}
            className={filterPill(rangeKey === key)}
          >
            {ranges[key]}
          </Link>
        ))}
      </div>

      {ranking.length === 0 ? (
        <div className={`${card} flex flex-col items-center px-6 py-16 text-center`}>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-100 text-gold-600">
            <TrophyIcon className="h-6 w-6" />
          </span>
          <p className="mt-4 text-sm font-medium text-slate-900">
            Noch keine Einträge in diesem Zeitraum
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Sei die erste Person auf dem Board!
          </p>
          <Link href="/log" className={`${btnPrimary} mt-6`}>
            <PlusIcon className="h-4 w-4" />
            Jetzt loggen
          </Link>
        </div>
      ) : (
        <div className={`${card} overflow-x-auto`}>
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200/80 bg-slate-50/60">
              <tr>
                <th className={th}>Platz</th>
                <th className={th}>Name</th>
                {allQuotaTypes.map((type) => (
                  <th key={type} className={`${th} text-right`}>
                    {quotaTypeLabels[type]}
                  </th>
                ))}
                <th className={`${th} w-56 text-right`}>Gesamt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ranking.map((row, index) => (
                <tr
                  key={row.name}
                  className={
                    index === 0
                      ? "bg-gold-100/30"
                      : "transition hover:bg-navy-50/40"
                  }
                >
                  <td className={td}>
                    <RankChip rank={index + 1} />
                  </td>
                  <td className={`${td} font-medium text-slate-900`}>
                    {row.name}
                  </td>
                  {allQuotaTypes.map((type) => (
                    <td
                      key={type}
                      className={`${td} text-right tabular-nums text-slate-600`}
                    >
                      {row.byType[type]}
                    </td>
                  ))}
                  <td className={td}>
                    <div className="flex items-center justify-end gap-3">
                      <span className="w-8 text-right text-sm font-semibold tabular-nums text-slate-900">
                        {row.total}
                      </span>
                      <span
                        aria-hidden
                        className="h-1 w-24 shrink-0 overflow-hidden rounded-full bg-navy-100"
                      >
                        <span
                          className="block h-full rounded-full bg-navy-600"
                          style={{
                            width: `${maxTotal > 0 ? Math.max((row.total / maxTotal) * 100, 4) : 0}%`,
                          }}
                        />
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-400">
        Woche = ab Montag, Zeitzone Europe/Berlin. Sichtbar sind nur Namen und
        Zahlen – keine Kontaktdaten.
      </p>
    </div>
  );
}
