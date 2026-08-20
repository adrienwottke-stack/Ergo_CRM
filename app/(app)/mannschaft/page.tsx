import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { sichtbarkeit } from "@/lib/scope";
import { ebene } from "@/lib/struktur";
import { berlinToday, dayToUtcDate, startOfMonth, startOfWeek } from "@/lib/dates";
import {
  SCHWELLEN,
  ampelFarben,
  ampelTexte,
  ampelVon,
  signaleFuer,
  type Signal,
} from "@/lib/signale";
import { card, kicker, pageTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

// Wie weit zurueck "letzte Aktivitaet" ueberhaupt gesucht wird. Alles davor
// heisst ohnehin nur noch "lange nichts" - und begrenzt die Abfrage.
const RUECKBLICK_TAGE = 60;
const TAG_MS = 24 * 60 * 60 * 1000;

const datumKurz = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Europe/Berlin",
});

function tageSeit(datum: Date): number {
  return Math.floor((Date.now() - datum.getTime()) / TAG_MS);
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

function SignalZeile({ signal }: { signal: Signal }) {
  return (
    <li className="flex gap-2.5">
      <span
        aria-hidden
        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
          signal.schwere === "rot" ? "bg-red-500" : "bg-amber-400"
        }`}
      />
      <span className="text-sm">
        <span className="font-medium text-slate-900">{signal.titel}</span>
        <span className="text-slate-600"> — {signal.schritt}</span>
      </span>
    </li>
  );
}

export default async function MannschaftPage() {
  const user = await requireUser();
  const sicht = await sichtbarkeit(user, "STRUKTUR");

  const heute = berlinToday();
  const heuteStart = dayToUtcDate(heute);
  const wochenStart = startOfWeek(heute);
  const monatsStart = startOfMonth(heute);
  const vierzehnTage = new Date(Date.now() - SCHWELLEN.terminFensterTage * TAG_MS);
  const dreissigTage = new Date(Date.now() - SCHWELLEN.empfehlungTage * TAG_MS);
  const rueckblick = new Date(Date.now() - RUECKBLICK_TAGE * TAG_MS);
  // Eine Abfrage fuer drei Zeitfenster: ab dem fruehesten holen, danach in
  // JavaScript in Woche / 14 Tage / Monat einsortieren.
  const zaehlerAb = new Date(
    Math.min(wochenStart.getTime(), monatsStart.getTime(), vierzehnTage.getTime())
  );

  const [
    berater,
    personen,
    zaehler,
    offeneVorgaenge,
    gewonneneVorgaenge,
    aktivitaeten,
    phasen,
    ueberfaelligeKontakte,
    ueberfaelligeVorgaenge,
    kundenOhneEmpfehlung,
  ] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: sicht.beraterIds } },
      orderBy: { path: "asc" },
      select: {
        id: true,
        name: true,
        path: true,
        startedAt: true,
        visibility: true,
        deactivatedAt: true,
        onboardingDoneAt: true,
        installedAt: true,
        _count: { select: { team: true } },
      },
    }),
    prisma.person.findMany({
      where: { userId: { in: sicht.beraterIds } },
      select: { id: true, userId: true },
    }),
    prisma.dailyLog.groupBy({
      by: ["personId", "type", "date"],
      where: { date: { gte: zaehlerAb }, person: { userId: { in: sicht.beraterIds } } },
      _sum: { count: true },
    }),
    prisma.deal.findMany({
      where: { ...sicht.ueberKontakt, outcome: "OFFEN" },
      select: { units: true, contact: { select: { ownerId: true } } },
    }),
    prisma.deal.findMany({
      where: { ...sicht.ueberKontakt, outcome: "GEWONNEN" },
      select: { units: true, wonLoggedAt: true, contact: { select: { ownerId: true } } },
    }),
    prisma.activity.findMany({
      where: { ...sicht.ueberKontakt, date: { gte: rueckblick } },
      select: { date: true, contact: { select: { ownerId: true } } },
      orderBy: { date: "desc" },
    }),
    prisma.contact.groupBy({
      by: ["ownerId", "stage"],
      where: { ...sicht.kontakte, outcome: { not: "VERLOREN" } },
      _count: { _all: true },
    }),
    prisma.contact.groupBy({
      by: ["ownerId"],
      where: {
        ...sicht.kontakte,
        outcome: "OFFEN",
        nextStepType: { not: null },
        nextStepAt: { lt: heuteStart },
      },
      _count: { _all: true },
    }),
    prisma.deal.findMany({
      where: {
        ...sicht.ueberKontakt,
        outcome: "OFFEN",
        nextStepType: { not: null },
        nextStepAt: { lt: heuteStart },
      },
      select: { contact: { select: { ownerId: true } } },
    }),
    prisma.contact.groupBy({
      by: ["ownerId"],
      where: {
        ...sicht.kontakte,
        outcome: { not: "VERLOREN" },
        stage: "KUNDE",
        updatedAt: { lt: dreissigTage },
      },
      _count: { _all: true },
    }),
  ]);

  // Der Wettbewerb zaehlt auf die Person, das CRM auf das Konto. Hier laufen
  // beide zusammen.
  const userIdVonPerson = new Map(
    personen.filter((person) => person.userId).map((person) => [person.id, person.userId!])
  );

  type Werte = {
    anrufeWoche: number;
    vereinbartWoche: number;
    gehaltenWoche: number;
    vereinbart14: number;
    gehalten14: number;
    gehaltenMonat: number;
    offeneEinheiten: number;
    abschluesseMonat: number;
    einheitenMonat: number;
    abschluesseGesamt: number;
    letzteAktivitaet: Date | null;
    inAkquise: number;
    ueberfaellig: number;
    kundenOhneEmpfehlung: number;
  };
  const leer = (): Werte => ({
    anrufeWoche: 0,
    vereinbartWoche: 0,
    gehaltenWoche: 0,
    vereinbart14: 0,
    gehalten14: 0,
    gehaltenMonat: 0,
    offeneEinheiten: 0,
    abschluesseMonat: 0,
    einheitenMonat: 0,
    abschluesseGesamt: 0,
    letzteAktivitaet: null,
    inAkquise: 0,
    ueberfaellig: 0,
    kundenOhneEmpfehlung: 0,
  });
  const werte = new Map<string, Werte>(berater.map((person) => [person.id, leer()]));
  const fuer = (ownerId: string | null) => (ownerId ? werte.get(ownerId) : undefined);

  for (const zeile of zaehler) {
    const eintrag = fuer(userIdVonPerson.get(zeile.personId) ?? null);
    if (!eintrag) continue;
    const summe = zeile._sum.count ?? 0;
    const zeit = zeile.date.getTime();
    const inWoche = zeit >= wochenStart.getTime();
    const in14 = zeit >= vierzehnTage.getTime();
    const imMonat = zeit >= monatsStart.getTime();

    if (zeile.type === "CALL" && inWoche) eintrag.anrufeWoche += summe;
    if (zeile.type === "APPOINTMENT_SET") {
      if (inWoche) eintrag.vereinbartWoche += summe;
      if (in14) eintrag.vereinbart14 += summe;
    }
    if (zeile.type === "APPOINTMENT_HELD") {
      if (inWoche) eintrag.gehaltenWoche += summe;
      if (in14) eintrag.gehalten14 += summe;
      if (imMonat) eintrag.gehaltenMonat += summe;
    }
  }

  for (const vorgang of offeneVorgaenge) {
    const eintrag = fuer(vorgang.contact.ownerId);
    if (eintrag) eintrag.offeneEinheiten += vorgang.units ?? 0;
  }

  for (const vorgang of gewonneneVorgaenge) {
    const eintrag = fuer(vorgang.contact.ownerId);
    if (!eintrag) continue;
    eintrag.abschluesseGesamt += 1;
    if (vorgang.wonLoggedAt && vorgang.wonLoggedAt >= monatsStart) {
      eintrag.abschluesseMonat += 1;
      eintrag.einheitenMonat += vorgang.units ?? 0;
    }
  }

  // Absteigend sortiert, der erste Treffer je Konto ist damit der juengste.
  for (const aktivitaet of aktivitaeten) {
    const eintrag = fuer(aktivitaet.contact.ownerId);
    if (eintrag && !eintrag.letzteAktivitaet) eintrag.letzteAktivitaet = aktivitaet.date;
  }

  for (const zeile of phasen) {
    const eintrag = fuer(zeile.ownerId);
    if (eintrag && (zeile.stage === "NEU" || zeile.stage === "KONTAKTIERT")) {
      eintrag.inAkquise += zeile._count._all;
    }
  }

  for (const zeile of ueberfaelligeKontakte) {
    const eintrag = fuer(zeile.ownerId);
    if (eintrag) eintrag.ueberfaellig += zeile._count._all;
  }
  for (const vorgang of ueberfaelligeVorgaenge) {
    const eintrag = fuer(vorgang.contact.ownerId);
    if (eintrag) eintrag.ueberfaellig += 1;
  }

  for (const zeile of kundenOhneEmpfehlung) {
    const eintrag = fuer(zeile.ownerId);
    if (eintrag) eintrag.kundenOhneEmpfehlung = zeile._count._all;
  }

  const zeilen = berater.map((person) => {
    const w = werte.get(person.id) ?? leer();
    const pipelineSichtbar = person.visibility === "PIPELINE";
    const signale = signaleFuer({
      tageSeitAktivitaet: w.letzteAktivitaet ? tageSeit(w.letzteAktivitaet) : null,
      termineVereinbart14: w.vereinbart14,
      termineGehalten14: w.gehalten14,
      termineGehaltenMonat: w.gehaltenMonat,
      abschluesseMonat: w.abschluesseMonat,
      abschluesseGesamt: w.abschluesseGesamt,
      tageDabei: person.startedAt ? tageSeit(person.startedAt) : null,
      pipelineSichtbar,
      kontakteInAkquise: w.inAkquise,
      ueberfaelligeSchritte: w.ueberfaellig,
      kundenOhneEmpfehlung: w.kundenOhneEmpfehlung,
    });
    return { person, w, pipelineSichtbar, signale, ampel: ampelVon(signale) };
  });

  const brauchtDich = zeilen.filter((zeile) => zeile.ampel === "rot").length;
  const fuehrtNiemanden = berater.length <= 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className={pageTitle}>Mannschaft</h1>
        <p className="mt-1 text-sm text-slate-500">
          {brauchtDich > 0
            ? `${brauchtDich} ${brauchtDich === 1 ? "Person braucht" : "Personen brauchen"} dich heute.`
            : "Nichts Dringendes. Zahlen deiner Struktur im Überblick."}{" "}
          <strong className="font-medium text-slate-600">Keine Kundennamen:</strong> die
          siehst du nur, wenn ein Berater dir einen Kontakt einzeln freigibt.
        </p>
      </div>

      {fuehrtNiemanden && (
        <div className={`${card} p-6`}>
          <p className="text-sm font-medium text-slate-900">Noch niemand in deiner Struktur</p>
          <p className="mt-1 text-sm text-slate-600">
            Unter{" "}
            <Link href="/einladen" className="font-medium text-navy-700 hover:underline">
              Einladen
            </Link>{" "}
            erzeugst du einen Link oder QR-Code — wer ihn einlöst, hängt automatisch
            unter dir. Bis dahin steht hier nur deine eigene Zeile.
          </p>
        </div>
      )}

      <ul className="space-y-3">
        {zeilen.map(({ person, w, pipelineSichtbar, signale, ampel }) => (
          <li key={person.id} className={`${card} p-4 sm:p-5`}>
            <div
              className="flex flex-wrap items-baseline gap-x-3 gap-y-1"
              style={{ paddingLeft: `${Math.min(ebene(person.path), 4) * 12}px` }}
            >
              <span className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={`h-2.5 w-2.5 rounded-full ${ampelFarben[ampel]}`}
                />
                <span className="text-sm font-semibold text-slate-900">{person.name}</span>
                <span className="sr-only">{ampelTexte[ampel]}</span>
              </span>
              {person.id === user.id && (
                <span className="text-xs text-slate-400">du</span>
              )}
              {/* Frisch durch den Start: der Moment, in dem ein Anruf der
                  Fuehrungskraft am meisten wert ist. */}
              {person.onboardingDoneAt &&
                tageSeit(person.onboardingDoneAt) <= 2 &&
                person.id !== user.id && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                    {tageSeit(person.onboardingDoneAt) === 0
                      ? "heute gestartet"
                      : "frisch gestartet"}
                  </span>
                )}
              {/* Wer die App nicht auf dem Handy hat, loggt nicht unterwegs -
                  und faellt still. Das gehoert neben die Ampel. */}
              {person.installedAt === null && person.id !== user.id && (
                <span className="text-[11px] text-slate-400">noch im Browser</span>
              )}
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
                  ? `zuletzt aktiv ${datumKurz.format(w.letzteAktivitaet)}`
                  : `seit über ${RUECKBLICK_TAGE} Tagen keine Aktivität`}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
              <Kennzahl wert={w.anrufeWoche} bezeichnung="Anrufe (Woche)" />
              <Kennzahl wert={w.vereinbartWoche} bezeichnung="Termine vereinbart" />
              <Kennzahl wert={w.gehaltenWoche} bezeichnung="Termine gehalten" />
              <Kennzahl wert={w.offeneEinheiten} bezeichnung="Einheiten offen" />
              <Kennzahl wert={w.abschluesseMonat} bezeichnung="Abschlüsse (Monat)" betont />
              <Kennzahl wert={w.einheitenMonat} bezeichnung="Einheiten (Monat)" betont />
              {pipelineSichtbar && (
                <>
                  <Kennzahl wert={w.inAkquise} bezeichnung="in Akquise" />
                  <Kennzahl wert={w.ueberfaellig} bezeichnung="überfällig" />
                </>
              )}
            </div>

            {signale.length > 0 && (
              <ul className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                {signale.map((signal) => (
                  <SignalZeile key={signal.schluessel} signal={signal} />
                ))}
              </ul>
            )}

            {!pipelineSichtbar && (
              <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-400">
                {person.name} zeigt nur Zahlen, keine Pipeline. Signale zu Bestand,
                Fristen und Empfehlungen bleiben deshalb aus.
              </p>
            )}
          </li>
        ))}
      </ul>

      <p className={kicker}>
        Woche ab Montag, Monat ab dem Ersten, beides nach Berliner Kalender. Signale
        werden bei jedem Aufruf neu berechnet und nirgends gespeichert.
      </p>
    </div>
  );
}
