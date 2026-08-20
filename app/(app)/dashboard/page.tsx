import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { eigene } from "@/lib/scope";
import type { ContactStage } from "@/lib/generated/prisma/enums";
import {
  ACQUISITION_STAGES,
  CARE_STAGES,
  contactStageLabels,
  contactStagePalette,
} from "@/lib/pipeline";
import {
  addDays,
  berlinToday,
  dayToUtcDate,
  dueState,
  hasTimeOfDay,
  mondayOf,
  shiftDay,
} from "@/lib/dates";
import { weeklyTotals } from "@/lib/stats";
import NextStepBadge from "@/components/NextStepBadge";
import SparkBars from "@/components/SparkBars";
import DailyTargetCard from "@/components/DailyTargetCard";
import {
  BellIcon,
  ChevronRightIcon,
  LayersIcon,
  UsersIcon,
} from "@/components/icons";
import { card, kicker, pageTitle } from "@/components/ui";
import SectionTabs from "@/components/SectionTabs";
import { ZAHLEN_TABS } from "@/lib/nav";

export const dynamic = "force-dynamic";

const WEEKS_SHOWN = 8;

export default async function DashboardPage() {
  const user = await requireUser();
  const sicht = eigene(user.id);
  const today = berlinToday();
  const thisMonday = mondayOf(today);
  const oldestMonday = shiftDay(thisMonday, -7 * (WEEKS_SHOWN - 1));
  const todayStart = dayToUtcDate(today);
  const tomorrow = addDays(todayStart, 1);

  const [
    grouped,
    recentActivities,
    dueSteps,
    dueDeals,
    stepless,
    openDeals,
    todayCallsCount,
    todayAppointmentsCount,
  ] = await Promise.all([
    prisma.contact.groupBy({
      by: ["stage"],
      where: { ...sicht.kontakte, outcome: { not: "VERLOREN" } },
      _count: { _all: true },
    }),
    prisma.activity.findMany({
      where: {
        date: { gte: dayToUtcDate(oldestMonday) },
        ...sicht.ueberKontakt,
      },
      select: { date: true },
    }),
    prisma.contact.findMany({
      where: {
        ...sicht.kontakte,
        nextStepType: { not: null },
        nextStepAt: { lt: tomorrow },
      },
      orderBy: { nextStepAt: "asc" },
      take: 6,
      select: {
        id: true,
        name: true,
        stage: true,
        outcome: true,
        nextStepType: true,
        nextStepAt: true,
      },
    }),
    prisma.deal.count({
      where: {
        ...sicht.ueberKontakt,
        outcome: "OFFEN",
        nextStepType: { not: null },
        nextStepAt: { lt: tomorrow },
      },
    }),
    prisma.contact.findMany({
      where: {
        ...sicht.kontakte,
        nextStepType: null,
        outcome: { not: "VERLOREN" },
      },
      select: { id: true, stage: true, deals: { where: { outcome: "OFFEN" }, select: { id: true } } },
    }),
    prisma.deal.aggregate({
      where: { ...sicht.ueberKontakt, outcome: "OFFEN" },
      _sum: { units: true },
      _count: { _all: true },
    }),
    prisma.activity.count({
      where: {
        type: "CALL",
        date: { gte: todayStart },
        ...sicht.ueberKontakt,
      },
    }),
    prisma.contact.count({
      where: { ...sicht.kontakte, appointmentLoggedAt: { gte: todayStart } },
    }),
  ]);

  const countsByStage = new Map<ContactStage, number>(
    grouped.map((entry) => [entry.stage, entry._count._all])
  );
  const totalCount = grouped.reduce((sum, entry) => sum + entry._count._all, 0);

  const weekly = weeklyTotals(
    recentActivities.map((a) => a.date),
    thisMonday,
    WEEKS_SHOWN
  );
  const thisWeek = weekly[WEEKS_SHOWN - 1]!;
  const lastWeek = weekly[WEEKS_SHOWN - 2]!;
  const delta = thisWeek - lastWeek;

  // In Beratung fuehrt der Vorgang den Schritt – das ist kein Versaeumnis.
  const orphanCount = stepless.filter(
    (contact) => !(contact.stage === "IN_BERATUNG" && contact.deals.length > 0)
  ).length;
  const dueCount = dueSteps.length + dueDeals;

  return (
    <div className="space-y-8">
      <SectionTabs tabs={ZAHLEN_TABS} />

      <div>
        <h1 className={pageTitle}>Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Dein Netzwerk auf einen Blick.</p>
      </div>

      <DailyTargetCard
        todayCallsCount={todayCallsCount}
        todayAppointmentsCount={todayAppointmentsCount}
      />

      <section className={`${card} p-6 sm:p-7`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BellIcon className="h-4.5 w-4.5 text-navy-600" />
            <h2 className="text-sm font-semibold text-slate-900">
              Fällig heute und überfällig
            </h2>
          </div>
          <Link
            href="/heute"
            className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-navy-600 hover:underline"
          >
            Zur Heute-Liste
            <ChevronRightIcon className="h-4 w-4" />
          </Link>
        </div>

        {dueCount === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            Nichts offen – alles abgearbeitet.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {dueSteps.map((contact) => (
              <li key={contact.id}>
                <Link
                  href={`/contacts/${contact.id}`}
                  className="group flex min-h-11 flex-wrap items-center justify-between gap-3 py-2.5"
                >
                  <span className="text-sm font-medium text-slate-900 group-hover:text-navy-700">
                    {contact.name}
                  </span>
                  <NextStepBadge
                    type={contact.nextStepType!}
                    at={contact.nextStepAt!}
                    state={dueState(contact.nextStepAt!, today)}
                    withTime={hasTimeOfDay(contact.nextStepAt!)}
                  />
                </Link>
              </li>
            ))}
            {dueDeals > 0 && (
              <li className="py-2.5 text-sm text-slate-500">
                + {dueDeals} fällige {dueDeals === 1 ? "Vorgang" : "Vorgänge"}
              </li>
            )}
          </ul>
        )}

        {orphanCount > 0 && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {orphanCount} {orphanCount === 1 ? "Kontakt hat" : "Kontakte haben"} keinen
            nächsten Schritt.{" "}
            <Link href="/heute" className="font-semibold underline">
              Nacharbeiten
            </Link>
          </p>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/contacts"
          className={`${card} group p-5 transition hover:border-navy-300`}
        >
          <div className="flex items-center gap-2 text-slate-600">
            <UsersIcon className="h-5 w-5 text-navy-600" />
            <span className="text-[13px] font-medium">Kontakte</span>
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums text-slate-900">
            {totalCount}
          </p>
        </Link>

        <Link
          href="/vorgaenge"
          className={`${card} group p-5 transition hover:border-navy-300`}
        >
          <div className="flex items-center gap-2 text-slate-600">
            <LayersIcon className="h-5 w-5 text-navy-600" />
            <span className="text-[13px] font-medium">Offene Vorgänge</span>
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums text-slate-900">
            {openDeals._count._all}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {openDeals._sum.units ?? 0} Einheiten in der Pipeline
          </p>
        </Link>

        <div className={`${card} p-5`}>
          <p className="text-[13px] font-medium text-slate-600">
            Aktivitäten diese Woche
          </p>
          <div className="mt-3 flex items-baseline gap-3">
            <p className="text-3xl font-semibold tracking-tight tabular-nums text-slate-900">
              {thisWeek}
            </p>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                delta >= 0
                  ? "bg-emerald-50 text-emerald-800 ring-emerald-600/15"
                  : "bg-red-50 text-red-700 ring-red-600/15"
              }`}
            >
              {delta >= 0 ? `+${delta}` : delta}
            </span>
          </div>
          <SparkBars values={weekly} className="mt-2 h-10 w-full" />
        </div>

        <Link
          href="/leaderboard"
          className={`${card} group flex flex-col justify-between bg-navy-900 p-5 transition hover:bg-navy-950`}
        >
          <p className="text-[13px] font-medium text-slate-300">Team-Wettbewerb</p>
          <p className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-white transition group-hover:gap-2">
            Zur Rangliste
            <ChevronRightIcon className="h-4 w-4 text-gold-400" />
          </p>
        </Link>
      </div>

      <section className={`${card} p-6 sm:p-7`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900">Verteilung im Trichter</h2>
          <Link
            href="/pipeline"
            className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-navy-600 hover:underline"
          >
            Zur Pipeline
            <ChevronRightIcon className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-4 space-y-5">
          {[
            { title: "Akquise", stages: ACQUISITION_STAGES },
            { title: "Betreuung", stages: CARE_STAGES },
          ].map((group) => (
            <div key={group.title}>
              <p className={kicker}>{group.title}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-4">
                {group.stages.map((stage) => {
                  const count = countsByStage.get(stage) ?? 0;
                  return (
                    <Link
                      key={stage}
                      href={`/contacts?stage=${stage}`}
                      className="rounded-xl border border-slate-200 p-3 transition hover:border-navy-300"
                    >
                      <span
                        className={`inline-block h-1.5 w-8 rounded-full ${contactStagePalette[stage].bar}`}
                      />
                      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-slate-900">
                        {count}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {contactStageLabels[stage]}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
