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
import { starterpassStand } from "@/lib/starterpass";
import { card, kicker, pageTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

// Wie weit zurueck "letzte Aktivitaet" ueberhaupt gesucht wird. Alles davor
// heisst ohnehin nur noch "lange nichts" - und begrenzt die Abfrage.
const RUECKBLICK_TAGE = 60;
// So lange gilt jemand als "frisch gestartet" - danach ist der Starterpass
// kein Fortschritt mehr, sondern ein Vorwurf.
const STARTERPASS_TAGE = 30;
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
    abschluesse,
    aktivitaeten,
    phasen,
    ueberfaelligeKontakte,
    termineOhneEmpfehlung,
    naechsteSchritte,
    namenJeBerater,
    empfehlungJeBerater,
    zaehlerGesamt,
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
    // Abschluesse seit jeher: Grundlage fuer "dabei, aber noch nie abgeschlossen".
    prisma.dailyLog.groupBy({
      by: ["personId"],
      where: { type: "DEAL_WON", person: { userId: { in: sicht.beraterIds } } },
      _sum: { count: true },
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
    // Nach JEDEM gehaltenen Termin ist die Empfehlungsfrage fällig – nicht
    // erst nach einem Abschluss. Wer sie nie stellt, verschenkt den Motor.
    prisma.contact.groupBy({
      by: ["ownerId"],
      where: {
        ...sicht.kontakte,
        stage: { in: ["TERMIN_GEHALTEN", "ABSCHLUSS"] },
        referralsAskedAt: null,
        updatedAt: { lt: dreissigTage },
      },
      _count: { _all: true },
    }),
    // Der naechste Schritt je Berater: die frueheste offene Faelligkeit. Damit
    // steht in der Uebersicht nicht nur, was war, sondern was ansteht.
    prisma.contact.groupBy({
      by: ["ownerId"],
      where: { ...sicht.kontakte, outcome: "OFFEN", nextStepAt: { not: null } },
      _min: { nextStepAt: true },
    }),
    // --- Starterpass des Neuen ---------------------------------------------
    // Bewusst ohne Zeitfenster: der Pass wird nur bei frisch Gestarteten
    // angezeigt, und fuer die ist "insgesamt" dasselbe wie "seit dem Start".
    prisma.contact.groupBy({
      by: ["ownerId"],
      where: { ...sicht.kontakte, listKinds: { isEmpty: false } },
      _count: { _all: true },
    }),
    prisma.contact.groupBy({
      by: ["ownerId"],
      where: { ...sicht.kontakte, referralsAskedAt: { not: null } },
      _count: { _all: true },
    }),
    prisma.dailyLog.groupBy({
      by: ["personId", "type"],
      where: { person: { userId: { in: sicht.beraterIds } } },
      _sum: { count: true },
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
    abschluesseMonat: number;
    abschluesseGesamt: number;
    letzteAktivitaet: Date | null;
    naechsterSchritt: Date | null;
    inAkquise: number;
    ueberfaellig: number;
    termineOhneEmpfehlung: number;
    /** Fuer den Starterpass des Neuen. */
    namenGesamt: number;
    anrufeGesamt: number;
    vereinbartGesamt: number;
    gehaltenGesamt: number;
    empfehlungGefragt: boolean;
  };
  const leer = (): Werte => ({
    anrufeWoche: 0,
    vereinbartWoche: 0,
    gehaltenWoche: 0,
    vereinbart14: 0,
    gehalten14: 0,
    gehaltenMonat: 0,
    abschluesseMonat: 0,
    abschluesseGesamt: 0,
    letzteAktivitaet: null,
    naechsterSchritt: null,
    inAkquise: 0,
    ueberfaellig: 0,
    termineOhneEmpfehlung: 0,
    namenGesamt: 0,
    anrufeGesamt: 0,
    vereinbartGesamt: 0,
    gehaltenGesamt: 0,
    empfehlungGefragt: false,
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
    if (zeile.type === "DEAL_WON" && imMonat) eintrag.abschluesseMonat += summe;
  }

  for (const zeile of abschluesse) {
    const eintrag = fuer(userIdVonPerson.get(zeile.personId) ?? null);
    if (eintrag) eintrag.abschluesseGesamt += zeile._sum.count ?? 0;
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

  for (const zeile of termineOhneEmpfehlung) {
    const eintrag = fuer(zeile.ownerId);
    if (eintrag) eintrag.termineOhneEmpfehlung = zeile._count._all ?? 0;
  }

  for (const zeile of naechsteSchritte) {
    const eintrag = fuer(zeile.ownerId);
    if (eintrag) eintrag.naechsterSchritt = zeile._min.nextStepAt;
  }

  for (const zeile of namenJeBerater) {
    const eintrag = fuer(zeile.ownerId);
    if (eintrag) eintrag.namenGesamt = zeile._count._all ?? 0;
  }

  for (const zeile of empfehlungJeBerater) {
    const eintrag = fuer(zeile.ownerId);
    if (eintrag) eintrag.empfehlungGefragt = (zeile._count._all ?? 0) > 0;
  }

  for (const zeile of zaehlerGesamt) {
    const eintrag = fuer(userIdVonPerson.get(zeile.personId) ?? null);
    if (!eintrag) continue;
    const summe = zeile._sum.count ?? 0;
    if (zeile.type === "CALL") eintrag.anrufeGesamt += summe;
    if (zeile.type === "APPOINTMENT_SET") eintrag.vereinbartGesamt += summe;
    if (zeile.type === "APPOINTMENT_HELD") eintrag.gehaltenGesamt += summe;
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
      termineOhneEmpfehlung: w.termineOhneEmpfehlung,
    });
    // Der Starterpass steht nur bei frisch Gestarteten und nur, solange er
    // nicht durch ist. Danach waere er eine Zeile, die nichts mehr sagt.
    const tageSeitStart = person.onboardingDoneAt
      ? tageSeit(person.onboardingDoneAt)
      : null;
    const pass =
      tageSeitStart !== null && tageSeitStart <= STARTERPASS_TAGE
        ? starterpassStand({
            namen: w.namenGesamt,
            anrufe: w.anrufeGesamt,
            termineVereinbart: w.vereinbartGesamt,
            termineGehalten: w.gehaltenGesamt,
            empfehlungGefragt: w.empfehlungGefragt,
          })
        : null;

    return {
      person,
      w,
      pipelineSichtbar,
      signale,
      ampel: ampelVon(signale),
      pass: pass && pass.geschafft < pass.gesamt ? pass : null,
    };
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
        {zeilen.map(({ person, w, pipelineSichtbar, signale, ampel, pass }) => (
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
                  ? `zuletzt ${datumKurz.format(w.letzteAktivitaet)}`
                  : `seit über ${RUECKBLICK_TAGE} Tagen nichts`}
                {" · "}
                {w.naechsterSchritt
                  ? `nächster ${datumKurz.format(w.naechsterSchritt)}`
                  : "nichts geplant"}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
              <Kennzahl wert={w.anrufeWoche} bezeichnung="Anrufe (Woche)" />
              <Kennzahl wert={w.vereinbartWoche} bezeichnung="Termine vereinbart" />
              <Kennzahl wert={w.gehaltenWoche} bezeichnung="Termine gehalten" />
              <Kennzahl wert={w.abschluesseMonat} bezeichnung="Abschlüsse (Monat)" betont />
              {pipelineSichtbar && (
                <>
                  <Kennzahl wert={w.inAkquise} bezeichnung="in Akquise" />
                  <Kennzahl wert={w.ueberfaellig} bezeichnung="überfällig" />
                </>
              )}
            </div>

            {/* Der Sponsor sieht denselben Stand wie der Neue selbst auf
                /heute - sonst redet er über Zahlen, die der andere nicht
                kennt. */}
            {pass && (
              <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-3">
                <span className="text-xs font-medium text-slate-500">Starterpass</span>
                <span aria-hidden className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <span
                    className="block h-full rounded-full bg-navy-600"
                    style={{ width: `${(pass.geschafft / pass.gesamt) * 100}%` }}
                  />
                </span>
                <span className="text-xs font-semibold tabular-nums text-slate-700">
                  {pass.geschafft} von {pass.gesamt}
                </span>
              </div>
            )}

            {signale.length > 0 && (
              <ul className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                {signale.map((signal) => (
                  <SignalZeile key={signal.schluessel} signal={signal} />
                ))}
              </ul>
            )}

            {!pipelineSichtbar && (
              <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-400">
                {person.name} zeigt nur Zahlen, keinen Trichter. Signale zu Nachschub,
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
