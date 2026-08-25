import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { astLage, fuehrungsSchritt, type Mannschaftsperson } from "@/lib/fuehrung";
import { ampelFarben, ampelTexte } from "@/lib/signale";
import {
  aufriss,
  letzteSchritte,
  naechsteSchritte,
  verlauf,
  VERLAUF_TAGE,
  type Ereignis,
  type NaechsterSchritt,
} from "@/lib/einblick";
import { nextStepLabels } from "@/lib/pipeline";
import { EinladungNachreichen } from "@/components/PersonAufnehmen";
import { SCHNELLTEXTE_FUEHRUNG } from "@/lib/nachrichten";
import NachrichtSenden from "@/components/NachrichtSenden";
import KuemmereMich from "@/components/KuemmereMich";
import { PhoneIcon } from "@/components/icons";
import { card, kicker, pageTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

const tagKurz = new Intl.DateTimeFormat("de-DE", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  timeZone: "Europe/Berlin",
});

const uhrzeit = new Intl.DateTimeFormat("de-DE", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Berlin",
});

const datumKurz = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Europe/Berlin",
});

/** Farbe traegt Bedeutung: Erfolg gruen, Absage grau, alles dazwischen ruhig. */
const ereignisPunkt: Record<Ereignis["art"], string> = {
  name_notiert: "bg-slate-300",
  abschluss: "bg-emerald-500",
  termin_gehalten: "bg-navy-700",
  termin_vereinbart: "bg-teal-500",
  kontaktiert: "bg-amber-400",
  anruf: "bg-slate-300",
  termin: "bg-slate-400",
  email: "bg-slate-300",
  verloren: "bg-slate-300",
};

/**
 * Die Namen einer Zeile.
 *
 * Bei einer gebuendelten Zeile ("14 Namen aufgeschrieben") sind vier Namen die
 * richtige Menge: genug, dass die Fuehrungskraft erkennt, aus welchem Umfeld
 * die Liste kommt - Familie, Verein, Arbeit -, und wenig genug, dass die Zeile
 * eine Zeile bleibt. Wer alle vierzehn braucht, fuehrt kein Gespraech mehr,
 * sondern kontrolliert.
 */
const NAMEN_IN_ZEILE = 4;

function namensListe(ereignis: Ereignis): string {
  if (ereignis.auch.length === 0) return ereignis.kontakt;
  const alle = [ereignis.kontakt, ...ereignis.auch];
  const sichtbar = alle.slice(0, NAMEN_IN_ZEILE).join(", ");
  const rest = alle.length - NAMEN_IN_ZEILE;
  return rest > 0 ? `${sichtbar} +${rest} weitere` : sichtbar;
}

/**
 * Der Zweizeiler ganz oben.
 *
 * Vorher stand auf der Karte "zuletzt 24.08. · naechster 25.08." - zwei Zahlen
 * ohne Inhalt. Wer daraufhin anruft, faengt das Gespraech mit einer Frage an,
 * deren Antwort in seiner eigenen Datenbank steht.
 */
function SchrittZeile({
  marke,
  text,
  ton = "normal",
}: {
  marke: string;
  text: string;
  ton?: "normal" | "warnung" | "still";
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
      <span className="w-28 shrink-0 text-11 font-semibold uppercase tracking-wider text-slate-400">
        {marke}
      </span>
      <span
        className={`text-sm ${
          ton === "warnung"
            ? "font-medium text-amber-700"
            : ton === "still"
              ? "text-slate-500"
              : "text-slate-900"
        }`}
      >
        {text}
      </span>
    </div>
  );
}

function naechsterText(schritt: NaechsterSchritt): string {
  const wann = schritt.mitUhrzeit
    ? `${tagKurz.format(schritt.wann)} ${uhrzeit.format(schritt.wann)}`
    : tagKurz.format(schritt.wann);
  return `${nextStepLabels[schritt.art]} · ${schritt.kontakt} · ${wann}`;
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
    <div className="min-w-18">
      <p
        className={`text-lg font-semibold tabular-nums ${betont ? "text-navy-700" : "text-slate-900"}`}
      >
        {wert}
      </p>
      <p className="text-xs text-slate-500">{bezeichnung}</p>
    </div>
  );
}

/**
 * Ein Tag im Verlauf.
 *
 * Gruppiert wird nach Tag und nicht am Stueck heruntergeschrieben: eine
 * Fuehrungskraft liest das vor einem Gespraech und braucht "Dienstag lief
 * nichts" als sichtbare Luecke, nicht als fehlende Zeile.
 */
