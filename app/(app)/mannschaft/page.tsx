import Link from "next/link";
import { requireUser } from "@/lib/auth";
import {
  RUECKBLICK_TAGE,
  astVergleich,
  fuehrungsSchritt,
  mannschaftsLage,
  type Mannschaftsperson,
} from "@/lib/fuehrung";
import { berlinToday, dayToUtcDate } from "@/lib/dates";
import { ampelFarben, ampelTexte, type Signal } from "@/lib/signale";
import { NAMENSFENSTER_TAGE } from "@/lib/einblick";
import { SCHNELLTEXTE_FUEHRUNG } from "@/lib/nachrichten";
import NachrichtSenden from "@/components/NachrichtSenden";
import KuemmereMich from "@/components/KuemmereMich";
import { PhoneIcon } from "@/components/icons";
import { card, kicker, pageTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

const datumKurz = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Europe/Berlin",
});

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

/**
 * Der Name fuehrt eine Ebene tiefer.
 *
 * Die Uebersicht beantwortet "wo fange ich an" - die Antwort ist ein Name, und
 * ab da will man wissen, was dort los ist. Ohne diesen Griff endet die Fuehrung
 * bei der Ampel: man sieht, DASS es hakt, aber nie, WORAN.
 */
function NameLink({
  person,
  klasse,
}: {
  person: Mannschaftsperson;
  klasse: string;
}) {
  return (
    <Link
      href={`/mannschaft/${person.id}`}
      className={`${klasse} rounded transition hover:text-navy-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600`}
    >
      {person.name}
    </Link>
  );
}

/** „über Jonathan" – ohne das sieht eine Ebene-3-Zeile aus wie eine eigene. */
function UeberChip({ person }: { person: Mannschaftsperson }) {
  if (!person.ueber) return null;
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
      über {person.ueber}
    </span>
  );
}

/**
 * „gelesen" / „noch nicht gelesen" nach einer Nachricht.
 *
 * Bis hierhin schrieb die Fuehrungskraft ins Leere: die Nachricht ging raus
 * und sie erfuhr nie, ob sie ankam. Ein Wort, kein Verlauf.
 */
function Gelesen({ person, klasse = "" }: { person: Mannschaftsperson; klasse?: string }) {
  if (person.gelesen === null) return null;
  return (
    <span className={`text-xs text-slate-400 ${klasse}`}>
      {person.gelesen
        ? `${person.vorname} hat deine Nachricht gelesen.`
        : "Deine Nachricht ist noch ungelesen."}
    </span>
  );
}

function Merkmale({ person }: { person: Mannschaftsperson }) {
  return (
    <>
      {person.frischGestartet && (
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
          {person.werte.letzteAktivitaet ? "frisch gestartet" : "heute gestartet"}
        </span>
      )}
      {!person.angekommen && (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
          Start nicht beendet
        </span>
      )}
      {person.angekommen && !person.installiert && (
        <span className="text-[11px] text-slate-400">noch im Browser</span>
      )}
      {person.fuehrt > 0 && (
        <span className="rounded-full bg-navy-50 px-2 py-0.5 text-xs text-navy-700">
          führt {person.fuehrt}
        </span>
      )}
      {person.ausgetreten && (
        <span className="text-xs text-slate-400">ausgetreten</span>
      )}
    </>
  );
}

