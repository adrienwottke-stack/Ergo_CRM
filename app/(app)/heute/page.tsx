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
  hasTimeOfDay,
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
import { eigenerMonatsstand, formatEinheiten, produktionsmonat } from "@/lib/einheiten";
import TerminFrageKarte from "@/components/TerminFrageKarte";
import { schalter } from "@/lib/features";
import { startOptions } from "@/lib/start/settings";
import FuehrungsAufgabe from "@/components/FuehrungsAufgabe";
import VereinbarungenHeute from "@/components/vereinbarungen/VereinbarungenHeute";
import ZielHeute from "@/components/ziele/ZielHeute";
import EinheitenErinnerungen from "@/components/ziele/EinheitenErinnerungen";
import type { ContactLite } from "@/components/ContactActionDialog";
import ErsteWoche from "@/components/ErsteWoche";
import StartHinweis from "@/components/StartHinweis";
import Postfach from "@/components/Postfach";
import { column } from "@/components/ui";
import SeitenKopf from "@/components/SeitenKopf";
import { ArrowRightIcon, TrophyIcon } from "@/components/icons";

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
const kurzerTag = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", timeZone: "Europe/Berlin" });

type Kontakt = ContactLite & {
  nextStepType: string | null;
  nextStepAt: Date | null;
  note: string | null;
  letzteNotiz: string | null;
};

