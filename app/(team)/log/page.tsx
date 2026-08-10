import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { QuotaType } from "@/lib/generated/prisma/enums";
import { personCookieName } from "@/lib/auth";
import { allQuotaTypes, quotaTypeLabels } from "@/lib/labels";
import { berlinToday, dayDisplayFormat, dayToUtcDate } from "@/lib/dates";
import { LogoMark } from "@/components/Logo";
import {
  CalendarCheckIcon,
  ChevronRightIcon,
  HashIcon,
  PhoneIcon,
  PlusIcon,
} from "@/components/icons";
import {
  btnPrimary,
  card,
  input,
  label,
  pageTitle,
  sectionTitle,
} from "@/components/ui";
import {
  deleteLog,
  logDaily,
  quickLog,
  selectPerson,
  switchPerson,
} from "./actions";

export const dynamic = "force-dynamic";

function QuotaIcon({
  type,
  className,
}: {
  type: QuotaType;
  className?: string;
}) {
  if (type === "CALL") return <PhoneIcon className={className} />;
  if (type === "NUMBERS_PULLED") return <HashIcon className={className} />;
  return <CalendarCheckIcon className={className} />;
}

const quotaIconStyles: Record<QuotaType, string> = {
  CALL: "bg-blue-50 text-blue-600",
  NUMBERS_PULLED: "bg-navy-50 text-navy-600",
  APPOINTMENT_SET: "bg-emerald-50 text-emerald-600",
};

export default async function LogPage() {
  const cookieStore = await cookies();
  const personId = cookieStore.get(personCookieName)?.value;
  const person = personId
    ? await prisma.person.findUnique({ where: { id: personId } })
    : null;

  if (!person) {
    const persons = await prisma.person.findMany({ orderBy: { name: "asc" } });

    return (
      <div className="mx-auto max-w-md space-y-6 pt-6">
        <div className="flex flex-col items-center text-center">
          <LogoMark className="h-12 w-12" />
          <h1 className={`${pageTitle} mt-4`}>Wer bist du?</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Wähle deinen Namen oder leg ihn neu an – unter diesem Namen
            erscheinen deine Zahlen in der Rangliste.
          </p>
        </div>
        <form action={selectPerson} className={`${card} space-y-5 p-6 sm:p-8`}>
          <div>
            <label htmlFor="name" className={label}>
              Dein Name *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              maxLength={60}
              list="person-names"
              placeholder="z. B. Max Mustermann"
              className={input}
            />
            <datalist id="person-names">
              {persons.map((p) => (
                <option key={p.id} value={p.name} />
              ))}
            </datalist>
          </div>
          <button type="submit" className={`${btnPrimary} w-full`}>
            Weiter
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </form>
      </div>
    );
  }

  const today = berlinToday();
  const todayDate = dayToUtcDate(today);

  const [todaySums, recentLogs] = await Promise.all([
    prisma.dailyLog.groupBy({
      by: ["type"],
      where: { personId: person.id, date: todayDate },
      _sum: { count: true },
    }),
    prisma.dailyLog.findMany({
      where: { personId: person.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const todayByType = new Map(
    todaySums.map((entry) => [entry.type, entry._sum.count ?? 0])
  );

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className={pageTitle}>Aktivität loggen</h1>
          <p className="mt-1 text-sm text-slate-500">
            Du loggst als{" "}
            <span className="font-medium text-slate-900">{person.name}</span>
          </p>
        </div>
        <form action={switchPerson}>
          <button
            type="submit"
            className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            Nicht du? Wechseln
          </button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {allQuotaTypes.map((type) => (
          <div key={type} className={`${card} p-5`}>
            <div className="flex items-center justify-between">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full ${quotaIconStyles[type]}`}
              >
                <QuotaIcon type={type} className="h-4.5 w-4.5" />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Heute
              </span>
            </div>
            <p className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">
              {todayByType.get(type) ?? 0}
            </p>
            <p className="mt-1 text-[13px] font-medium text-slate-500">
              {quotaTypeLabels[type]}
            </p>
            <form action={quickLog.bind(null, type, 1)} className="mt-4">
              <button
                type="submit"
                className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 transition hover:border-navy-300 hover:bg-navy-50 hover:text-navy-700 active:scale-[0.98]"
              >
                <PlusIcon className="h-4 w-4" />1
              </button>
            </form>
          </div>
        ))}
      </div>

      <form action={logDaily} className={`${card} space-y-5 p-6 sm:p-8`}>
        <h2 className={sectionTitle}>Mehrere auf einmal loggen</h2>
        <div className="grid gap-5 sm:grid-cols-3">
          {allQuotaTypes.map((type) => (
            <div key={type}>
              <label htmlFor={type} className={label}>
                {quotaTypeLabels[type]}
              </label>
              <input
                id={type}
                name={type}
                type="number"
                min={0}
                max={999}
                placeholder="0"
                className={input}
              />
            </div>
          ))}
        </div>
        <div>
          <label htmlFor="day" className={label}>
            Tag
          </label>
          <input
            id="day"
            name="day"
            type="date"
            defaultValue={today}
            max={today}
            className={input}
          />
        </div>
        <div className="flex justify-end border-t border-slate-100 pt-5">
          <button type="submit" className={btnPrimary}>
            Speichern
          </button>
        </div>
      </form>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className={sectionTitle}>Deine letzten Einträge</h2>
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-1 text-sm font-medium text-navy-600 transition hover:gap-1.5 hover:underline"
          >
            Zur Rangliste
            <ChevronRightIcon className="h-4 w-4" />
          </Link>
        </div>
        {recentLogs.length === 0 ? (
          <div className={`${card} px-6 py-12 text-center`}>
            <p className="text-sm font-medium text-slate-900">
              Noch nichts geloggt
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Starte mit deinem ersten Eintrag – die Rangliste wartet.
            </p>
          </div>
        ) : (
          <ul className={`${card} divide-y divide-slate-100`}>
            {recentLogs.map((log) => {
              const isToday = log.date.getTime() === todayDate.getTime();
              return (
                <li
                  key={log.id}
                  className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm"
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${quotaIconStyles[log.type]}`}
                    >
                      <QuotaIcon type={log.type} className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="font-semibold text-slate-900">
                        +{log.count}
                      </span>{" "}
                      <span className="text-slate-600">
                        {quotaTypeLabels[log.type]}
                      </span>
                    </span>
                  </span>
                  <span className="flex items-center gap-4">
                    <span className="text-xs tabular-nums text-slate-400">
                      {dayDisplayFormat.format(log.date)}
                    </span>
                    {isToday && (
                      <form action={deleteLog.bind(null, log.id)}>
                        <button
                          type="submit"
                          className="text-xs font-medium text-slate-400 transition hover:text-red-600"
                        >
                          Löschen
                        </button>
                      </form>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