export default async function MannschaftPage() {
  const user = await requireUser();
  const [lage, aeste] = await Promise.all([
    mannschaftsLage(user),
    astVergleich(user.id),
  ]);
  const heuteStart = dayToUtcDate(berlinToday()).getTime();

  const rot = lage.dringend.filter((person) => person.ampel === "rot");
  const gelb = lage.dringend.filter((person) => person.ampel === "gelb");

  return (
    <div className="space-y-6">
      <div>
        <h1 className={pageTitle}>Mannschaft</h1>
        <p className="mt-1 text-sm text-slate-500">
          {lage.fuehrtNiemanden
            ? "Sobald jemand unter dir hängt, steht hier, wer dich braucht."
            : rot.length > 0
              ? `${rot.length === 1 ? "Einer braucht" : `${rot.length} brauchen`} dich heute${gelb.length > 0 ? `, bei ${gelb.length} hakt es` : ""}.`
              : gelb.length > 0
                ? `Nichts Dringendes. Bei ${gelb.length} ${gelb.length === 1 ? "Person" : "Personen"} hakt es.`
                : "Alles läuft. Nichts, wo du heute hin müsstest."}{" "}
          <strong className="font-medium text-slate-600">Tipp auf einen Namen</strong> — bei
          frisch Gestarteten liest du die ersten {NAMENSFENSTER_TAGE} Tage mit, bei allen
          anderen stehen dort Zahlen.
        </p>
      </div>

      {lage.fuehrtNiemanden && (
        <div className={`${card} p-6`}>
          <p className="text-sm font-medium text-slate-900">Noch niemand in deiner Struktur</p>
          <p className="mt-1 text-sm text-slate-600">
            Unter{" "}
            <Link href="/einladen" className="font-medium text-navy-700 hover:underline">
              Einladen
            </Link>{" "}
            erzeugst du einen Link oder QR-Code — wer ihn einlöst, hängt automatisch
            unter dir.
          </p>
        </div>
      )}

      {/* --- Was Emil nirgends sonst bekommt ---------------------------------
          Die Rangliste zaehlt Koepfe gegen Koepfe. Wer aufbaut, sieht dort
          schlechter aus als ein fleissiger Einzelkaempfer. Hier steht, was die
          Mannschaft zusammen geschafft hat - und wie sie gegen die Aeste
          daneben steht. */}
      {!lage.fuehrtNiemanden && aeste?.meiner && (
        <section className={`${card} p-5 sm:p-6`}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className={kicker}>Deine Struktur diese Woche</h2>
            <span className="text-xs text-slate-500">
              {aeste.platz === 1
                ? `vorn — ${aeste.aeste[1] ? `${aeste.meiner.punkte - aeste.aeste[1].punkte} Punkte Vorsprung` : "allein an der Spitze"}`
                : `Platz ${aeste.platz} von ${aeste.aeste.length} · ${aeste.abstand} Punkte zurück`}
            </span>
          </div>
          <p className="mt-1 text-2xl font-bold tabular-nums tracking-[-0.02em] text-navy-900">
            {aeste.meiner.punkte}
            <span className="ml-1.5 text-sm font-medium text-slate-500">
              Punkte aus {aeste.meiner.koepfe} {aeste.meiner.koepfe === 1 ? "Kopf" : "Köpfen"}
            </span>
          </p>
          <ul className="mt-3 space-y-1.5">
            {aeste.aeste.map((ast) => {
              const spitze = aeste.aeste[0]?.punkte ?? 0;
              const breite = spitze > 0 ? Math.max(2, (ast.punkte / spitze) * 100) : 2;
              return (
                <li key={ast.id} className="flex items-center gap-2.5">
                  <span
                    className={`w-24 shrink-0 truncate text-xs ${
                      ast.istMeiner ? "font-semibold text-slate-900" : "text-slate-500"
                    }`}
                  >
                    {ast.istMeiner ? "Deine Leute" : ast.name}
                  </span>
                  <span aria-hidden className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <span
                      className={`block h-full rounded-full ${ast.istMeiner ? "bg-navy-700" : "bg-slate-300"}`}
                      style={{ width: `${breite}%` }}
                    />
                  </span>
                  <span
                    className={`w-10 shrink-0 text-right text-xs tabular-nums ${
                      ast.istMeiner ? "font-semibold text-slate-900" : "text-slate-500"
                    }`}
                  >
                    {ast.punkte}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* --- Die zehn Sekunden ----------------------------------------------
          Ganz oben steht nicht die Struktur, sondern die Antwort: wen rufe ich
          heute an, und was sage ich ihm. Die Liste bleibt kurz, weil nur rot
          und gelb hier landen. */}
      {rot.length > 0 && (
        <section className="space-y-3">
          <h2 className={kicker}>Heute dran</h2>
          <ul className="space-y-3">
            {rot.map((person) => {
              const oben = person.signale[0]!;
              return (
                <li
                  key={person.id}
                  className={`${card} border-l-4 p-4 sm:p-5 ${
                    person.ampel === "rot" ? "border-l-red-500" : "border-l-amber-400"
                  }`}
                >
                  <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                    <NameLink person={person} klasse="text-base font-semibold text-slate-900" />
                    <UeberChip person={person} />
                    <Merkmale person={person} />
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-slate-900">{oben.titel}</p>
                  <p className="text-sm text-slate-600">{fuehrungsSchritt(person)}</p>
                  {person.signale.length > 1 && (
                    <p className="mt-1 text-xs text-slate-400">
                      {person.signale.length === 2
                        ? "Ein weiterer Punkt steht unten."
                        : `${person.signale.length - 1} weitere Punkte stehen unten.`}
                    </p>
                  )}
                  {/* Steht hier nur, wenn eine Frist schon verstrichen ist:
                      dann hat sich die Fuehrungskraft etwas vorgenommen und es
                      nicht getan. Das gehoert gesagt, nicht verschwiegen. */}
                  {person.betreuung && (
                    <p className="mt-1 text-xs font-medium text-amber-700">
                      Du wolltest am {datumKurz.format(person.betreuung.faelligAm)}{" "}
                      nachfassen.
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {person.ueberId && person.ueber && (
                      <NachrichtSenden
                        anId={person.ueberId}
                        name={person.ueber}
                        schnelltexte={SCHNELLTEXTE_FUEHRUNG}
                        variante="knopf"
                      />
                    )}
                    <NachrichtSenden
                      anId={person.id}
                      name={person.name}
                      schnelltexte={SCHNELLTEXTE_FUEHRUNG}
                      variante="knopf"
                    />
                    {person.telefon && (
                      <a
                        href={`tel:${person.telefon.replace(/[^+\d]/g, "")}`}
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 text-[13px] font-medium text-slate-700 transition hover:border-navy-400 hover:bg-navy-50/40 hover:text-navy-800"
                      >
                        <PhoneIcon className="h-4 w-4" />
                        {person.vorname} anrufen
                      </a>
                    )}
                    {/* Der eine Tipp, nach dem dieser Fall morgen nicht wieder
                        dasteht. Ohne ihn wiederholt sich die Liste, bis sie
                        niemand mehr liest. */}
                    <KuemmereMich
                      memberId={person.id}
                      name={person.name}
                      anlass={oben.schluessel}
                    />
                  </div>
                  <Gelesen person={person} klasse="mt-2 block" />
                  {/* Die Karte muss allein tragen. Wer erst weiterblaettern
                      muss, um zu wissen ob "still" auch "leer" heisst, ruft
                      unvorbereitet an. */}
                  <p className="mt-2.5 text-xs text-slate-500">
                    {[
                      `${person.werte.anrufeWoche} Anrufe diese Woche`,
                      `${person.werte.inAkquise} offene Namen`,
                      person.werte.ueberfaellig > 0 &&
                        `${person.werte.ueberfaellig} überfällig`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* --- Wo du schon dran bist -------------------------------------------
          Nicht weg, nur leise. Wer sich gekuemmert hat, will sehen, dass es
          steht - aber nicht jeden Morgen daran erinnert werden, als haette er
          nichts getan. */}
      {lage.ruhend.length > 0 && (
        <section className={`${card} p-4 sm:p-5`}>
          <h2 className={kicker}>Du kümmerst dich</h2>
          <ul className="mt-2.5 divide-y divide-slate-100">
            {lage.ruhend.map((person) => (
              <li key={person.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 py-2">
                <span
                  aria-hidden
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${ampelFarben[person.ampel]}`}
                />
                <NameLink person={person} klasse="text-sm font-medium text-slate-900" />
                <UeberChip person={person} />
                <span className="text-sm text-slate-500">
                  {person.signale[0]?.titel ?? "läuft"}
                </span>
                <span className="ml-auto text-xs text-slate-400">
                  nachfassen{" "}
                  {person.betreuung && person.betreuung.faelligAm.getTime() < heuteStart + 86_400_000
                    ? "heute"
                    : person.betreuung
                      ? datumKurz.format(person.betreuung.faelligAm)
                      : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Gelb ist kein Notfall, sondern ein Gespraechsthema. Stuende es oben
          zwischen den roten Karten, waere die Liste nach zwei Wochen wieder
          so lang, dass niemand mehr hinsieht - eine Zeile je Person reicht. */}
      {gelb.length > 0 && (
        <section className={`${card} p-4 sm:p-5`}>
          <h2 className={kicker}>Hakt, brennt aber nicht</h2>
          <ul className="mt-2.5 divide-y divide-slate-100">
            {gelb.map((person) => (
              <li
                key={person.id}
                className="flex flex-wrap items-baseline gap-x-2 py-2 text-sm"
              >
                <span aria-hidden className="h-2 w-2 shrink-0 self-center rounded-full bg-amber-400" />
                <NameLink person={person} klasse="font-medium text-slate-900" />
                {person.ueber && (
                  <span className="text-xs text-slate-400">über {person.ueber}</span>
                )}
                <span className="text-slate-600">{person.signale[0]!.titel}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* --- Die ganze Struktur ---------------------------------------------
          Baumreihenfolge, Direkte prominent, Tiefe eingerueckt und mit dem
          Namen der Fuehrungskraft davor. Wer hier steht, ist bereits oben
          abgehandelt - das hier ist zum Nachsehen, nicht zum Entscheiden. */}
      {!lage.fuehrtNiemanden && (
        // Bei sechs Leuten ist die Liste eine Uebersicht, bei zwanzig eine
        // Bleiwueste. Zugeklappt bleibt sie das Nachschlagewerk, das sie ist -
        // entschieden wird oben.
        <details open={lage.baum.length <= 8} className="group space-y-3">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2">
            <h2 className={kicker}>Deine Struktur ({lage.baum.length})</h2>
            <span className="text-xs text-slate-400 group-open:hidden">anzeigen</span>
            <span className="hidden text-xs text-slate-400 group-open:inline">zuklappen</span>
          </summary>
          <ul className="mt-3 space-y-3">
            {lage.baum.map((person) => {
              const w = person.werte;
              const schrittUeberfaellig =
                w.naechsterSchritt !== null && w.naechsterSchritt.getTime() < heuteStart;
              return (
                <li
                  key={person.id}
                  id={`p-${person.id}`}
                  className={`${card} p-4 scroll-mt-24 sm:p-5 ${
                    person.tiefe > 1 ? "border-l-2 border-l-slate-200" : ""
                  }`}
                  style={{ marginLeft: `${Math.min(person.tiefe - 1, 3) * 12}px` }}
                >
                  <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className={`h-2.5 w-2.5 rounded-full ${ampelFarben[person.ampel]}`}
                      />
                      <NameLink person={person} klasse="text-sm font-semibold text-slate-900" />
                      <span className="sr-only">{ampelTexte[person.ampel]}</span>
                    </span>
                    <UeberChip person={person} />
                    <Merkmale person={person} />
                    <span className="ml-auto text-xs text-slate-500">
                      {/* "seit über 60 Tagen nichts" bei jemandem, der gestern
                          dazugekommen ist, ist schlicht falsch - und es ist
                          das Erste, was eine frische Fuehrungskraft liest. */}
                      {w.letzteAktivitaet
                        ? `zuletzt ${datumKurz.format(w.letzteAktivitaet)}`
                        : !person.angekommen
                          ? "noch nicht gestartet"
                          : person.tageDabei !== null && person.tageDabei <= RUECKBLICK_TAGE
                            ? "seit dem Start nichts"
                            : `seit über ${RUECKBLICK_TAGE} Tagen nichts`}
                      {" · "}
                      {w.naechsterSchritt
                        ? `${schrittUeberfaellig ? "offen seit" : "nächster"} ${datumKurz.format(w.naechsterSchritt)}`
                        : "nichts geplant"}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
                    <Kennzahl wert={w.anrufeWoche} bezeichnung="Anrufe (Woche)" />
                    <Kennzahl wert={w.vereinbartWoche} bezeichnung="Termine vereinbart" />
                    <Kennzahl wert={w.gehaltenWoche} bezeichnung="Termine gehalten" />
                    <Kennzahl wert={w.abschluesseMonat} bezeichnung="Abschlüsse (Monat)" betont />
                    {person.pipelineSichtbar && (
                      <>
                        <Kennzahl wert={w.inAkquise} bezeichnung="in Akquise" />
                        <Kennzahl wert={w.ueberfaellig} bezeichnung="überfällig" />
                      </>
                    )}
                  </div>

                  {/* Der Sponsor sieht denselben Stand wie der Neue selbst auf
                      /heute - sonst redet er über Zahlen, die der andere nicht
                      kennt. */}
                  {person.pass && (
                    <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-3">
                      <span className="text-xs font-medium text-slate-500">Starterpass</span>
                      <span aria-hidden className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <span
                          className="block h-full rounded-full bg-navy-600"
                          style={{ width: `${(person.pass.geschafft / person.pass.gesamt) * 100}%` }}
                        />
                      </span>
                      <span className="text-xs font-semibold tabular-nums text-slate-700">
                        {person.pass.geschafft} von {person.pass.gesamt}
                      </span>
                    </div>
                  )}

                  {person.signale.length > 0 && (
                    <ul className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                      {person.signale.map((signal) => (
                        <SignalZeile key={signal.schluessel} signal={signal} />
                      ))}
                    </ul>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                    <NachrichtSenden
                      anId={person.id}
                      name={person.name}
                      schnelltexte={SCHNELLTEXTE_FUEHRUNG}
                      variante="knopf"
                    />
                    {/* Wo geschrieben werden kann, muss auch angerufen werden
                        koennen - der Anruf ist der staerkere Griff, nicht der
                        seltenere. */}
                    {person.telefon && (
                      <a
                        href={`tel:${person.telefon.replace(/[^+\d]/g, "")}`}
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 text-[13px] font-medium text-slate-700 transition hover:border-navy-400 hover:bg-navy-50/40 hover:text-navy-800"
                      >
                        <PhoneIcon className="h-4 w-4" />
                        {person.vorname} anrufen
                      </a>
                    )}
                    <Gelesen person={person} />
                    {!person.pipelineSichtbar && (
                      <p className="ml-auto text-xs text-slate-400">
                        {person.vorname} zeigt nur Zahlen, keinen Trichter.
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </details>
      )}

      {/* --- Das eigene Geschaeft --------------------------------------------
          Stand vorher als erste Karte zwischen den Leuten. Eine Fuehrungskraft
          fuehrt sich nicht selbst: die eigene Zeile gehoert getrennt, sonst
          vermischen sich zwei Arten von Arbeit auf einem Bildschirm. */}
      <section className={`${card} p-4 sm:p-5`}>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className={kicker}>Dein eigenes Geschäft</h2>
          <Link
            href="/heute"
            className="ml-auto text-[13px] font-medium text-navy-700 hover:underline"
          >
            Zu deiner Liste
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
          <Kennzahl wert={lage.ich.werte.anrufeWoche} bezeichnung="Anrufe (Woche)" />
          <Kennzahl wert={lage.ich.werte.vereinbartWoche} bezeichnung="Termine vereinbart" />
          <Kennzahl wert={lage.ich.werte.gehaltenWoche} bezeichnung="Termine gehalten" />
          <Kennzahl wert={lage.ich.werte.abschluesseMonat} bezeichnung="Abschlüsse (Monat)" betont />
          <Kennzahl wert={lage.ich.werte.inAkquise} bezeichnung="in Akquise" />
          <Kennzahl wert={lage.ich.werte.ueberfaellig} bezeichnung="überfällig" />
        </div>
        {lage.ich.signale.length > 0 && (
          <ul className="mt-4 space-y-2 border-t border-slate-100 pt-3">
            {lage.ich.signale.map((signal) => (
              <SignalZeile key={signal.schluessel} signal={signal} />
            ))}
          </ul>
        )}
      </section>

      <p className={kicker}>
        Woche ab Montag, Monat ab dem Ersten, beides nach Berliner Kalender. Signale
        werden bei jedem Aufruf neu berechnet und nirgends gespeichert. Kontaktnamen
        siehst du die ersten {NAMENSFENSTER_TAGE} Tage nach dem Start — danach nur noch,
        wenn jemand seinen Verlauf offen lässt. Notizen, Nummern und Berufe nie.
      </p>
    </div>
  );
}
