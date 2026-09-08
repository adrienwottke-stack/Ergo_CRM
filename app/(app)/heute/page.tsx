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
  hasTimeOfDay,
  utcToBerlinLocalInput,
  type DueState,
} from "@/lib/dates";
import { NACHFUELL_SCHWELLE } from "@/lib/namelist";
import { liegtLabel, liegtSeit } from "@/lib/liegenbleiber";
import { herkunftAusQuelle } from "@/lib/empfehlungen";
import { faelligeAufgaben, fuehrungsSchritt, mannschaftsLage } from "@/lib/fuehrung";
import FuehrungsAufgabe from "@/components/FuehrungsAufgabe";
import StageBadge from "@/components/StageBadge";
import NextStepBadge from "@/components/NextStepBadge";
import QuickRowActions from "@/components/QuickRowActions";
import type { ContactLite } from "@/components/ContactActionDialog";
import StartHinweis from "@/components/StartHinweis";
import { startOptions } from "@/lib/start/settings";
import ErsteWoche from "@/components/ErsteWoche";
import Meldungen from "@/components/Meldungen";
import Postfach from "@/components/Postfach";
import NummerHinterlegen from "@/components/NummerHinterlegen";
import { card, chip, flaeche } from "@/components/ui";
import SeitenKopf from "@/components/SeitenKopf";
import LeerZustand from "@/components/LeerZustand";
import ZahlHoch from "@/components/ZahlHoch";
import { KennzahlKachel } from "@/components/Kennzahl";
import { CheckIcon, ChevronRightIcon, PhoneIcon, SparkIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

const kurzDatum = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Europe/Berlin",
});

// Dringlichkeit als Kante links an der Karte. Vorher hatte jede Zeile
// denselben grauen Rahmen - ob sie seit einer Woche liegt oder erst naechsten
// Freitag ansteht, sah gleich aus. Die Kante beantwortet das, bevor man liest.
const kanteJeFaelligkeit: Record<DueState, string> = {
  overdue: "border-l-4 border-l-red-400",
  today: "border-l-4 border-l-navy-400",
  week: "border-l-4 border-l-slate-200",
  later: "border-l-4 border-l-slate-200",
};