function Arbeitsliste({ kontakte, rueckweg = "/heute" }: { kontakte: Kontakt[]; rueckweg?: string }) {
  return <ul className="crm-list">
    {kontakte.map((k) => <li key={k.id}>
      <Link href={`/contacts/${k.id}?zurueck=${encodeURIComponent(rueckweg)}`} className="crm-list-row">
        <span aria-hidden className="crm-initials">{k.name.trim().split(/\s+/).slice(0, 2).map(teil => teil[0]).join("")}</span>
        <span className="min-w-0 flex-1">
          <span className="crm-contact-name">{k.name}</span>
          <span className="crm-contact-state">{k.nextStepType === "TERMIN" ? "Termin" : k.nextStepType === "ANRUF" ? "Anruf" : "Nächsten Schritt festlegen"}{k.nextStepAt ? ` · ${(hasTimeOfDay(k.nextStepAt) ? zeit : kurzerTag).format(k.nextStepAt)}` : ""}</span>
        </span>
        <span aria-hidden className="text-xl text-ink-muted">›</span>
      </Link>
    </li>)}
  </ul>;
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

export default async function HeutePage({ searchParams }: { searchParams: Promise<{ alle?: string }> }) {
  const user = await requireUser();
  const alle = (await searchParams).alle === "1";
  const rueckweg = alle ? "/heute?alle=1" : "/heute";
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
    einheitenMonat,
  ] = await Promise.all([
    prisma.contact.findMany({
      where: {
        ...sicht.kontakte,
        outcome: { not: "VERLOREN" },
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
        outcome: "OFFEN",
        stage: { not: "ABSCHLUSS" },
      },
      orderBy: { lastProgressAt: "asc" },
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
    eigenerMonatsstand(user.id),
  ]);
  const arbeitslage = arbeitslageFuer(user.arbeitsfokus, aktiveDirekte);
  const [geladeneLage, aufgaben, bericht] = await Promise.all([
    aktiveDirekte > 0 ? mannschaftsLage(user) : null,
    aktiveDirekte > 0 ? faelligeAufgaben(user.id) : [],
    arbeitslage === "FUEHRUNG"
      ? ladeTeamauswertung(user, { zeit: "monat", umfang: "struktur" })
      : null,
  ]);
  // Die Administration sieht in Team die Instanz. Heute begleitet weiterhin
  // nur den eigenen Ast und zählt denselben Umfang wie der Einheitenkopf.
  const eigeneLeute =
    geladeneLage?.leute.filter((person) =>
      person.path.startsWith(geladeneLage.ich.path),
    ) ?? [];
  const lage = geladeneLage
    ? {
        ...geladeneLage,
        leute: eigeneLeute,
        dringend: geladeneLage.dringend.filter((person) =>
          person.path.startsWith(geladeneLage.ich.path),
        ),
      }
    : null;
  const terminFragen = kontakte.filter(
    (kontakt) =>
      kontakt.nextStepType === "TERMIN" &&
      kontakt.appointmentAt !== null &&
      kontakt.appointmentAt < new Date(),
  );
  const terminFragenIds = new Set(terminFragen.map((kontakt) => kontakt.id));
  const jetzt = kontakte.filter((k) =>
    ["overdue", "today"].includes(dueState(k.nextStepAt!, heute)),
  );
  const spaeter = kontakte.filter((k) => !jetzt.includes(k));
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
        href: `/contacts/${naechster.id}?zurueck=${encodeURIComponent(rueckweg)}`,
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
  // Die hervorgehobene Person erscheint nicht noch einmal als nächste Aufgabe.
  const obenGezeigt = !startVorne && arbeitslage !== "FUEHRUNG" ? naechster?.id : null;
  const offeneTerminergebnisse = terminFragen.filter(k => k.id !== obenGezeigt);
  const offeneArbeit = jetzt.filter(k => k.id !== obenGezeigt && !terminFragenIds.has(k.id));
  const betreuung = <div className="space-y-6">
    <VereinbarungenHeute userId={user.id} kompakt auslassenId={arbeitslage === "FUEHRUNG" ? absprachen[0]?.id : undefined} />
    {aufgaben.length > 0 && <section className="space-y-3">
      <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">Betreuungsaufgaben</h2><Link href="/mannschaft" className="inline-flex min-h-11 items-center text-sm text-link">Alle {aufgaben.length}</Link></div>
      <ul className="space-y-3">{aufgaben.slice(0, 3).map(a => <FuehrungsAufgabe key={a.id} aufgabe={a} />)}</ul>
    </section>}
    {brauchenDich.length > 0 && <section className="space-y-3">
      <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">Hier lohnt ein Gespräch</h2><Link href="/mannschaft" className="inline-flex min-h-11 items-center text-sm text-link">Alle {brauchenDich.length}</Link></div>
      <div className="crm-list">{brauchenDich.slice(0, 3).map(p => <Link key={p.id} href={`/mannschaft/${p.istDirekt ? p.id : (p.ueberId ?? p.id)}?zurueck=%2Fheute`} className="crm-list-row">
        <span className="min-w-0 flex-1"><span className="block text-base font-semibold">{p.name}</span><span className="mt-1 block text-sm text-ink-muted">{p.istDirekt || !p.ueber ? fuehrungsSchritt(p) : `Mit ${p.ueber} gemeinsam besprechen.`}</span></span><span aria-hidden className="text-xl text-ink-muted">›</span>
      </Link>)}</div>
    </section>}
  </div>;
  return <div className={`${column} space-y-6`}>
    <SeitenKopf titel="Heute" werkzeuge unterzeile={datum.format(new Date())} />
    {startVorne ? <StartHinweis phase={activeStart.phase} kompakt /> : <section className="space-y-4" aria-labelledby="naechste-handlung">
      <div><p className="text-sm text-ink-muted">{hauptaktion.titel}</p><h2 id="naechste-handlung" className="mt-1 text-2xl font-semibold leading-tight tracking-tight text-ink">{hauptaktion.text}</h2></div>
      <Link href={hauptaktion.href} className="crm-primary-action">{hauptaktion.label}<ArrowRightIcon className="h-5 w-5" /></Link>
    </section>}

    <section className="space-y-3" aria-labelledby="heute-fortschritt">
      <div className="flex items-center justify-between gap-3"><h2 id="heute-fortschritt" className="text-xl font-semibold">Dein Fortschritt</h2><Link href="/fortschritt" className="inline-flex min-h-11 items-center text-sm text-link">Ansehen</Link></div>
      <ZielHeute userId={user.id} />
      {flags.einheiten && <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl bg-surface px-4 py-2">
        <p className="text-sm text-ink-muted"><strong className="text-base font-semibold text-ink">{formatEinheiten(einheitenMonat)}</strong> eigene Einheiten · {produktionsmonat(heute).label}</p>
        <Link href="/einheiten" className="inline-flex min-h-11 items-center text-sm font-medium text-link">Einheiten eintragen →</Link>
      </div>}
      {arbeitslage === "FUEHRUNG" && bericht && <Link href="/mannschaft/auswertung" className="crm-list-row rounded-xl bg-surface"><span className="min-w-0 flex-1"><span className="block text-sm text-ink-muted">Team · dieser Monat</span><span className="block text-xl font-semibold">{formatEinheiten(bericht.team.einheitenZeitraum)} Einheiten</span></span><span aria-hidden className="text-xl text-ink-muted">›</span></Link>}
    </section>

    {(arbeitslage !== "START" || absprachen.length > 0) && betreuung}
    <section className="space-y-3" id="eigene-arbeit">
      <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">{arbeitslage === "FUEHRUNG" ? "Eigene Aufgaben" : "Anrufe und Termine"}</h2><Link href="/kalender" className="inline-flex min-h-11 shrink-0 items-center text-sm text-link">Kalender →</Link></div>
      <TerminFrageKarte fragen={(alle ? offeneTerminergebnisse : offeneTerminergebnisse.slice(0, 3)).map(k => ({contact: lite(k), appointmentAt: k.appointmentAt!}))} />
      {offeneArbeit.length > 0 ? <Arbeitsliste kontakte={(alle ? offeneArbeit : offeneArbeit.slice(0, 3)).map(lite)} rueckweg={rueckweg} /> : offeneTerminergebnisse.length === 0 && <p className="py-2 text-base text-ink-muted">{obenGezeigt ? "Keine weiteren Kontaktschritte für heute." : "Für heute sind keine Kontaktschritte offen."}</p>}
      {!alle && (offeneArbeit.length > 3 || offeneTerminergebnisse.length > 3) && <Link href="/heute?alle=1#eigene-arbeit" className="inline-flex min-h-11 items-center text-sm text-link">Alle {offeneArbeit.length + offeneTerminergebnisse.length} Aufgaben ansehen →</Link>}
      {alle && <Link href="/heute" className="inline-flex min-h-11 items-center text-sm text-link">Zur Tagesübersicht →</Link>}
      {flags.einheiten && <EinheitenErinnerungen userId={user.id} />}
    </section>

    <section className="space-y-3" aria-label="Einstieg und Erfolge">
      {activeStart && !startVorne && <details className="border-t border-line"><summary className="min-h-11 cursor-pointer py-3 text-base font-medium">Deinen Einstieg fortsetzen</summary><StartHinweis phase={activeStart.phase} kompakt /></details>}
      <WettbewerbHeute userId={user.id} />
    </section>
    <details className="border-t border-line" id="weitere-schritte" open={alle}>
      <summary className="min-h-11 cursor-pointer py-3 text-base font-medium">Weitere Schritte</summary>
      <div className="space-y-6 pt-2">
        {spaeter.length > 0 && <section className="space-y-3"><h2 className="text-xl font-semibold">Diese Woche · {spaeter.length}</h2><Arbeitsliste kontakte={(alle ? spaeter : spaeter.slice(0, 3)).map(lite)} rueckweg={rueckweg} />{!alle && spaeter.length > 3 && <Link href="/heute?alle=1#weitere-schritte" className="inline-flex min-h-11 items-center text-sm text-link">Alle {spaeter.length} Schritte ansehen →</Link>}</section>}
        {ohneSchritt.length > 0 && <section className="space-y-3"><h2 className="text-xl font-semibold">Nächsten Schritt festlegen · {ohneSchritt.length}</h2><Arbeitsliste kontakte={(alle ? ohneSchritt : ohneSchritt.slice(0, 3)).map(lite)} rueckweg={rueckweg} />{!alle && ohneSchritt.length > 3 && <Link href="/heute?alle=1#weitere-schritte" className="inline-flex min-h-11 items-center text-sm text-link">Alle {ohneSchritt.length} Kontakte ansehen →</Link>}</section>}
        {arbeitslage !== "FUEHRUNG" && <ErsteWoche user={{...user, pledgeTarget: null, pledgeSetAt: null, pledgeShownAt: null}} />}
      </div>
    </details>
    {nachrichten.length > 0 && <Postfach nachrichten={nachrichten.map(n => ({id: n.id, von: n.von.name, text: n.text, neu: n.gelesenAt === null}))} ungelesen={nachrichten.filter(n => n.gelesenAt === null).length} />}
  </div>;
}