function VerlaufsTag({
  tag,
  ereignisse,
  mitBerater,
  namen,
}: {
  tag: string;
  ereignisse: Ereignis[];
  mitBerater: boolean;
  namen: Map<string, string>;
}) {
  return (
    <li>
      <p className="text-11 font-semibold uppercase tracking-wider text-slate-400">
        {tag}
      </p>
      <ul className="mt-1.5 space-y-1.5">
        {ereignisse.map((ereignis) => (
          <li key={ereignis.id} className="flex flex-wrap items-baseline gap-x-2 text-sm">
            <span
              aria-hidden
              className={`h-2 w-2 shrink-0 self-center rounded-full ${ereignisPunkt[ereignis.art]}`}
            />
            <span className="w-10 shrink-0 tabular-nums text-xs text-slate-400">
              {uhrzeit.format(ereignis.wann)}
            </span>
            <span className="font-medium text-slate-900">{ereignis.was}</span>
            <span className="text-slate-600">{namensListe(ereignis)}</span>
            {ereignis.zusatz && (
              <span className="text-xs text-slate-400">· {ereignis.zusatz}</span>
            )}
            {mitBerater && (
              <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-11 font-medium text-slate-600">
                {namen.get(ereignis.beraterId) ?? "—"}
              </span>
            )}
          </li>
        ))}
      </ul>
    </li>
  );
}

function AstZeile({ person }: { person: Mannschaftsperson }) {
  const w = person.werte;
  return (
    <li>
      <Link
        href={`/mannschaft/${person.id}`}
        className="-mx-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-lg px-2 py-2 transition hover:bg-slate-50"
      >
        <span
          aria-hidden
          className={`h-2 w-2 shrink-0 self-center rounded-full ${ampelFarben[person.ampel]}`}
        />
        <span className="text-sm font-medium text-slate-900">{person.name}</span>
        <span className="sr-only">{ampelTexte[person.ampel]}</span>
        {person.fuehrt > 0 && (
          <span className="rounded-full bg-navy-50 px-2 py-0.5 text-11 text-navy-700">
            führt {person.fuehrt}
          </span>
        )}
        {!person.einblick.offen && (
          <span className="text-11 text-slate-400">nur Zahlen</span>
        )}
        <span className="ml-auto text-xs tabular-nums text-slate-500">
          {w.anrufeWoche} Anrufe · {w.gehaltenWoche} gehalten · {w.abschluesseMonat} Abschl.
        </span>
      </Link>
    </li>
  );
}