export default async function HeutePage() {
  const user = await requireUser();

  // Die App war heute offen - das ist einen Punkt wert (lib/anwesenheit.ts).
  //
  // Hier und nicht in login(): das Sitzungs-Cookie lebt 30 Tage, eine echte
  // Anmeldung passiert ein paar Mal im Jahr. "Einloggen" heisst in Wahrheit
  // "die App aufmachen", und dort landen alle Wege - nach der Anmeldung, vom
  // Startbildschirm und jeden Morgen.
  //
  // In after(): der Rueckruf laeuft NACH der ausgelieferten Antwort. Kostet
  // den Nutzer keine Millisekunde und kann die Seite nicht mehr kippen.
  after(() => merkeAnwesenheit(user.id));

  const sicht = eigene(user.id);
  const today = berlinToday();
  const horizon = addDays(dayToUtcDate(today), 8);

  const [contacts, orphans, offeneNamen, meineFuehrung, gefuehrte, nachrichten] =
    await Promise.all([
    prisma.contact.findMany({
      where: {
        ...sicht.kontakte,
        nextStepType: { not: null },
        nextStepAt: { lt: horizon },
      },
      orderBy: { nextStepAt: "asc" },
      // Die letzte Aktivitaet gleich mitnehmen: vor einem Anruf will man
      // wissen, was beim letzten Mal war – ohne dafuer ins Profil zu springen.
      include: {
        activities: {
          orderBy: { date: "desc" },
          take: 1,
          select: { text: true, date: true },
        },
      },
    }),
    // Ohne naechsten Schritt: faellt sonst durchs Raster. Wer die Schleife
    // durch hat, ist kein Versaeumnis.
    prisma.contact.findMany({
      where: {
        ...sicht.kontakte,
        nextStepType: null,
        outcome: { not: "VERLOREN" },
        stage: { not: "ABSCHLUSS" },
      },
      // Die aeltesten zuerst - und ab jetzt nach echtem Fortschritt sortiert,
      // nicht nach updatedAt. Eine nachgetragene Nummer hat einen Namen
      // bisher an das Ende der Liste geschoben, als waere etwas passiert.
      orderBy: { lastProgressAt: "asc" },
    }),
    // Nachschub-Stand: was noch zu arbeiten ist, nicht was je gesammelt wurde.
    prisma.contact.count({
      where: {
        ...sicht.kontakte,
        listKinds: { isEmpty: false },
        outcome: "OFFEN",
        stage: { in: ["NEU", "KONTAKTIERT"] },
      },
    }),
    // Wer ueber mir haengt - fuer die Frage nach der eigenen Nummer. Ohne
    // Fuehrungskraft gibt es niemanden, der anrufen wuerde, also wird auch
    // nicht gefragt.
    user.phone === null && user.leaderId
      ? prisma.user.findUnique({
          where: { id: user.leaderId },
          select: { name: true },
        })
      : Promise.resolve(null),
    // Fuehrungskraft ist eine Position, keine Rolle: wer Direkte hat, fuehrt.
    // Billige Zaehlung vorweg, damit die teure Mannschafts-Rechnung nur bei
    // denen laeuft, fuer die sie ueberhaupt etwas anzeigt.
    prisma.user.count({ where: { leaderId: user.id, deactivatedAt: null } }),
    // Was Kollegen und die eigene Fuehrungskraft geschrieben haben.
    //
    // Bis hierhin lagen Nachrichten ausschliesslich in der Arena. Wer aus der
    // Mannschaft heraus schrieb ("Ich komme zu deinem naechsten Termin mit"),
    // schickte sie damit an eine Stelle, die der Empfaenger vielleicht am
    // Freitag oeffnet. Eine Nachricht, die niemand liest, ist keine Handlung.
    //
    // Bewusst nach Zeitfenster und NICHT nach "ungelesen": das Ansehen setzt
    // den Haken, und eine Abfrage auf ungelesen haette den Stapel im selben
    // Wimpernschlag wieder ausgeblendet - gelesen hatte ihn dann niemand.
    prisma.nachricht.findMany({
      where: { anId: user.id, createdAt: { gte: new Date(Date.now() - 3 * 86_400_000) } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, text: true, gelesenAt: true, von: { select: { name: true } } },
    }),
  ]);

  // Emil oeffnet die App morgens im Auto und landet hier - nicht auf
  // /mannschaft. Bis hierhin erfuhr er von einem stillen Partner erst, wenn er
  // von sich aus nachsah. Eine Zeile, nicht mehr: wer, und der naechste Schritt.
  const [lage, aufgaben] =
    gefuehrte > 0
      ? await Promise.all([mannschaftsLage(user), faelligeAufgaben(user.id)])
      : [null, []];
  const brauchenDich = lage?.dringend.filter((person) => person.ampel === "rot") ?? [];

  // Faellige Fuehrungsaufgaben gehoeren in dieselben Gruppen wie die
  // Kundenschritte - eine Fuehrungskraft hat EINE Liste. Was ueberfaellig ist,
  // steht oben; was heute faellig ist, bei heute.
  const aufgabenJe: Record<DueState, typeof aufgaben> = {
    overdue: aufgaben.filter((aufgabe) => aufgabe.ueberfaellig),
    today: aufgaben.filter((aufgabe) => !aufgabe.ueberfaellig),
    week: [],
    later: [],
  };

  type Row = { at: Date; due: DueState; data: (typeof contacts)[number] };

  const rows: Row[] = contacts.map((data) => ({
    at: data.nextStepAt!,
    due: dueState(data.nextStepAt!, today),
    data,
  }));

  const groups: { key: DueState; title: string; hint: string; rows: Row[] }[] = [
    {
      key: "overdue",
      title: "Überfällig",
      hint: "Zuerst abarbeiten",
      rows: rows.filter((row) => row.due === "overdue"),
    },
    {
      key: "today",
      title: "Heute",
      hint: "Dein Tagespensum",
      rows: rows.filter((row) => row.due === "today"),
    },
    {
      key: "week",
      title: "Diese Woche",
      hint: "Kommt auf dich zu",
      rows: rows.filter((row) => row.due === "week"),
    },
  ];

  // Das Tagespensum: was JETZT dran ist, nach Art getrennt. Ueberfaellig und
  // heute zaehlen zusammen - ein Anruf von gestern ist heute ein Anruf.
  const jetzt = [...groups[0]!.rows, ...groups[1]!.rows];
  const anrufeHeute = jetzt.filter(
    (row) => row.data.nextStepType === "ANRUF"
  ).length;
  const termineHeute = jetzt.filter(
    (row) => row.data.nextStepType === "TERMIN"
  ).length;
  const sonstigeHeute = jetzt.length - anrufeHeute - termineHeute;
  const openCount = jetzt.length;
  const startState = (await startOptions()).guidance && !gefuehrte && user.role !== "ADMIN"
    ? await prisma.startProgress.findUnique({where:{userId:user.id}}) : null;
  const activeStart = startState && startState.phase !== "DONE" ? startState : null;
  const urgent = openCount > 0 || aufgaben.length > 0;
  const nachfuellen = !activeStart && offeneNamen < NACHFUELL_SCHWELLE;

  // Liegenbleiber ueber beide Listen: die mit Schritt (ueberfaellig und nie
  // angefasst) und die ohne. Der Balken nennt den aeltesten und zaehlt den
  // Rest - er wiederholt die Liste NICHT, die Plaketten unten tun das schon.
  const liegen = [
    ...rows.map((row) => ({ kontakt: row.data, tage: liegtSeit(row.data) })),
    ...orphans.map((kontakt) => ({ kontakt, tage: liegtSeit(kontakt) })),
  ]
    .filter((eintrag): eintrag is { kontakt: typeof eintrag.kontakt; tage: number } =>
      eintrag.tage !== null
    )
    .sort((a, b) => b.tage - a.tage);
  const aeltester = liegen[0];

  return (
    <div className="space-y-6">
      <SeitenKopf kicker="Beraterbereich" titel="Heute" />
      {activeStart && !urgent && <StartHinweis phase={activeStart.phase} />}

      {/* Was jemand geschrieben hat, steht vor der Arbeit - es dauert zehn
          Sekunden und ist der Grund, warum sich das Werkzeug nach Mannschaft
          anfuehlt und nicht nach Verwaltung. */}
      {nachrichten.length > 0 && (
        <Postfach
          nachrichten={nachrichten.map((nachricht) => ({
            id: nachricht.id,
            von: nachricht.von.name,
            text: nachricht.text,
            neu: nachricht.gelesenAt === null,
          }))}
          ungelesen={nachrichten.filter((n) => n.gelesenAt === null).length}
        />
      )}

      {/* Fragt genau einmal und verschwindet danach fuer immer. Es gibt
          bewusst keine Kontoseite dafuer - ein Bildschirm mit einem Feld
          darauf ist ein Bildschirm zu viel. */}
      {meineFuehrung && (
        <NummerHinterlegen fuehrungskraft={meineFuehrung.name.split(" ")[0] ?? meineFuehrung.name} />
      )}

      {/* Fuehrung zuerst, eigenes Geschaeft darunter: ein stiller Partner
          kostet mehr als ein liegengebliebener Anruf. Steht nur da, wenn
          wirklich jemand rot ist - sonst waere es Tapete. */}
      {brauchenDich.length > 0 && (
        <Link
          href="/mannschaft"
          className={`${flaeche("gefahr")} flex items-start gap-3 p-4 transition hover:schatten-hoch sm:p-5`}
        >
          {/* Der einzige Punkt der Anwendung, der pulst. Wer wartet, wartet
              nicht still. */}
          <span
            aria-hidden
            className="mt-1.5 h-2.5 w-2.5 shrink-0 animate-halo rounded-full bg-red-500"
          />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-slate-900">
              {brauchenDich.length === 1
                ? `${brauchenDich[0]!.name} braucht dich`
                : brauchenDich.length === 2
                  ? `${brauchenDich[0]!.vorname} und ${brauchenDich[1]!.vorname} brauchen dich`
                  : `${brauchenDich[0]!.vorname}, ${brauchenDich[1]!.vorname} und ${
                      brauchenDich.length - 2
                    } weitere brauchen dich`}
            </span>
            <span className="mt-0.5 block text-sm text-slate-600">
              {brauchenDich.length === 1
                ? fuehrungsSchritt(brauchenDich[0]!)
                : "Aus deiner Mannschaft. In der Übersicht steht, was jeweils ansteht."}
            </span>
          </span>
          <span aria-hidden className="mt-0.5 shrink-0 text-slate-400">
            <ChevronRightIcon className="h-5 w-5" />
          </span>
        </Link>
      )}

      {/* Beim Oeffnen steht da, was heute zu tun ist - als Zahl, nicht als
          Liste, aus der man erst auswaehlen muss. */}
      <div className={`${card} p-5 sm:p-6`}>
        {openCount === 0 ? (
          <p className="text-base font-semibold text-slate-900">
            {activeStart ? "Heute sind noch keine Anrufe eingeplant." : "Nichts offen – alles abgearbeitet."}
          </p>
        ) : (
          <>
            {/* Die Tagesleistung ist der Grund, warum jemand die Seite
                oeffnet. Sie darf gross sein und beim Ankommen kurz
                hochzaehlen - danach steht sie still. */}
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <ZahlHoch
                wert={anrufeHeute > 0 ? anrufeHeute : openCount}
                className="text-4xl font-bold tracking-[-0.02em] tabular-nums text-navy-700"
              />
              <span className="text-base font-semibold text-slate-900">
                {anrufeHeute > 0
                  ? `${anrufeHeute === 1 ? "Anruf" : "Anrufe"} heute`
                  : `${openCount === 1 ? "Schritt" : "Schritte"} heute`}
              </span>
            </div>

            {/* Vorher eine Zeile mit Mittelpunkten ("3 Termine · 2 weitere ·
                4 ueberfaellig"). Als Kacheln sieht man die Verteilung, statt
                sie zu lesen. */}
            {termineHeute + sonstigeHeute + groups[0]!.rows.length > 0 ? (
              <div className="mt-4 grid grid-cols-3 gap-2">
                <KennzahlKachel
                  wert={termineHeute}
                  bezeichnung={termineHeute === 1 ? "Termin" : "Termine"}
                  ton={termineHeute > 0 ? "info" : "neutral"}
                />
                <KennzahlKachel
                  wert={sonstigeHeute}
                  bezeichnung="weitere Schritte"
                />
                <KennzahlKachel
                  wert={groups[0]!.rows.length}
                  bezeichnung="überfällig"
                  ton={groups[0]!.rows.length > 0 ? "gefahr" : "neutral"}
                />
              </div>
            ) : (
              <p className="mt-1 text-sm text-slate-500">
                Der Reihe nach von oben.
              </p>
            )}
          </>
        )}

        {/* Liegenbleiber: der Name, der zu lange nichts gehoert hat. Steht
            ueber dem Nachfuell-Alarm, weil ein liegender Name der teurere
            Fehler ist - Nachschub holen kann man morgen, einen kalt
            gewordenen Namen nicht zurueckholen. */}
        {aeltester && (
          <div
            className={`${flaeche("gefahr")} mt-4 flex flex-wrap items-center justify-between gap-3 px-4 py-3`}
          >
            <p className="text-sm text-red-900">
              <span className="font-semibold">
                {aeltester.kontakt.name} {liegtLabel(aeltester.tage)}.
              </span>{" "}
              {liegen.length === 1
                ? "Anrufen oder von der Liste nehmen."
                : `Und ${liegen.length - 1} ${
                    liegen.length === 2 ? "weiterer" : "weitere"
                  }. Der älteste zuerst.`}
            </p>
            <Link
              href={`/contacts/${aeltester.kontakt.id}`}
              className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg bg-fest-gefahr px-4 text-sm font-semibold text-white transition hover:bg-fest-gefahr-stark"
            >
              <PhoneIcon className="h-4 w-4" />
              {aeltester.kontakt.name.split(" ")[0]} anrufen
            </Link>
          </div>
        )}

        {/* Nachfuell-Alarm: ohne Namen kein Anruf, egal wie voll der Tag ist. */}
        {nachfuellen && (
          <div
            className={`${flaeche("warnung")} mt-4 flex flex-wrap items-center justify-between gap-3 px-4 py-3`}
          >
            <p className="text-sm text-amber-900">
              <span className="font-semibold">
                {offeneNamen === 0
                  ? "Keine offenen Namen mehr."
                  : `Nur noch ${offeneNamen} offene Namen.`}
              </span>{" "}
              Ohne Nachschub steht die Schleife still.
            </p>
            <Link
              href="/namen/sammeln"
              className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg bg-fest-warnung px-4 text-sm font-semibold text-white transition hover:bg-fest-warnung-stark"
            >
              <SparkIcon className="h-4 w-4" />
              Namen sammeln
            </Link>
          </div>
        )}

        {openCount > 0 && !nachfuellen && (
          <Link
            href="/namen"
            className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-navy-600 transition hover:text-navy-800 hover:underline"
          >
            <PhoneIcon className="h-4 w-4" />
            Lieber am Stück telefonieren? Durchlauf über die Namensliste
          </Link>
        )}
      </div>

      {/* Fragt nur, wenn noch nicht zugestimmt wurde - und erklaert wofuer,
          bevor der Browser fragt. */}
      <Meldungen vapidKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""} />

      {/* Startwoche, Brief, Versprechen, Wiedereinstieg - meldet sich nur,
          wenn einer dieser Momente wirklich ansteht. */}
      {activeStart ? <details className="text-sm"><summary className="min-h-11 cursor-pointer text-slate-500">Deine erste Woche und dein Ziel</summary><ErsteWoche user={user} /></details> : <ErsteWoche user={user} />}

      {rows.length === 0 && orphans.length === 0 && aufgaben.length === 0 && !activeStart ? (
        <LeerZustand
          ton="erfolg"
          symbol={<CheckIcon className="h-6 w-6" />}
          titel="Keine offenen Schritte"
          text={
            <>
              Neue Namen sammelst du in der{" "}
              <Link
                href="/namen"
                className="font-medium text-navy-600 hover:underline"
              >
                Namensliste
              </Link>
              .
            </>
          }
        >
          {/* Der Willkommens-Ablauf bleibt aufrufbar - zum Vorfuehren am
              Launch-Tag und fuer alle, die ihn weggeklickt haben. */}
          <Link
            href="/willkommen"
            className="text-xs font-medium text-slate-400 hover:text-navy-700 hover:underline"
          >
            Wie das hier gedacht ist — der Start, nochmal
          </Link>
        </LeerZustand>
      ) : (
        groups
          .filter((group) => group.rows.length + aufgabenJe[group.key].length > 0)
          .map((group) => (
            <section key={group.key} className="space-y-3">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-base font-semibold text-slate-900">
                  {group.title}
                  <span className="ml-2 text-sm font-normal text-slate-400">
                    {group.rows.length + aufgabenJe[group.key].length}
                  </span>
                </h2>
                <span className="text-xs text-slate-500">{group.hint}</span>
              </div>

              <ul className="space-y-3">
                {/* Menschen vor Kunden: wenn heute beides ansteht, ist der
                    stille Partner das Teurere. */}
                {aufgabenJe[group.key].map((aufgabe) => (
                  <FuehrungsAufgabe key={aufgabe.id} aufgabe={aufgabe} />
                ))}
                {group.rows.map((row, i) => {
                  const contact = row.data;
                  const liegtSeitTagen = liegtSeit(contact);
                  const lite: ContactLite = {
                    id: contact.id,
                    name: contact.name,
                    phone: contact.phone,
                    stage: contact.stage,
                    outcome: contact.outcome,
                    appointmentLocal: contact.appointmentAt
                      ? utcToBerlinLocalInput(contact.appointmentAt)
                      : null,
                    hasStep: true,
                    referralsAsked: contact.referralsAskedAt !== null,
                  };
                  return (
                    <li
                      key={contact.id}
                      className={`${card} ${kanteJeFaelligkeit[row.due]} animate-rise p-4 transition duration-200 hover:schatten-hoch`}
                      // Die Zeilen laufen leicht versetzt ein. Nur die ersten
                      // acht - danach wuerde man auf die Liste warten.
                      style={
                        i < 8
                          ? ({ "--rise-delay": `${i * 40}ms` } as React.CSSProperties)
                          : undefined
                      }
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <Link
                          href={`/contacts/${contact.id}`}
                          className="text-sm font-semibold text-slate-900 hover:text-navy-700"
                        >
                          {contact.name}
                        </Link>
                        <div className="flex items-center gap-2">
                          {/* Die Faelligkeit sagt "ueberfaellig", aber nicht
                              seit wann. Genau darin liegt der Unterschied
                              zwischen gestern vergessen und vor drei Wochen
                              aufgegeben. */}
                          {liegtSeitTagen !== null && (
                            <span className={chip("gefahr")}>
                              {liegtLabel(liegtSeitTagen)}
                            </span>
                          )}
                          <StageBadge stage={contact.stage} outcome={contact.outcome} />
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <NextStepBadge
                          type={contact.nextStepType!}
                          at={contact.nextStepAt!}
                          state={row.due}
                          withTime={hasTimeOfDay(contact.nextStepAt!)}
                        />
                        {contact.nextStepNote && (
                          <span className="text-xs text-slate-500">
                            {contact.nextStepNote}
                          </span>
                        )}
                      </div>

                      {/* Vorgeschichte in der Zeile statt im Profil. */}
                      {(contact.activities[0] ||
                        contact.note ||
                        herkunftAusQuelle(contact.source)) && (
                        <div className="mt-2 space-y-0.5 border-l-2 border-slate-100 pl-2.5">
                          {/* Zuerst die Herkunft: der Unterschied zwischen
                              einem kalten und einem warmen Anruf steht in
                              diesem einen Satz. */}
                          {herkunftAusQuelle(contact.source) && (
                            <p className="text-xs font-semibold text-amber-800">
                              Empfehlung von {herkunftAusQuelle(contact.source)}
                            </p>
                          )}
                          {contact.activities[0] && (
                            <p className="line-clamp-2 text-xs text-slate-500">
                              <span className="text-slate-400">
                                Zuletzt {kurzDatum.format(contact.activities[0].date)}:
                              </span>{" "}
                              {contact.activities[0].text}
                            </p>
                          )}
                          {contact.note && (
                            <p className="line-clamp-2 text-xs text-amber-800">
                              {contact.note}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="mt-3 border-t border-slate-100 pt-3">
                        <QuickRowActions
                          contact={lite}
                          istAnruf={contact.nextStepType === "ANRUF"}
                          istTermin={contact.nextStepType === "TERMIN"}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
      )}

      {orphans.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900">
              Ohne nächsten Schritt
              <span className="ml-2 text-sm font-normal text-slate-400">
                {orphans.length}
              </span>
            </h2>
            <span className="text-xs text-slate-500">Fällt sonst durchs Raster</span>
          </div>
          <ul className="space-y-3">
            {orphans.slice(0, 25).map((contact) => (
              <li
                key={contact.id}
                className={`${card} border-l-4 border-l-amber-400 p-4 transition duration-200 hover:schatten-hoch`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <Link
                    href={`/contacts/${contact.id}`}
                    className="text-sm font-semibold text-slate-900 hover:text-navy-700"
                  >
                    {contact.name}
                  </Link>
                  <div className="flex items-center gap-2">
                    {liegtSeit(contact) !== null && (
                      <span className={chip("gefahr")}>
                        {liegtLabel(liegtSeit(contact)!)}
                      </span>
                    )}
                    <StageBadge stage={contact.stage} outcome={contact.outcome} />
                  </div>
                </div>
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <QuickRowActions
                    contact={{
                      id: contact.id,
                      name: contact.name,
                      phone: contact.phone,
                      stage: contact.stage,
                      outcome: contact.outcome,
                      appointmentLocal: contact.appointmentAt
                        ? utcToBerlinLocalInput(contact.appointmentAt)
                        : null,
                      hasStep: false,
                      referralsAsked: contact.referralsAskedAt !== null,
                    }}
                    // Ohne Schritt, aber noch in der Akquise: dann ist der
                    // naechste Griff ohnehin das Telefon.
                    istAnruf={
                      contact.stage === "NEU" || contact.stage === "KONTAKTIERT"
                    }
                  />
                </div>
              </li>
            ))}
          </ul>
          {orphans.length > 25 && (
            <p className="text-xs text-slate-500">
              … und {orphans.length - 25} weitere. Die Liste rückt nach, sobald
              die ersten einen Schritt haben.
            </p>
          )}
        </section>
      )}
      {activeStart && urgent && <StartHinweis phase={activeStart.phase} />}
    </div>
  );
}
