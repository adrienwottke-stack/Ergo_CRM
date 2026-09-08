import Link from "next/link";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { merkeAnwesenheit } from "@/lib/anwesenheit";
import { eigene } from "@/lib/scope";
import {
  addDays,
  berlinToday,
  dayToUtcDate,
  dueState,
  utcToBerlinLocalInput,
  startOfWeek,
} from "@/lib/dates";
import { arbeitslageFuer } from "@/lib/arbeitslage";
import {
  faelligeAufgaben,
  fuehrungsSchritt,
  mannschaftsLage,
} from "@/lib/fuehrung";
import { ladeHeuteVereinbarungen } from "@/lib/vereinbarungen";
import { ladeTeamauswertung } from "@/lib/team-auswertung";
import { ladeRangliste } from "@/lib/arena";
import { formatEinheiten } from "@/lib/einheiten";
import { schalter } from "@/lib/features";
import { startOptions } from "@/lib/start/settings";
import ArbeitsfokusWahl from "@/components/ArbeitsfokusWahl";
import FuehrungsAufgabe from "@/components/FuehrungsAufgabe";
import VereinbarungenHeute from "@/components/vereinbarungen/VereinbarungenHeute";
import ZielHeute from "@/components/ziele/ZielHeute";
import EinheitenErinnerungen from "@/components/ziele/EinheitenErinnerungen";
import QuickRowActions from "@/components/QuickRowActions";
import type { ContactLite } from "@/components/ContactActionDialog";
import ErsteWoche from "@/components/ErsteWoche";
import StartHinweis from "@/components/StartHinweis";
import Postfach from "@/components/Postfach";
import { card, column, pageTitle } from "@/components/ui";
import {
  ArrowRightIcon,
  PhoneIcon,
  CalendarCheckIcon,
  SparkIcon,
  TrophyIcon,
} from "@/components/icons";

export const dynamic = "force-dynamic";
const datum = new Intl.DateTimeFormat("de-DE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Europe/Berlin",
});
const zeit = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Berlin",
});

type Kontakt = ContactLite & {
  nextStepType: string | null;
  nextStepAt: Date | null;
  note: string | null;
  letzteNotiz: string | null;
};