export default async function PersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const kopfzeilen = await headers();
  const herkunft = `${kopfzeilen.get("x-forwarded-proto") ?? "http"}://${kopfzeilen.get("host") ?? ""}`;
  const lage = await astLage(user, id);
  if (!lage) notFound();

  const { person, ast, direkte, summe, koepfe, wartende, offen, verdeckt } = lage;
  const fuehrt = ast.length > 0;

  // Der Verlauf umfasst die Person UND ihren Ast - aber nur die, deren Namen
  // offen sind. Wer zu ist, faellt aus der Abfrage, nicht erst aus der
  // Anzeige: was nicht geholt wird, kann auch nicht durchrutschen.
  const offeneIds = offen.map((eintrag) => eintrag.id);
  // Der Zweizeiler oben zeigt IHN, nicht seinen Ast - sonst stuende bei einer
  // Fuehrungskraft der Termin eines Untergebenen als ihr eigener da.
  const nurEr = person.einblick.offen ? [person.id] : [];
  const [ereignisse, offeneSachen, zuletztJe, naechstesJe] = await Promise.all([
    verlauf(offeneIds),
    aufriss(offeneIds),
    letzteSchritte(nurEr),
    naechsteSchritte(nurEr),
  ]);
  const zuletzt = zuletztJe.get(person.id) ?? null;
  const naechstes = naechstesJe.get(person.id) ?? null;

  const namen = new Map([person, ...ast].map((eintrag) => [eintrag.id, eintrag.vorname]));
  // Ein Herkunftsschild je Zeile lohnt sich erst, wenn mehr als einer liefert.
  const mitBerater = offeneIds.length > 1;

  // Nach Berliner Kalendertag buendeln, Reihenfolge bleibt absteigend.
  const tage: { tag: string; ereignisse: Ereignis[] }[] = [];
  for (const ereignis of ereignisse) {
    const tag = tagKurz.format(ereignis.wann);
    const letzter = tage[tage.length - 1];
    if (letzter && letzter.tag === tag) letzter.ereignisse.push(ereignis);
    else tage.push({ tag, ereignisse: [ereignis] });
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/mannschaft" className="text-13 font-medium text-navy-700 hover:underline">
          ← Mannschaft
        </Link>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span
            aria-hidden
            className={`h-3 w-3 rounded-full ${ampelFarben[person.ampel]}`}
          />
          <h1 className={pageTitle}>{person.name}</h1>
          <span className="sr-only">{ampelTexte[person.ampel]}</span>
          {person.ueber && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              über {person.ueber}
            </span>
          )}
          {person.ausgetreten && <span className="text-xs text-slate-400">ausgetreten</span>}
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {person.tageDabei !== null ? `${person.tageDabei} Tage dabei` : "Eintritt unbekannt"}
          {fuehrt && ` · führt ${ast.length} ${ast.length === 1 ? "Person" : "Personen"}`}
          {" · "}
          {person.einblick.hinweis}
        </p>
      </div>

      {/* --- Zuletzt und als Naechstes ---------------------------------------
          Ganz oben, noch vor dem eigenen Schritt: das ist die Auskunft, wegen
          der man den Namen ueberhaupt angetippt hat. */}
      {person.platzhalter ? (
        <section className={`${card} p-4 sm:p-5`}>
          <h2 className={kicker}>Noch nicht dabei</h2>
          <p className="mt-1.5 text-sm text-slate-600">
            {person.vorname} steht in der Struktur, nutzt die App aber noch nicht.
            Hier bleibt es leer, bis er sein Konto hat — Nullen wären eine
            Behauptung über jemanden, der nie gefragt wurde.
          </p>
          <div className="mt-3">
            <EinladungNachreichen
              fuerId={person.id}
              name={person.vorname}
              vorhandenerCode={person.einladungsCode}
              herkunft={herkunft}
            />
          </div>
        </section>
      ) : (
        <section className={`${card} space-y-2 p-4 sm:p-5`}>
          <SchrittZeile
            marke="Zuletzt"
            ton={zuletzt || person.werte.letzteAktivitaet ? "normal" : "still"}
            text={
              zuletzt
                ? `${zuletzt.was} · ${namensListe(zuletzt)}${zuletzt.zusatz ? ` · ${zuletzt.zusatz}` : ""} · ${tagKurz.format(zuletzt.wann)}`
                : person.werte.letzteAktivitaet
                  ? // Einblick zu: das Datum steht ohnehin in den Zahlen, der
                    // Name nicht.
                    `Aktivität am ${tagKurz.format(person.werte.letzteAktivitaet)}`
                  : "Seit dem Start nichts."
            }
          />
          <SchrittZeile
            marke="Als Nächstes"
            ton={
              naechstes?.ueberfaellig
                ? "warnung"
                : naechstes || person.werte.naechsterSchritt
                  ? "normal"
                  : "still"
            }
            text={
              naechstes
                ? `${naechsterText(naechstes)}${naechstes.ueberfaellig ? " — überfällig" : ""}`
                : person.werte.naechsterSchritt
                  ? `Fällig ${tagKurz.format(person.werte.naechsterSchritt)}`
                  : "Nichts geplant."
            }
          />
        </section>
      )}

      {/* --- Was zu tun ist --------------------------------------------------
          Steht vor allen Zahlen. Wer die Seite oeffnet, hat eine Frage, und
          die Antwort gehoert nicht ans Ende.

          Bei einem Platzhalter faellt das ganze Stueck weg: "Laeuft." waere
          eine Bewertung von jemandem, der nie gefragt wurde, und ein
          Anruf-Knopf zeigte auf eine Nummer, die eine Fuehrungskraft
          eingetragen hat statt er selbst. */}
      {!person.platzhalter && (
      <section className={`${card} p-4 sm:p-5`}>
        <h2 className={kicker}>Dein Schritt</h2>
        <p className="mt-1.5 text-sm text-slate-900">{fuehrungsSchritt(person)}</p>
        {person.betreuung && (
          <p className="mt-1 text-xs font-medium text-amber-700">
            Du wolltest am {datumKurz.format(person.betreuung.faelligAm)} nachfassen
            {person.betreuung.anlass ? ` — Anlass: ${person.betreuung.anlass}` : ""}.
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <NachrichtSenden
            anId={person.id}
            name={person.name}
            schnelltexte={SCHNELLTEXTE_FUEHRUNG}
            variante="knopf"
          />
          {person.telefon && (
            <a
              href={`tel:${person.telefon.replace(/[^+\d]/g, "")}`}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-slate-300 bg-surface px-3.5 text-13 font-medium text-slate-700 transition hover:border-navy-400 hover:bg-navy-50/40 hover:text-navy-800"
            >
              <PhoneIcon className="h-4 w-4" />
              {person.vorname} anrufen
            </a>
          )}
          {person.signale[0] && (
            <KuemmereMich
              memberId={person.id}
              name={person.name}
              anlass={person.signale[0].schluessel}
            />
          )}
        </div>
        {person.signale.length > 0 && (
          <ul className="mt-4 space-y-2 border-t border-slate-100 pt-3">
            {person.signale.map((signal) => (
              <li key={signal.schluessel} className="flex gap-2.5">
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
            ))}
          </ul>
        )}
      </section>

      )}

      {/* --- Zahlen ----------------------------------------------------------
          Bei einer Fuehrungskraft zwei Bloecke nebeneinander: was SIE selbst
          geschafft hat und was ihr Ast geschafft hat. Zusammengerechnet waere
          es dieselbe Verwechslung, die die Rangliste macht - ein Aufbauer
          sieht dann fleissig aus, ohne selbst gearbeitet zu haben.

          Ein Platzhalter hat keine eigenen Zahlen - nur die seines Astes,
          falls schon jemand unter ihm haengt. */}
      {!person.platzhalter && (
      <section className={`${card} p-4 sm:p-5`}>
        <h2 className={kicker}>{person.vorname} selbst</h2>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
          <Kennzahl wert={person.werte.anrufeWoche} bezeichnung="Anrufe (Woche)" />
          <Kennzahl wert={person.werte.vereinbartWoche} bezeichnung="Termine vereinbart" />
          <Kennzahl wert={person.werte.gehaltenWoche} bezeichnung="Termine gehalten" />
          <Kennzahl wert={person.werte.abschluesseMonat} bezeichnung="Abschlüsse (Monat)" betont />
          {person.pipelineSichtbar && (
            <>
              <Kennzahl wert={person.werte.inAkquise} bezeichnung="in Akquise" />
              <Kennzahl wert={person.werte.ueberfaellig} bezeichnung="überfällig" />
            </>
          )}
        </div>

        {fuehrt && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <h2 className={kicker}>
              Ast gesamt — {koepfe} {koepfe === 1 ? "Kopf" : "Köpfe"}
              {wartende > 0 && `, ${wartende} noch nicht dabei`}
            </h2>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
              <Kennzahl wert={summe.anrufeWoche} bezeichnung="Anrufe (Woche)" />
              <Kennzahl wert={summe.vereinbartWoche} bezeichnung="Termine vereinbart" />
              <Kennzahl wert={summe.gehaltenWoche} bezeichnung="Termine gehalten" />
              <Kennzahl wert={summe.abschluesseMonat} bezeichnung="Abschlüsse (Monat)" betont />
              <Kennzahl wert={summe.inAkquise} bezeichnung="in Akquise" />
              <Kennzahl wert={summe.punkteWoche} bezeichnung="Punkte (Woche)" />
            </div>
          </div>
        )}
      </section>

      )}

      {/* Ein Platzhalter mit Leuten darunter: seine eigenen Zahlen gibt es
          nicht, die seines Astes schon. Das ist der Fall "geplante Ebene" -
          die Struktur steht, die Person noch nicht. */}
      {person.platzhalter && fuehrt && (
        <section className={`${card} p-4 sm:p-5`}>
          <h2 className={kicker}>
            Ast unter {person.vorname} — {koepfe} {koepfe === 1 ? "Kopf" : "Köpfe"}
            {wartende > 0 && `, ${wartende} noch nicht dabei`}
          </h2>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
            <Kennzahl wert={summe.anrufeWoche} bezeichnung="Anrufe (Woche)" />
            <Kennzahl wert={summe.gehaltenWoche} bezeichnung="Termine gehalten" />
            <Kennzahl wert={summe.abschluesseMonat} bezeichnung="Abschlüsse (Monat)" betont />
            <Kennzahl wert={summe.punkteWoche} bezeichnung="Punkte (Woche)" />
          </div>
        </section>
      )}

      {/* --- Der Verlauf mit Namen ------------------------------------------ */}
      {!(person.platzhalter && !fuehrt) && (
      <section className={`${card} p-4 sm:p-5`}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className={kicker}>
            {fuehrt ? "Verlauf im Ast" : "Verlauf"} — letzte {VERLAUF_TAGE} Tage
          </h2>
          {verdeckt.length > 0 && (
            <span className="text-xs text-slate-400">
              {verdeckt.length} {verdeckt.length === 1 ? "Person zeigt" : "Personen zeigen"} nur
              Zahlen
            </span>
          )}
        </div>

        {offeneIds.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">
            Hier stehen keine Vornamen. {person.einblick.hinweis}
          </p>
        ) : tage.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">
            In {VERLAUF_TAGE} Tagen ist nichts passiert. Das ist die Auskunft — nicht ein
            fehlender Eintrag.
          </p>
        ) : (
          <ul className="mt-3 space-y-4">
            {tage.map((eintrag) => (
              <VerlaufsTag
                key={eintrag.tag}
                tag={eintrag.tag}
                ereignisse={eintrag.ereignisse}
                mitBerater={mitBerater}
                namen={namen}
              />
            ))}
          </ul>
        )}

        {verdeckt.length > 0 && (
          <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">
            Ohne Namen im Verlauf:{" "}
            {verdeckt.map((eintrag) => eintrag.vorname).join(", ")}. Deren Zahlen stehen
            trotzdem in der Summe oben.
          </p>
        )}
      </section>
      )}

      {/* --- Was ansteht und was liegt --------------------------------------
          Die andere Haelfte: der Verlauf erzaehlt die Vergangenheit, hier
          steht, wo man morgen helfen kann. */}
      {offeneIds.length > 0 &&
        (offeneSachen.termine.length > 0 || offeneSachen.liegt.length > 0) && (
          <div className="grid gap-4 sm:grid-cols-2">
            {offeneSachen.termine.length > 0 && (
              <section className={`${card} p-4 sm:p-5`}>
                <h2 className={kicker}>Termine, die anstehen</h2>
                <ul className="mt-2.5 divide-y divide-slate-100">
                  {offeneSachen.termine.map((eintrag) => (
                    <li
                      key={eintrag.id}
                      className="flex flex-wrap items-baseline gap-x-2 py-2 text-sm"
                    >
                      <span className="font-medium text-slate-900">{eintrag.name}</span>
                      {mitBerater && (
                        <span className="text-11 text-slate-400">
                          {namen.get(eintrag.beraterId) ?? "—"}
                        </span>
                      )}
                      <span className="ml-auto text-xs tabular-nums text-slate-500">
                        {eintrag.wann && `${tagKurz.format(eintrag.wann)} ${uhrzeit.format(eintrag.wann)}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {offeneSachen.liegt.length > 0 && (
              <section className={`${card} p-4 sm:p-5`}>
                <h2 className={kicker}>Liegt länger als eine Woche</h2>
                <ul className="mt-2.5 divide-y divide-slate-100">
                  {offeneSachen.liegt.map((eintrag) => (
                    <li
                      key={eintrag.id}
                      className="flex flex-wrap items-baseline gap-x-2 py-2 text-sm"
                    >
                      <span className="font-medium text-slate-900">{eintrag.name}</span>
                      <span className="text-xs text-slate-500">{eintrag.phase}</span>
                      {mitBerater && (
                        <span className="text-11 text-slate-400">
                          {namen.get(eintrag.beraterId) ?? "—"}
                        </span>
                      )}
                      <span className="ml-auto text-xs tabular-nums text-amber-700">
                        {eintrag.tageOffen} Tage
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

      {/* --- Weiter nach unten ----------------------------------------------
          Direkte prominent, der Rest des Astes darunter. Jede Zeile fuehrt
          eine Ebene tiefer - genau derselbe Bildschirm, eine Stufe weiter. */}
      {fuehrt && (
        <section className={`${card} p-4 sm:p-5`}>
          <h2 className={kicker}>
            {person.vorname}s Direkte ({direkte.length})
          </h2>
          <ul className="mt-1.5 divide-y divide-slate-100">
            {direkte.map((eintrag) => (
              <AstZeile key={eintrag.id} person={eintrag} />
            ))}
          </ul>

          {ast.length > direkte.length && (
            <details className="group mt-4 border-t border-slate-100 pt-3">
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2">
                <span className={kicker}>
                  Tiefer im Ast ({ast.length - direkte.length})
                </span>
                <span className="text-xs text-slate-400 group-open:hidden">anzeigen</span>
                <span className="hidden text-xs text-slate-400 group-open:inline">zuklappen</span>
              </summary>
              <ul className="mt-1.5 divide-y divide-slate-100">
                {ast
                  .filter((eintrag) => !direkte.includes(eintrag))
                  .map((eintrag) => (
                    <AstZeile key={eintrag.id} person={eintrag} />
                  ))}
              </ul>
            </details>
          )}
        </section>
      )}

      <p className={kicker}>
        Vorname ja, alles andere nein: Nachnamen, Notizen, Telefonnummern,
        E-Mail-Adressen und Berufe der Kontakte stehen hier nirgends — auch nicht im
        Startfenster.
      </p>
    </div>
  );
}
