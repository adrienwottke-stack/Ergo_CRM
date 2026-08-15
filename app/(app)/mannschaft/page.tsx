import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { sichtbarkeit } from "@/lib/scope";
import { ebene } from "@/lib/struktur";
import { berlinToday, startOfMonth, startOfWeek } from "@/lib/dates";
import { card, kicker, pageTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

// Wie weit zurueck "letzte Aktivitaet" ueberhaupt gesucht wird. Alles davor
// heisst ohnehin nur noch "lange nichts" - und begrenzt die Abfrage.
const RUECKBLICK_TAGE = 60;

const datumKurz = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Europe/Berlin",
});

function tageSeit(datum: Date): number {
  return Math.floor((Date.now() - datum.getTime()) / (24 * 60 * 60 * 1000));
}

function Kennzahl({
  wert,
  bezeichnung,
  betont = false,
}: {
  wert: number | string;
  bezeichnung: string;
  betont?: boolean;
}) {
  return (
    <div className="min-w-[72px]">
      <p className={`text-lg font-semibold tabular-nums ${betont ? "text-navy-700" : "text-slate-900"}`}>
        {wert}
      </p>
      <p className="text-xs text-slate-500">{bezeichnung}</p>
    </div>
  );
}

export default async function MannschaftPage() {
  const user = await requireUser();
  const sicht = await sichtbarkeit(user, "STRUKTUR");

  const heute = berlinToday();
  const wochenStart = startOfWeek(heute);
  const monatsStart = startOfMonth(heute);
  const rueckblick = new Date(Date.now() - RUECKBLICK_TAGE * 24 * 60 * 60 * 1000);

  const [berater, personen, wochenwerte, offeneVorgaenge, monatsAbschluesse, aktivitaeten] =
    await Promise.all([
      prisma.user.findMany({
        where: { id: { in: sicht.beraterIds } },
        orderBy: { path: "asc" },
        select: {
          id: true,
          name: true,
          path: true,
          startedAt: true,
          deactivatedAt: true,
          _count: { select: { team: true } },
        },
      }),
      prisma.person.findMany({
        where: { userId: { in: sicht.beraterIds } },
        select: { id: true, userId: true },
      }),
      prisma.dailyLog.groupBy({
        by: ["personId", "type"],
        where: {
          date: { gte: wochenStart },
          person: { userId: { in: sicht.beraterIds } },
        },
        _sum: { count: true },
      }),
      prisma.deal.findMany({
        where: { ...sicht.ueberKontakt, outcome: "OFFEN" },
        select: { units: true, contact: { select: { ownerId: true } } },
      }),
      prisma.deal.findMany({
        where: {
          ...sicht.ueberKontakt,
          outcome: "GEWONNEN",
          wonLoggedAt: { gte: monatsStart },
        },
        select: { units: true, contact: { select: { ownerId: true } } },
      }),
      prisma.activity.findMany({
        where: { ...sicht.ueberKontakt, date: { gte: rueckblick } },
        select: { date: true, contact: { select: { ownerId: true } } },
        orderBy: { date: "desc" },
      }),
    ]);

  // Der Wettbewerb zaehlt auf die Person, das CRM auf das Konto. Hier laufen
  // beide zusammen.
  const userIdVonPerson = new Map(
    personen.filter((person) => person.userId).map((person) => [person.id, person.userId!])
  );

  type Werte = {
    anrufe: number;
    termineVereinbart: number;
    termineGehalten: number;
    offeneEinheiten: number;
    abschluesseMonat: number;
    einheitenMonat: number;
    letzteAktivitaet: Date | null;
  };
  const leer = (): Werte => ({
    anrufe: 0,
    termineVereinbart: 0,
    termineGehalten: 0,
    offeneEinheiten: 0,
    abschluesseMonat: 0,
    einheitenMonat: 0,
    letzteAktivitaet: null,
  });
  const werte = new Map<string, Werte>(berater.map((b) => [b.id, leer()]));

  for (const zeile of wochenwerte) {
    const userId = userIdVonPerson.get(zeile.personId);
    const eintrag = userId ? werte.get(userId) : undefined;
    if (!eintrag) continue;
    const summe = zeile._sum.count ?? 0;
    if (zeile.type === "CALL") eintrag.anrufe += summe;
    if (zeile.type === "APPOINTMENT_SET") eintrag.termineVereinbart += summe;
    if (zeile.type === "APPOINTMENT_HELD") eintrag.termineGehalten += summe;
  }

  for (const vorgang of offeneVorgaenge) {
    const eintrag = vorgang.contact.ownerId ? werte.get(vorgang.contact.ownerId) : undefined;
    if (eintrag) eintrag.offeneEinheiten += vorgang.units ?? 0;
  }

  for (const vorgang of monatsAbschluesse) {
    const eintrag = vorgang.contact.ownerId ? werte.get(vorgang.contact.ownerId) : undefined;
    if (!eintrag) continue;
    eintrag.abschluesseMonat += 1;
    eintrag.einheitenMonat += vorgang.units ?? 0;
  }

  // Absteigend sortiert, der erste Treffer je Konto ist damit der juengste.
  for (const aktivitaet of aktivitaeten) {
    const eintrag = aktivitaet.contact.ownerId ? werte.get(aktivitaet.contact.ownerId) : undefined;
    if (eintrag && !eintrag.letzteAktivitaet) eintrag.letzteAktivitaet = aktivitaet.date;
  }

  const fuehrtNiemanden = berater.length <= 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className={pageTitle}>Mannschaft</h1>
        <p className="mt-1 text-sm text-slate-500">
          Zahlen deiner Struktur – Aktivität dieser Woche, offene Einheiten, Abschlüsse
          des Monats. <strong className="font-medium text-slate-600">Keine Kundennamen:</strong>{" "}
          die siehst du nur, wenn ein Berater dir einen Kontakt einzeln freigibt.
        </p>
      </div>

      {fuehrtNiemanden && (
        <div className={`${card} p-6`}>
          <p className="text-sm font-medium text-slate-900">Noch niemand in deiner Struktur</p>
          <p className="mt-1 text-sm text-slate-600">
            Unter{" "}
            <Link href="/team" className="font-medium text-navy-700 hover:underline">
              Team
            </Link>{" "}
            hängst du Berater unter dich oder erzeugst einen Einladungslink. Bis dahin
            steht hier nur deine eigene Zeile.
          </p>
        </div>
      )}

      <ul className="space-y-3">
        {berater.map((person) => {
          const w = werte.get(person.id) ?? leer();
          const stille = w.letzteAktivitaet ? tageSeit(w.letzteAktivitaet) : null;
          const istIch = person.id === user.id;
          return (
            <li key={person.id} className={`${card} p-4 sm:p-5`}>
              <div
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1"
                style={{ paddingLeft: `${Math.min(ebene(person.path), 4) * 12}px` }}
              >
                <span className="text-sm font-semibold text-slate-900">
                  {person.name}
                  {istIch && <span className="ml-2 text-xs font-normal text-slate-400">du</span>}
                </span>
                {person._count.team > 0 && (
                  <span className="rounded-full bg-navy-50 px-2 py-0.5 text-xs text-navy-700">
                    führt {person._count.team}
                  </span>
                )}
                {person.deactivatedAt && (
                  <span className="text-xs text-slate-400">ausgetreten</span>
                )}
                <span className="ml-auto text-xs text-slate-500">
                  {w.letzteAktivitaet
                    ? `zuletzt aktiv ${datumKurz.format(w.letzteAktivitaet)}${
                        stille !== null && stille >= 1 ? ` · vor ${stille} Tagen` : ""
                      }`
                    : `seit über ${RUECKBLICK_TAGE} Tagen keine Aktivität`}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
                <Kennzahl wert={w.anrufe} bezeichnung="Anrufe (Woche)" />
                <Kennzahl wert={w.termineVereinbart} bezeichnung="Termine vereinbart" />
                <Kennzahl wert={w.termineGehalten} bezeichnung="Termine gehalten" />
                <Kennzahl wert={w.offeneEinheiten} bezeichnung="Einheiten offen" />
                <Kennzahl wert={w.abschluesseMonat} bezeichnung="Abschlüsse (Monat)" betont />
                <Kennzahl wert={w.einheitenMonat} bezeichnung="Einheiten (Monat)" betont />
              </div>
            </li>
          );
        })}
      </ul>

      <p className={kicker}>
        Woche ab Montag, Monat ab dem Ersten – beides nach Berliner Kalender.
      </p>
    </div>
  );
}
