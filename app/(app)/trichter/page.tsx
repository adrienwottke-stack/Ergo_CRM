import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser, requireUserPerson } from "@/lib/auth";
import { eigene } from "@/lib/scope";
import { berlinToday, dayToUtcDate, shiftDay, startOfWeek } from "@/lib/dates";
import type { LostReason } from "@/lib/generated/prisma/enums";
import { lostReasonLabels } from "@/lib/pipeline";
import { card, filterPill, kicker, pageTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

// Vier Zahlen, keine acht Phasen mit Durchlaufzeiten.
//
//   Anrufe -> Termine vereinbart -> Termine gehalten -> Abschlüsse
//
// Die Frage lautet nicht "wie sieht mein Trichter aus", sondern "woran hakt
// es". Die beantwortet der Uebergang zwischen zwei Zahlen, nicht die Zahl
// selbst. Deshalb steht unter jeder Stufe die Quote zur vorigen - und ein
// Satz, der sagt, was daran zu tun ist.

type Fenster = "woche" | "monat" | "immer";

const FENSTER: { key: Fenster; label: string }[] = [
  { key: "woche", label: "Diese Woche" },
  { key: "monat", label: "30 Tage" },
  { key: "immer", label: "Insgesamt" },
];

function quote(teil: number, ganz: number): string {
  if (ganz === 0) return "–";
  return `${Math.round((teil / ganz) * 100)} %`;
}

export default async function TrichterPage({
  searchParams,
}: {
  searchParams: Promise<{ zeit?: string }>;
}) {
  const user = await requireUser();
  const person = await requireUserPerson(user.id);
  const { zeit } = await searchParams;
  const fenster: Fenster =
    zeit === "monat" || zeit === "immer" ? zeit : "woche";

  const heute = berlinToday();
  const ab =
    fenster === "woche"
      ? startOfWeek(heute)
      : fenster === "monat"
        ? dayToUtcDate(shiftDay(heute, -30))
        : null;

  const [zaehler, verluste] = await Promise.all([
    // Gezaehlt wird ueber DailyLog - dieselbe Quelle wie die Rangliste. Zwei
    // Zaehlwege waeren zwei Wahrheiten.
    prisma.dailyLog.groupBy({
      by: ["type"],
      where: { personId: person.id, ...(ab ? { date: { gte: ab } } : {}) },
      _sum: { count: true },
    }),
    prisma.contact.groupBy({
      by: ["lostReason"],
      where: {
        ...eigene(user.id).kontakte,
        outcome: "VERLOREN",
        lostReason: { not: null },
        ...(ab ? { lostAt: { gte: ab } } : {}),
      },
      _count: { _all: true },
    }),
  ]);

  const summe = (typ: string) =>
    zaehler.find((zeile) => zeile.type === typ)?._sum.count ?? 0;

  const anrufe = summe("CALL");
  const vereinbart = summe("APPOINTMENT_SET");
  const gehalten = summe("APPOINTMENT_HELD");
  const abschluesse = summe("DEAL_WON");

  const stufen = [
    {
      key: "anrufe",
      titel: "Anrufe",
      wert: anrufe,
      vorher: null as number | null,
      hinweis: "Der Anfang. Ohne Anrufe passiert nichts dahinter.",
    },
    {
      key: "vereinbart",
      titel: "Termine vereinbart",
      wert: vereinbart,
      vorher: anrufe,
      hinweis: "Hakt es hier, liegt es am Einstieg ins Gespräch.",
    },
    {
      key: "gehalten",
      titel: "Termine gehalten",
      wert: gehalten,
      vorher: vereinbart,
      hinweis: "Hakt es hier, platzen Termine — Vorbereitung und Erinnerung.",
    },
    {
      key: "abschluesse",
      titel: "Abschlüsse",
      wert: abschluesse,
      vorher: gehalten,
      hinweis: "Hakt es hier, liegt es am Termin selbst — nicht an der Menge.",
    },
  ];

  const groesste = Math.max(1, anrufe, vereinbart, gehalten, abschluesse);

  // Der schwaechste Uebergang ist die Antwort auf "woran hakt es".
  const uebergaenge = stufen
    .filter((stufe) => stufe.vorher !== null && stufe.vorher > 0)
    .map((stufe) => ({ ...stufe, anteil: stufe.wert / stufe.vorher! }));
  const engpass =
    uebergaenge.length > 0
      ? uebergaenge.reduce((schwaechster, stufe) =>
          stufe.anteil < schwaechster.anteil ? stufe : schwaechster
        )
      : null;

  const verlustSumme = verluste.reduce(
    (summe, zeile) => summe + (zeile._count._all ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={pageTitle}>Trichter</h1>
          <p className="mt-1 text-sm text-slate-500">
            Vier Zahlen. Der schwächste Übergang sagt, woran es hakt.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FENSTER.map((eintrag) => (
            <Link
              key={eintrag.key}
              href={`/trichter?zeit=${eintrag.key}`}
              className={filterPill(fenster === eintrag.key)}
            >
              {eintrag.label}
            </Link>
          ))}
        </div>
      </div>

      {anrufe === 0 && vereinbart === 0 && gehalten === 0 && abschluesse === 0 ? (
        <div className={`${card} px-6 py-12 text-center`}>
          <p className="text-sm font-medium text-slate-900">
            In diesem Zeitraum ist noch nichts passiert
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Die Zahlen entstehen von selbst, sobald du telefonierst.
          </p>
        </div>
      ) : (
        <>
          <section className={`${card} p-6 sm:p-7`}>
            <ul className="space-y-5">
              {stufen.map((stufe) => (
                <li key={stufe.key}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-slate-800">
                      {stufe.titel}
                    </span>
                    <span className="text-sm tabular-nums text-slate-900">
                      <span className="text-lg font-semibold">{stufe.wert}</span>
                      {stufe.vorher !== null && (
                        <span className="ml-2 text-xs text-slate-500">
                          {quote(stufe.wert, stufe.vorher)} von zuvor
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${
                        engpass?.key === stufe.key ? "bg-amber-500" : "bg-navy-700"
                      }`}
                      style={{
                        width: `${stufe.wert > 0 ? Math.max((stufe.wert / groesste) * 100, 2) : 0}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>

            {engpass && (
              <p className="mt-6 border-t border-slate-100 pt-4 text-sm text-slate-700">
                <span className="font-semibold">
                  Engpass: {engpass.titel.toLowerCase()}.
                </span>{" "}
                {engpass.hinweis}
              </p>
            )}
          </section>

          {verlustSumme > 0 && (
            <section className={`${card} p-6 sm:p-7`}>
              <h2 className="text-sm font-semibold text-slate-900">
                Woran es gescheitert ist
              </h2>
              <ul className="mt-4 space-y-3">
                {verluste
                  .filter((zeile) => zeile.lostReason !== null)
                  .sort((a, b) => (b._count._all ?? 0) - (a._count._all ?? 0))
                  .map((zeile) => {
                    const anzahl = zeile._count._all ?? 0;
                    return (
                      <li key={zeile.lostReason}>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-slate-700">
                            {lostReasonLabels[zeile.lostReason as LostReason]}
                          </span>
                          <span className="text-sm font-semibold tabular-nums text-slate-900">
                            {anzahl}
                            <span className="ml-1.5 font-normal text-slate-400">
                              · {quote(anzahl, verlustSumme)}
                            </span>
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-slate-400"
                            style={{
                              width: `${Math.max((anzahl / verlustSumme) * 100, 2)}%`,
                            }}
                          />
                        </div>
                      </li>
                    );
                  })}
              </ul>
            </section>
          )}
        </>
      )}

      <p className={kicker}>
        Gezählt wird aus deinen Einträgen — dieselbe Quelle wie die Rangliste.
        Woche ab Montag, Berliner Kalender.
      </p>
    </div>
  );
}
