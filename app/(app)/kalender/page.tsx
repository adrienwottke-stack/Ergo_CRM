import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { eigene } from "@/lib/scope";
import { berlinDayOf, berlinToday, dayToUtcDate, shiftDay } from "@/lib/dates";
import { card, kicker, pageTitle, columnNarrow } from "@/components/ui";
import { CalendarCheckIcon, PhoneIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

// Der Kalender im Werkzeug (docs/audit-kernmodell.md, 10.3).
//
// Bewusst kein Monatsraster: am Handy ist ein Monatsgitter unlesbar, und die
// Frage lautet ohnehin nicht "wie sieht der Mai aus", sondern "was steht als
// Naechstes an". Deshalb Tage untereinander, der naechste zuerst.
//
// Die Erinnerung kommt nicht von uns, sondern vom Kalender des Telefons: jeder
// Termin laesst sich mit einem Tipp dorthin uebernehmen, inklusive Weckruf
// eine Stunde vorher.

const tagFormat = new Intl.DateTimeFormat("de-DE", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  timeZone: "Europe/Berlin",
});

const zeitFormat = new Intl.DateTimeFormat("de-DE", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Berlin",
});

export default async function KalenderPage() {
  const user = await requireUser();
  const heute = berlinToday();
  // Ab heute Mitternacht: ein Termin von heute Vormittag gehoert noch dazu,
  // sonst verschwindet er waehrend man ihn sucht.
  const ab = dayToUtcDate(heute);

  const termine = await prisma.contact.findMany({
    where: {
      ...eigene(user.id).kontakte,
      outcome: { not: "VERLOREN" },
      appointmentAt: { gte: ab },
    },
    orderBy: { appointmentAt: "asc" },
    select: {
      id: true,
      name: true,
      phone: true,
      appointmentAt: true,
      nextStepNote: true,
    },
  });

  // Nach Berliner Kalendertag gruppieren.
  const tage = new Map<string, typeof termine>();
  for (const termin of termine) {
    const tag = berlinDayOf(termin.appointmentAt!);
    const liste = tage.get(tag) ?? [];
    liste.push(termin);
    tage.set(tag, liste);
  }

  const morgen = shiftDay(heute, 1);
  const tagName = (tag: string) => {
    if (tag === heute) return "Heute";
    if (tag === morgen) return "Morgen";
    return tagFormat.format(dayToUtcDate(tag));
  };

  return (
    <div className={`${columnNarrow} space-y-6`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={pageTitle}>Kalender</h1>
          <p className="mt-1 text-sm text-slate-500">
            {termine.length === 0
              ? "Keine Termine."
              : `${termine.length} ${termine.length === 1 ? "Termin" : "Termine"} vor dir.`}
          </p>
        </div>
        {termine.length > 0 && (
          <a
            href="/kalender/alle.ics"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-slate-300 bg-surface px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <CalendarCheckIcon className="h-4 w-4" />
            Alle übernehmen
          </a>
        )}
      </div>

      {termine.length === 0 ? (
        <div className={`${card} px-6 py-12 text-center`}>
          <p className="text-sm font-medium text-slate-900">Nichts eingetragen</p>
          <p className="mt-1 text-sm text-slate-500">
            Termine entstehen im Gespräch — der Knopf „Termin“ im{" "}
            <Link href="/namen" className="font-medium text-navy-600 hover:underline">
              Durchlauf
            </Link>{" "}
            legt sie an.
          </p>
        </div>
      ) : (
        [...tage.entries()].map(([tag, eintraege]) => (
          <section key={tag} className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">
              {tagName(tag)}
              <span className="ml-2 text-sm font-normal text-slate-400">
                {eintraege.length}
              </span>
            </h2>
            <ul className="space-y-2">
              {eintraege.map((termin) => (
                <li key={termin.id} className={`${card} flex items-center gap-3 p-4`}>
                  <span className="w-14 shrink-0 text-sm font-semibold tabular-nums text-navy-800">
                    {zeitFormat.format(termin.appointmentAt!)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/contacts/${termin.id}`}
                      className="block truncate text-sm font-semibold text-slate-900 hover:text-navy-700"
                    >
                      {termin.name}
                    </Link>
                    {termin.nextStepNote && (
                      <p className="truncate text-xs text-slate-500">
                        {termin.nextStepNote}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {termin.phone && (
                      <a
                        href={`tel:${termin.phone.replace(/\s/g, "")}`}
                        aria-label={`${termin.name} anrufen`}
                        className="flex min-h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100"
                      >
                        <PhoneIcon className="h-4 w-4" />
                      </a>
                    )}
                    <a
                      href={`/kalender/${termin.id}.ics`}
                      aria-label={`Termin mit ${termin.name} in den Kalender übernehmen`}
                      title="In den Kalender des Handys übernehmen"
                      className="flex min-h-11 w-11 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-50 hover:text-navy-700"
                    >
                      <CalendarCheckIcon className="h-4 w-4" />
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      <p className={kicker}>
        „Übernehmen“ legt den Termin in den Kalender deines Handys — mit
        Erinnerung eine Stunde vorher. Von dort weckt dich dein Telefon, auch
        wenn die App zu ist.
      </p>
    </div>
  );
}
