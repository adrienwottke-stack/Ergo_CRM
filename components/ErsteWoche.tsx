import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NAME_TARGET } from "@/lib/namelist";
import { abrechnungGesehen, briefGelesen } from "@/app/(app)/heute/actions";
import { card, kicker } from "@/components/ui";
import type { User } from "@/lib/generated/prisma/client";

// Die erste Woche und ihre Momente auf /heute. Das Onboarding hoert nicht
// nach drei Minuten auf - der Abbruch passiert an Tag 4, nicht in Minute 3.
//
// Alles hier wird BERECHNET, nicht abgehakt: die Daten liegen ohnehin vor.
// Vier Bausteine, jeder mit eigener Bedingung, alle koennen fehlen:
//   1. Der Brief kommt zurueck  - 14 Tage dabei, eine Woche Stille
//   2. Wiedereinstieg           - zwei Wochen Stille (ohne Brief)
//   3. Der Starterpass          - 7 Tage nach dem Start, 5 Missionen
//   4. Das 30-Tage-Versprechen  - Countdown, an Tag 30 die Abrechnung

const TAG_MS = 24 * 60 * 60 * 1000;

type Mission = { titel: string; stand: string; fertig: boolean };

export default async function ErsteWoche({ user }: { user: User }) {
  const person = await prisma.person.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!person) return null;

  const seit = user.onboardingDoneAt ?? user.startedAt ?? user.createdAt;
  const tageSeitStart = Math.floor((Date.now() - seit.getTime()) / TAG_MS);
  const startwoche = user.onboardingDoneAt !== null && tageSeitStart <= 7;

  const [namen, logsSeit, guide, herkunft, letzterLog, pledgeTermine] =
    await Promise.all([
      prisma.contact.count({
        where: { ownerId: user.id, listKinds: { isEmpty: false } },
      }),
      prisma.dailyLog.groupBy({
        by: ["type"],
        where: { personId: person.id, date: { gte: seit } },
        _sum: { count: true },
      }),
      prisma.guide.findFirst({ where: { ownerId: user.id }, select: { id: true } }),
      user.herkunftId
        ? prisma.invite.findUnique({
            where: { id: user.herkunftId },
            select: { stake: true, leader: { select: { name: true } } },
          })
        : Promise.resolve(null),
      prisma.dailyLog.findFirst({
        where: { personId: person.id },
        orderBy: { date: "desc" },
        select: { date: true },
      }),
      user.pledgeSetAt
        ? prisma.dailyLog.aggregate({
            _sum: { count: true },
            where: {
              personId: person.id,
              type: "APPOINTMENT_SET",
              date: { gte: user.pledgeSetAt },
            },
          })
        : Promise.resolve(null),
    ]);

  const summe = (typ: string) =>
    logsSeit.find((log) => log.type === typ)?._sum.count ?? 0;

  const tageSeitAktivitaet = letzterLog
    ? Math.floor((Date.now() - letzterLog.date.getTime()) / TAG_MS)
    : null;
  const stille = tageSeitAktivitaet === null || tageSeitAktivitaet >= 7;

  // 1. Der Brief kommt zurueck - genau einmal, im richtigen Moment.
  const briefFaellig =
    user.whyLetter !== null &&
    user.whyShownAt === null &&
    tageSeitStart >= 14 &&
    stille;

  // 2. Wiedereinstieg - nur wenn nicht ohnehin der Brief spricht.
  const wiedereinstieg =
    !briefFaellig &&
    user.onboardingDoneAt !== null &&
    tageSeitAktivitaet !== null &&
    tageSeitAktivitaet >= 14;

  // 4. Versprechen: Countdown oder Abrechnung.
  const pledgeTage = user.pledgeSetAt
    ? Math.floor((Date.now() - user.pledgeSetAt.getTime()) / TAG_MS)
    : null;
  const pledgeGeschafft = pledgeTermine?._sum.count ?? 0;
  const pledgeLaeuft =
    user.pledgeTarget !== null && pledgeTage !== null && pledgeTage < 30;
  const abrechnungFaellig =
    user.pledgeTarget !== null &&
    pledgeTage !== null &&
    pledgeTage >= 30 &&
    user.pledgeShownAt === null;

  const missionen: Mission[] = [
    {
      titel: `${NAME_TARGET} Namen auf der Liste`,
      stand: `${Math.min(namen, NAME_TARGET)} von ${NAME_TARGET}`,
      fertig: namen >= NAME_TARGET,
    },
    {
      titel: "5 Anrufe gemacht",
      stand: `${Math.min(summe("CALL"), 5)} von 5`,
      fertig: summe("CALL") >= 5,
    },
    {
      titel: "Ersten Termin vereinbart",
      stand: summe("APPOINTMENT_SET") > 0 ? "geschafft" : "offen",
      fertig: summe("APPOINTMENT_SET") > 0,
    },
    {
      titel: "Leitfaden zu deinem gemacht",
      stand: guide ? "geschafft" : "offen",
      fertig: guide !== null,
    },
    {
      titel: "Ersten Termin gehalten",
      stand: summe("APPOINTMENT_HELD") > 0 ? "geschafft" : "offen",
      fertig: summe("APPOINTMENT_HELD") > 0,
    },
  ];
  const geschafft = missionen.filter((mission) => mission.fertig).length;

  if (!briefFaellig && !wiedereinstieg && !startwoche && !pledgeLaeuft && !abrechnungFaellig) {
    return null;
  }

  return (
    <div className="space-y-4">
      {briefFaellig && (
        <section className={`${card} border-gold-400/50 bg-gold-100/30 p-5`}>
          <p className={kicker}>Von dir, an dich — Tag 1</p>
          <blockquote className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-slate-800">
            „{user.whyLetter}“
          </blockquote>
          <p className="mt-3 text-sm text-slate-600">
            Das hast du am ersten Tag geschrieben. Ein Anruf heute reicht, um
            wieder drin zu sein.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Link
              href="/namen"
              className="inline-flex min-h-11 items-center rounded-lg bg-navy-800 px-4 text-sm font-medium text-white transition hover:bg-navy-900"
            >
              Zur Namensliste
            </Link>
            <form action={briefGelesen}>
              <button
                type="submit"
                className="min-h-11 px-2 text-sm font-medium text-slate-500 hover:text-slate-900"
              >
                Gelesen
              </button>
            </form>
          </div>
        </section>
      )}

      {wiedereinstieg && (
        <section className={`${card} p-5`}>
          <p className="text-sm font-semibold text-slate-900">
            Willkommen zurück.
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {tageSeitAktivitaet} Tage nichts — passiert. Fangen wir klein an:
            ein Anruf heute.
          </p>
          <Link
            href="/namen"
            className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-navy-800 px-4 text-sm font-medium text-white transition hover:bg-navy-900"
          >
            Zur Namensliste
          </Link>
        </section>
      )}

      {startwoche && (
        <section className={`${card} p-5`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className={kicker}>
              Deine Startwoche · Tag {Math.max(1, tageSeitStart + 1)} von 7
            </p>
            <p className="text-xs text-slate-500">
              {geschafft} von {missionen.length} geschafft
            </p>
          </div>
          <ul className="mt-3 space-y-2">
            {missionen.map((mission) => (
              <li key={mission.titel} className="flex items-center gap-2.5 text-sm">
                <span
                  aria-hidden
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    mission.fertig
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {mission.fertig ? "✓" : ""}
                </span>
                <span
                  className={mission.fertig ? "text-slate-500 line-through" : "text-slate-800"}
                >
                  {mission.titel}
                </span>
                <span className="ml-auto text-xs tabular-nums text-slate-400">
                  {mission.stand}
                </span>
              </li>
            ))}
          </ul>
          {herkunft?.stake && (
            <p className="mt-3 rounded-lg bg-gold-100/50 px-3 py-2 text-sm text-slate-800">
              Einsatz von {herkunft.leader.name}: <strong>{herkunft.stake}</strong>
            </p>
          )}
        </section>
      )}

      {pledgeLaeuft && (
        <p className="text-sm text-slate-600">
          Dein Versprechen: <strong>{user.pledgeTarget} Termine in 30 Tagen</strong>{" "}
          · {pledgeGeschafft} geschafft · noch {30 - (pledgeTage ?? 0)}{" "}
          {30 - (pledgeTage ?? 0) === 1 ? "Tag" : "Tage"}.
        </p>
      )}

      {abrechnungFaellig && (
        <section
          className={`${card} p-5 ${
            pledgeGeschafft >= (user.pledgeTarget ?? 0)
              ? "border-emerald-300 bg-emerald-50/50"
              : ""
          }`}
        >
          <p className={kicker}>Tag 30 · Die Abrechnung</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {pledgeGeschafft} von {user.pledgeTarget} Terminen.
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {pledgeGeschafft >= (user.pledgeTarget ?? 0)
              ? "Versprechen gehalten. Setz dir das nächste — eine Stufe höher."
              : "Nicht die Zahl, die du wolltest. Aber eine ehrliche. Die nächsten 30 Tage laufen ab jetzt."}
          </p>
          <form action={abrechnungGesehen} className="mt-3">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Gesehen
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
