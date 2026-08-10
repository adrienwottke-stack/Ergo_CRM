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

export const dynamic = "force-dynamic";

const ranges = {
  today: "Heute",
  week: "Diese Woche",
  month: "Dieser Monat",
} as const;

type RangeKey = keyof typeof ranges;

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Rangliste</h1>
        <Link
          href="/log"
          className="inline-flex min-h-11 items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Aktivität loggen
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(ranges) as RangeKey[]).map((key) => (
          <Link
            key={key}
            href={`/leaderboard?range=${key}`}
            className={`rounded-full px-3 py-1 text-sm ${
              rangeKey === key
                ? "bg-stone-900 text-white"
                : "border border-stone-300 bg-white text-stone-600 hover:bg-stone-100"
            }`}
          >
            {ranges[key]}
          </Link>
        ))}
      </div>

      {ranking.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-white p-10 text-center text-sm text-stone-500">
          Noch keine Einträge in diesem Zeitraum – sei die erste Person auf dem
          Board!
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3">Platz</th>
                <th className="px-4 py-3">Name</th>
                {allQuotaTypes.map((type) => (
                  <th key={type} className="px-4 py-3 text-right">
                    {quotaTypeLabels[type]}
                  </th>
                ))}
                <th className="px-4 py-3 text-right">Gesamt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {ranking.map((row, index) => (
                <tr
                  key={row.name}
                  className={index === 0 ? "bg-amber-50" : "hover:bg-stone-50"}
                >
                  <td className="px-4 py-3 font-semibold">{index + 1}.</td>
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  {allQuotaTypes.map((type) => (
                    <td key={type} className="px-4 py-3 text-right">
                      {row.byType[type]}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right font-semibold">
                    {row.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-stone-400">
        Woche = ab Montag, Zeitzone Europe/Berlin. Sichtbar sind nur Namen und
        Zahlen – keine Kontaktdaten.
      </p>
    </div>
  );
}
