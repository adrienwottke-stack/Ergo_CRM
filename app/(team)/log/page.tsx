import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { personCookieName } from "@/lib/auth";
import { allQuotaTypes, quotaTypeLabels } from "@/lib/labels";
import { berlinToday, dayDisplayFormat, dayToUtcDate } from "@/lib/dates";
import { deleteLog, logDaily, quickLog, selectPerson, switchPerson } from "./actions";

export const dynamic = "force-dynamic";

const inputClasses =
  "mt-1 min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

export default async function LogPage() {
  const cookieStore = await cookies();
  const personId = cookieStore.get(personCookieName)?.value;
  const person = personId
    ? await prisma.person.findUnique({ where: { id: personId } })
    : null;

  if (!person) {
    const persons = await prisma.person.findMany({ orderBy: { name: "asc" } });

    return (
      <div className="mx-auto max-w-md space-y-6">
        <h1 className="text-2xl font-semibold">Wer bist du?</h1>
        <p className="text-sm text-stone-500">
          Wähle deinen Namen oder leg ihn neu an – unter diesem Namen erscheinen
          deine Zahlen in der Rangliste.
        </p>
        <form
          action={selectPerson}
          className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-stone-700"
            >
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
              className={inputClasses}
            />
            <datalist id="person-names">
              {persons.map((p) => (
                <option key={p.id} value={p.name} />
              ))}
            </datalist>
          </div>
          <button
            type="submit"
            className="min-h-11 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Weiter
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Aktivität loggen</h1>
          <p className="mt-1 text-sm text-stone-500">
            Du loggst als <span className="font-medium">{person.name}</span>
          </p>
        </div>
        <form action={switchPerson}>
          <button
            type="submit"
            className="text-sm text-stone-500 hover:text-stone-900"
          >
            Nicht du? Wechseln
          </button>
        </form>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {allQuotaTypes.map((type) => (
          <div
            key={type}
            className="rounded-xl border border-stone-200 bg-white p-4 text-center shadow-sm"
          >
            <p className="text-xs text-stone-500">{quotaTypeLabels[type]}</p>
            <p className="mt-1 text-2xl font-semibold">
              {todayByType.get(type) ?? 0}
            </p>
            <p className="text-xs text-stone-400">heute</p>
            <form action={quickLog.bind(null, type, 1)} className="mt-2">
              <button
                type="submit"
                className="min-h-11 w-full rounded-lg border border-stone-300 bg-white px-2 py-1 text-sm font-medium text-stone-700 hover:bg-stone-100"
              >
                +1
              </button>
            </form>
          </div>
        ))}
      </div>

      <form
        action={logDaily}
        className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-base font-semibold">Mehrere auf einmal loggen</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {allQuotaTypes.map((type) => (
            <div key={type}>
              <label
                htmlFor={type}
                className="block text-sm font-medium text-stone-700"
              >
                {quotaTypeLabels[type]}
              </label>
              <input
                id={type}
                name={type}
                type="number"
                min={0}
                max={999}
                placeholder="0"
                className={inputClasses}
              />
            </div>
          ))}
        </div>
        <div>
          <label
            htmlFor="day"
            className="block text-sm font-medium text-stone-700"
          >
            Tag
          </label>
          <input
            id="day"
            name="day"
            type="date"
            defaultValue={today}
            max={today}
            className={inputClasses}
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="min-h-11 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Speichern
          </button>
        </div>
      </form>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Deine letzten Einträge</h2>
          <Link
            href="/leaderboard"
            className="text-sm text-blue-600 hover:underline"
          >
            Zur Rangliste →
          </Link>
        </div>
        {recentLogs.length === 0 ? (
          <p className="rounded-xl border border-stone-200 bg-white p-6 text-center text-sm text-stone-500">
            Noch nichts geloggt – leg los!
          </p>
        ) : (
          <ul className="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white shadow-sm">
            {recentLogs.map((log) => {
              const isToday = log.date.getTime() === todayDate.getTime();
              return (
                <li
                  key={log.id}
                  className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
                >
                  <span>
                    <span className="font-medium">+{log.count}</span>{" "}
                    {quotaTypeLabels[log.type]}
                  </span>
                  <span className="flex items-center gap-4">
                    <span className="text-xs text-stone-500">
                      {dayDisplayFormat.format(log.date)}
                    </span>
                    {isToday && (
                      <form action={deleteLog.bind(null, log.id)}>
                        <button
                          type="submit"
                          className="text-xs text-stone-400 hover:text-red-600"
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