function Arbeitsliste({ kontakte }: { kontakte: Kontakt[] }) {
  return (
    <ul className="crm-list">
      {kontakte.map((k) => (
        <li key={k.id} className="p-5">
          <div className="flex items-start justify-between gap-3">
            <Link
              href={`/contacts/${k.id}`}
              className="min-h-11 text-lg font-semibold text-ink"
            >
              {k.name}
            </Link>
            {k.nextStepAt && (
              <span className="shrink-0 text-right text-sm text-ink-muted">
                {zeit.format(k.nextStepAt)}
              </span>
            )}
          </div>
          <p className="text-sm text-ink-muted">
            {k.nextStepType === "TERMIN"
              ? "Termin"
              : k.nextStepType === "ANRUF"
                ? "Anruf"
                : k.nextStepType
                  ? "Nächster Schritt"
                  : "Nächsten Schritt festlegen"}
          </p>
          {k.letzteNotiz && (
            <p className="mt-2 line-clamp-2 text-sm text-ink-muted">
              Zuletzt: {k.letzteNotiz}
            </p>
          )}
          <div className="mt-4">
            <QuickRowActions
              contact={k}
              istAnruf={
                k.nextStepType === "ANRUF" ||
                (!k.nextStepType && ["NEU", "KONTAKTIERT"].includes(k.stage))
              }
              istTermin={k.nextStepType === "TERMIN"}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

async function WettbewerbHeute({ userId }: { userId: string }) {
  const person = await prisma.person.findUnique({
    where: { userId },
    select: { id: true },
  });
  const rangliste = person
    ? await ladeRangliste(startOfWeek(berlinToday()))
    : [];
  const index = rangliste.findIndex((e) => e.personId === person?.id);
  const ich = rangliste[index];
  return (
    <Link
      href="/arena"
      className="flex min-h-20 items-center gap-4 rounded-2xl border border-line p-5"
    >
      <TrophyIcon className="h-7 w-7 text-navy-700" />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">Dein Wettbewerb</span>
        <span className="mt-1 block text-sm text-ink-muted">
          {ich
            ? `${ich.punkte} Punkte diese Woche · Platz ${index + 1}`
            : "Deine erste Aktivität bringt dich ins Rennen."}
        </span>
      </span>
      <ArrowRightIcon className="h-5 w-5 text-ink-muted" />
    </Link>
  );
}

export default async function HeutePage() {
  const user = await requireUser();
  after(() => merkeAnwesenheit(user.id));
  const heute = berlinToday();
  const sicht = eigene(user.id);
  const [
    kontakte,
    ohneSchritt,
    namen,
    ohneNummer,
    aktiveDirekte,
    nachrichten,
    absprachen,
    flags,
    startKonfiguration,
    startState,
  ] = await Promise.all([
    prisma.contact.findMany({
      where: {
        ...sicht.kontakte,
        nextStepType: { not: null },
        nextStepAt: { lt: addDays(dayToUtcDate(heute), 8) },
      },
      orderBy: { nextStepAt: "asc" },
      include: {
        activities: {
          orderBy: { date: "desc" },
          take: 1,
          select: { text: true },
        },
      },
    }),
    prisma.contact.findMany({
      where: {
        ...sicht.kontakte,
        nextStepType: null,
        outcome: { not: "VERLOREN" },
        stage: { not: "ABSCHLUSS" },
      },
      orderBy: { lastProgressAt: "asc" },
      take: 25,
      include: {
        activities: {
          orderBy: { date: "desc" },
          take: 1,
          select: { text: true },
        },
      },
    }),
    prisma.contact.count({
      where: {
        ...sicht.kontakte,
        listKinds: { isEmpty: false },
        outcome: "OFFEN",
        stage: { in: ["NEU", "KONTAKTIERT"] },
      },
    }),
    prisma.contact.count({
      where: {
        ...sicht.kontakte,
        listKinds: { isEmpty: false },
        phone: null,
        outcome: "OFFEN",
        stage: { in: ["NEU", "KONTAKTIERT"] },
      },
    }),
    prisma.user.count({
      where: {
        leaderId: user.id,
        deactivatedAt: null,
        passwordHash: { not: null },
      },
    }),
    prisma.nachricht.findMany({
      where: {
        anId: user.id,
        createdAt: { gte: new Date(Date.now() - 3 * 86400000) },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        text: true,
        gelesenAt: true,
        von: { select: { name: true } },
      },
    }),
    ladeHeuteVereinbarungen(user.id),
    schalter("einheiten"),
    startOptions(),
    prisma.startProgress.findUnique({ where: { userId: user.id } }),
  ]);
  const arbeitslage = arbeitslageFuer(user.arbeitsfokus, aktiveDirekte);
  const [lage, aufgaben, bericht] = await Promise.all([
    aktiveDirekte > 0 ? mannschaftsLage(user) : null,
    aktiveDirekte > 0 ? faelligeAufgaben(user.id) : [],
    arbeitslage === "FUEHRUNG"
      ? ladeTeamauswertung(user, { zeit: "monat", umfang: "struktur" })
      : null,
  ]);
  const jetzt = kontakte.filter((k) =>
    ["overdue", "today"].includes(dueState(k.nextStepAt!, heute)),
  );
  const spaeter = kontakte.filter((k) => !jetzt.includes(k));
  const ueberfaellig = jetzt.filter(
    (k) => dueState(k.nextStepAt!, heute) === "overdue",
  );
  const brauchenDich = lage?.dringend.filter((p) => p.ampel === "rot") ?? [];
  const activeStart =
    startKonfiguration.guidance &&
    user.role !== "ADMIN" &&
    startState?.phase !== "DONE"
      ? startState
      : null;
  const dringendeArbeit =
    jetzt.length > 0 ||
    aufgaben.length > 0 ||
    absprachen.length > 0 ||
    brauchenDich.length > 0;
  const startVorne =
    activeStart && !dringendeArbeit && arbeitslage !== "FUEHRUNG";
  const naechster = jetzt.find((k) => k.nextStepType === "TERMIN") ?? jetzt[0];
  const liste = user.startTrack ? `?liste=${user.startTrack}` : "";
  const lite = (k: (typeof kontakte)[number]): Kontakt => ({
    id: k.id,
    name: k.name,
    phone: k.phone,
    stage: k.stage,
    outcome: k.outcome,
    appointmentLocal: k.appointmentAt
      ? utcToBerlinLocalInput(k.appointmentAt)
      : null,
    hasStep: k.nextStepType !== null,
    referralsAsked: k.referralsAskedAt !== null,
    nextStepType: k.nextStepType,
    nextStepAt: k.nextStepAt,
    note: k.note,
    letzteNotiz: k.activities[0]?.text ?? null,
  });
  const eigeneAktion = naechster
    ? {
        titel:
          naechster.nextStepType === "TERMIN"
            ? "Dein nächster Termin"
            : "Dein nächster Schritt",
        text: naechster.name,
        label:
          naechster.nextStepType === "TERMIN"
            ? "Termin bearbeiten"
            : "Kontakt öffnen",
        href: `/contacts/${naechster.id}`,
      }
    : namen === 0
      ? {
          titel: "Alles beginnt mit einem Namen",
          text: "Wen kennst du?",
          label: "Namen sammeln",
          href: `/namen/sammeln${liste}`,
        }
      : ohneNummer === namen
        ? {
            titel: "Mach deine Namen erreichbar",
            text: `${ohneNummer} Nummern ergänzen`,
            label: "Nummern ergänzen",
            href: `/namen/nummern${liste}`,
          }
        : {
            titel: "Der nächste Anruf zählt",
            text: "Zeit für ein Gespräch",
            label: "Anrufe starten",
            href: `/namen/anrufen${liste}`,
          };
  const hauptaktion =
    arbeitslage === "FUEHRUNG"
      ? {
          titel: absprachen.length
            ? "Gemeinsam dran"
            : "Deine Partner im Blick",
          text:
            absprachen[0]?.titel ??
            (brauchenDich.length
              ? `${brauchenDich.length} Partner näher ansehen`
              : "Zeit für dein Team"),
          label: absprachen.length ? "Absprachen ansehen" : "Partner begleiten",
          href: absprachen.length
            ? "/mannschaft/vereinbarungen"
            : "/mannschaft",
        }
      : eigeneAktion;
  const betreuung = (
    <div className="space-y-6">
      <VereinbarungenHeute userId={user.id} />
      {aufgaben.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Deine Betreuungsaufgaben</h2>
          <ul className="space-y-3">
            {aufgaben.map((a) => (
              <FuehrungsAufgabe key={a.id} aufgabe={a} />
            ))}
          </ul>
        </section>
      )}
      {brauchenDich.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Hier lohnt ein Gespräch</h2>
          <div className="crm-list">
            {brauchenDich.slice(0, 3).map((p) => (
              <Link
                key={p.id}
                href={`/mannschaft/${p.istDirekt ? p.id : (p.ueberId ?? p.id)}`}
                className="crm-list-row"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{p.name}</span>
                  <span className="mt-1 block text-sm text-ink-muted">
                    {fuehrungsSchritt(p)}
                    {!p.istDirekt && p.ueber
                      ? ` · Mit ${p.ueber} besprechen`
                      : ""}
                  </span>
                </span>
                <ArrowRightIcon className="h-5 w-5 shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
  return (
    <div className={`${column} space-y-7`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-2 text-sm text-ink-muted">
            {datum.format(new Date())}
          </p>
          <h1 className={pageTitle}>Heute</h1>
        </div>
        <ArbeitsfokusWahl
          wert={user.arbeitsfokus}
          aktiveDirekte={aktiveDirekte}
        />
      </div>
      {startVorne ? (
        <StartHinweis phase={activeStart.phase} />
      ) : (
        <section className="space-y-5 py-2" aria-labelledby="naechste-handlung">
          <div>
            <p className="text-sm font-medium text-ink-muted">
              {hauptaktion.titel}
            </p>
            <h2
              id="naechste-handlung"
              className="mt-2 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
            >
              {hauptaktion.text}
            </h2>
          </div>
          <Link href={hauptaktion.href} className="crm-primary-action">
            {hauptaktion.label}
            <ArrowRightIcon className="h-5 w-5" />
          </Link>
          {arbeitslage !== "FUEHRUNG" && jetzt.length > 0 && (
            <p className="text-sm text-ink-muted">
              {jetzt.length} offene Schritte
              {ueberfaellig.length > 0
                ? ` · ${ueberfaellig.length} überfällig`
                : ""}
            </p>
          )}
        </section>
      )}
      {(arbeitslage !== "START" || absprachen.length > 0) && betreuung}
      {arbeitslage === "FUEHRUNG" && bericht && (
        <Link href="/mannschaft/auswertung" className={`${card} block p-5`}>
          <span className="text-sm text-ink-muted">
            Dein Team · dieser Monat
          </span>
          <span className="mt-2 block text-3xl font-semibold tabular-nums">
            {formatEinheiten(bericht.team.einheitenZeitraum)}{" "}
            <span className="text-base font-normal">Einheiten</span>
          </span>
          <span className="mt-3 block text-sm text-navy-700">
            Entwicklung ansehen →
          </span>
        </Link>
      )}
      <section className="space-y-3" id="eigene-arbeit">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-xl font-semibold">
            {arbeitslage === "FUEHRUNG"
              ? "Dein eigenes Geschäft"
              : "Anrufe und Termine"}
          </h2>
          <Link
            href="/kalender"
            className="inline-flex min-h-11 items-center text-sm text-navy-700"
          >
            Kalender →
          </Link>
        </div>
        {jetzt.length > 0 ? (
          <Arbeitsliste kontakte={jetzt.map(lite)} />
        ) : (
          <p className={`${card} p-5 text-ink-muted`}>
            Für heute sind keine Kontaktschritte offen.
          </p>
        )}
        {spaeter.length > 0 && (
          <details className={`${card} p-5`}>
            <summary className="cursor-pointer py-1 font-medium">
              Diese Woche · {spaeter.length} weitere Schritte
            </summary>
            <div className="mt-4">
              <Arbeitsliste kontakte={spaeter.map(lite)} />
            </div>
          </details>
        )}
        {ohneSchritt.length > 0 && (
          <details className={`${card} p-5`}>
            <summary className="cursor-pointer py-1 font-medium">
              Nächsten Schritt festlegen · {ohneSchritt.length}
              {ohneSchritt.length === 25 ? "+" : ""}
            </summary>
            <div className="mt-4">
              <Arbeitsliste kontakte={ohneSchritt.map(lite)} />
            </div>
          </details>
        )}
      </section>
      {activeStart && !startVorne && arbeitslage !== "FUEHRUNG" && (
        <StartHinweis phase={activeStart.phase} />
      )}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Dein Fortschritt</h2>
        <ZielHeute userId={user.id} />
        {flags.einheiten && (
          <>
            <EinheitenErinnerungen userId={user.id} />
            <Link
              href="/einheiten"
              className="inline-flex min-h-11 items-center font-medium text-navy-700"
            >
              Einheiten eintragen →
            </Link>
          </>
        )}
        <WettbewerbHeute userId={user.id} />
      </section>
      <div className="grid grid-cols-3 gap-2">
        {[
          {
            href: `/namen/sammeln${liste}`,
            label: "Namen sammeln",
            icon: SparkIcon,
          },
          { href: `/namen/anrufen${liste}`, label: "Anrufen", icon: PhoneIcon },
          { href: "/kalender", label: "Termine", icon: CalendarCheckIcon },
        ].map((a) => (
          <Link
            key={a.label}
            href={a.href}
            className="flex min-h-24 flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-surface p-3 text-center text-sm font-medium"
          >
            <a.icon className="h-6 w-6 text-navy-700" />
            {a.label}
          </Link>
        ))}
      </div>
      {arbeitslage === "FUEHRUNG" ? (
        activeStart && (
          <details className={`${card} p-5`}>
            <summary className="min-h-11 cursor-pointer py-2 font-medium text-ink-muted">
              Deinen Einstieg fortsetzen
            </summary>
            <div className="mt-3">
              <StartHinweis phase={activeStart.phase} />
            </div>
          </details>
        )
      ) : (
        <details className={`${card} p-5`}>
          <summary className="min-h-11 cursor-pointer py-2 font-medium text-ink-muted">
            Deine erste Woche und dein Einstieg
          </summary>
          <div className="mt-3">
            <ErsteWoche
              user={{
                ...user,
                pledgeTarget: null,
                pledgeSetAt: null,
                pledgeShownAt: null,
              }}
            />
          </div>
        </details>
      )}
      {nachrichten.length > 0 && (
        <Postfach
          nachrichten={nachrichten.map((n) => ({
            id: n.id,
            von: n.von.name,
            text: n.text,
            neu: n.gelesenAt === null,
          }))}
          ungelesen={nachrichten.filter((n) => n.gelesenAt === null).length}
        />
      )}
    </div>
  );
}
