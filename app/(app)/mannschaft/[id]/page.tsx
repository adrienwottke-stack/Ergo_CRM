import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { astLage, fuehrungsSchritt, tageSeit, type Mannschaftsperson } from "@/lib/fuehrung";
import Ampel from "@/components/Ampel";
import Kennzahl from "@/components/Kennzahl";
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
import PersonEntfernen from "@/components/PersonEntfernen";
import { SCHNELLTEXTE_FUEHRUNG } from "@/lib/nachrichten";
import NachrichtSenden from "@/components/NachrichtSenden";
import KuemmereMich from "@/components/KuemmereMich";
import { PhoneIcon } from "@/components/icons";
import { card, kicker, pageTitle, sectionTitle } from "@/components/ui";
import { berlinToday } from "@/lib/dates";
import {
  eigenerVerlauf,
  produktionsmonat,
  strukturVerlauf,
  type StrukturVerlauf,
  type Verlaufstag,
} from "@/lib/einheiten";
import { eigeneAktivitaeten, type Aktivitaetstag } from "@/lib/aktivitaeten";
import { schalter } from "@/lib/features";
import VerlaufsChart, { type Verlaufsserie } from "@/components/VerlaufsChart";
import { coachingHinweise } from "@/lib/coaching";
import { initialenKuerzel } from "@/lib/vorfuehren";
import VorfuehrProvider from "@/components/VorfuehrProvider";
import VorfuehrSchalter from "@/components/VorfuehrSchalter";
import VorfuehrVerdeckt from "@/components/VorfuehrVerdeckt";
import GpName from "@/components/GpName";

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
      <span className="w-28 shrink-0 text-11 font-semibold uppercase tracking-wider text-ink-soft">
        {marke}
      </span>
      <span
        className={`text-sm ${
          ton === "warnung"
            ? "font-medium text-amber-700"
            : ton === "still"
              ? "text-ink-muted"
              : "text-ink"
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
      <p className="text-11 font-semibold uppercase tracking-wider text-ink-soft">
        {tag}
      </p>
      <ul className="mt-1.5 space-y-1.5">
        {ereignisse.map((ereignis) => (
          <li key={ereignis.id} className="flex flex-wrap items-baseline gap-x-2 text-sm">
            {/* Der Ring trennt den Punkt von der Flaeche dahinter - ohne ihn
                verschwimmen die Farben im Dunkelmodus zu grauen Fusseln. */}
            <span
              aria-hidden
              className={`h-2 w-2 shrink-0 self-center rounded-full ring-2 ring-surface ${ereignisPunkt[ereignis.art]}`}
            />
            <span className="w-10 shrink-0 tabular-nums text-xs text-ink-soft">
              {uhrzeit.format(ereignis.wann)}
            </span>
            <span className="font-medium text-ink">{ereignis.was}</span>
            <span className="text-ink-muted">{namensListe(ereignis)}</span>
            {ereignis.zusatz && (
              <span className="text-xs text-ink-soft">· {ereignis.zusatz}</span>
            )}
            {mitBerater && (
              <span className="ml-auto rounded-full bg-sunken px-2 py-0.5 text-11 font-medium text-ink-muted">
                {namen.get(ereignis.beraterId) ?? "—"}
              </span>
            )}
          </li>
        ))}
      </ul>
    </li>
  );
}

function AstZeile({ person, kurz }: { person: Mannschaftsperson; kurz?: string }) {
  const w = person.werte;
  return (
    <li>
      <Link
        href={`/mannschaft/${person.id}`}
        className="-mx-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-lg px-2 py-2 transition hover:bg-sunken"
      >
        <Ampel ampel={person.ampel} variante="punkt" groesse="klein" className="self-center" />
        <span className="text-sm font-medium text-ink">
          <GpName name={person.name} kurz={kurz} />
        </span>
        {person.fuehrt > 0 && (
          <span className="rounded-full bg-navy-50 px-2 py-0.5 text-11 text-navy-700">
            führt {person.fuehrt}
          </span>
        )}
        {!person.einblick.offen && (
          <span className="text-11 text-ink-soft">nur Zahlen</span>
        )}
        <span className="ml-auto text-xs tabular-nums text-ink-muted">
          {w.anrufeWoche} Anrufe · {w.gehaltenWoche} gehalten · {w.abschluesseMonat} Abschl.
        </span>
      </Link>
    </li>
  );
}

/**
 * Der Sockel der eigenen Einheiten-Linie (AP-19).
 *
 * Mannschaftsperson traegt kein einheitenStart mit - die Selektion in
 * mannschaftsLage() (lib/fuehrung.ts) laedt es nicht, das Feld dort fuer alle
 * Koepfe der Liste anzubauen waere teurer als eine gezielte Abfrage nach
 * dieser einen Spalte fuer GENAU eine Person. Sieht sich die Fuehrungskraft
 * selbst an, steht der Wert schon in `user` (requireUser() laedt den ganzen
 * Datensatz ohne eigene Selektion) - dann entfaellt die Abfrage ganz.
 */
async function eigenerEinheitenStart(
  personId: string,
  betrachter: { id: string; einheitenStart: number }
): Promise<number> {
  if (personId === betrachter.id) return betrachter.einheitenStart;
  const konto = await prisma.user.findUnique({
    where: { id: personId },
    select: { einheitenStart: true },
  });
  return konto?.einheitenStart ?? 0;
}

/**
 * Eigen und Ast disjunkt, Tag fuer Tag und im Sockel: Ast = die ganze
 * Struktur der Person (strukturVerlauf, schliesst die Person selbst ein)
 * MINUS Eigen. Ohne den Abzug zaehlte die eigene Zahl zweimal - einmal in
 * "Eigen", einmal versteckt im Sockel und in den Tagessummen von "Ast".
 *
 * Dieselbe Rechnung wie eigenUndTeam() in app/(app)/mannschaft/page.tsx
 * (AP-17) - hier als eigene, kleine Kopie statt eines gemeinsamen
 * lib-Bausteins: jene Datei ist fuer diesen Auftrag tabu (siehe Datei-
 * Eigentum, docs/emil-feedback-runde-2.md, AP-19), und die Funktion ist klein
 * genug, dass eine zweite Fassung billiger ist als eine neue Abhaengigkeit
 * zwischen zwei Seiten, die unabhaengig voneinander weiterentwickelt werden.
 */
function eigenUndAst(
  eigenSockel: number,
  eigenTage: Verlaufstag[],
  ast: StrukturVerlauf
): Verlaufsserie[] {
  const eigenJeTag = new Map(eigenTage.map((tag) => [tag.tag, tag.hundertstel]));
  return [
    { name: "Eigen", sockel: eigenSockel, tage: eigenTage },
    {
      name: "Ast",
      sockel: ast.sockel - eigenSockel,
      tage: ast.tage.map((tag) => ({
        tag: tag.tag,
        hundertstel: tag.hundertstel - (eigenJeTag.get(tag.tag) ?? 0),
      })),
    },
  ];
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

  // Kurven und Coaching (AP-19): ein Platzhalter hat kein Konto und keine
  // eigene Zahl - die Abfragen entfallen dann ganz, nicht erst ihre Anzeige
  // ("Platzhalter zeigen keine Kurven"). `schalter("einheiten")` ist derselbe
  // Admin-Schalter wie auf /mannschaft; `eigenerEinheitenStart` liefert den
  // Sockel der eigenen Linie fuer den Eigen/Ast-Split (eigenUndAst oben).
  const zeigenKurven = !person.platzhalter;
  const [
    ereignisse,
    offeneSachen,
    zuletztJe,
    naechstesJe,
    einheitenAn,
    eigenVerlauf,
    astVerlauf,
    aktivitaeten,
    einheitenStart,
  ] = await Promise.all([
    verlauf(offeneIds),
    aufriss(offeneIds),
    letzteSchritte(nurEr),
    naechsteSchritte(nurEr),
    zeigenKurven ? schalter("einheiten") : Promise.resolve({ einheiten: false }),
    zeigenKurven ? eigenerVerlauf(person.id) : Promise.resolve<Verlaufstag[]>([]),
    zeigenKurven
      ? strukturVerlauf(person.id)
      : Promise.resolve<StrukturVerlauf>({ sockel: 0, tage: [] }),
    zeigenKurven
      ? eigeneAktivitaeten(person.id)
      : Promise.resolve<{ tage: Aktivitaetstag[] }>({ tage: [] }),
    zeigenKurven ? eigenerEinheitenStart(person.id, user) : Promise.resolve(0),
  ]);
  const zuletzt = zuletztJe.get(person.id) ?? null;
  const naechstes = naechstesJe.get(person.id) ?? null;

  // Nur fuer den Loesch-Dialog: was mitginge, steht dort als Zahl und nicht
  // als Ueberraschung hinterher.
  const eigeneKontakte =
    person.id === user.id
      ? 0
      : await prisma.contact.count({ where: { ownerId: person.id } });

  // --- Verlauf-Kurven (AP-19) --------------------------------------------
  // Einheiten: Eigen/Ast disjunkt (eigenUndAst oben), hinter demselben
  // zeigeEinheiten-Schalter wie auf /mannschaft PLUS "traegt ueberhaupt
  // Zahlen" - sonst zeigte jede leere Struktur eine flache Nulllinie.
  // Aktivitaeten: immer, aus derselben Tagesreihe wie der Coaching-Block
  // unten - eine Abfrage traegt beides.
  const heute = berlinToday();
  const monatStartTag = produktionsmonat(heute).start.toISOString().slice(0, 10);
  const einheitenVorhanden = astVerlauf.sockel !== 0 || astVerlauf.tage.length > 0;
  const zeigeEinheitenKurve = zeigenKurven && einheitenAn.einheiten && einheitenVorhanden;
  // Die zweite Serie "Ast" nur, wenn ueberhaupt ein Ast existiert (fuehrt):
  // ohne Direkte ist strukturVerlauf() identisch mit dem eigenen Verlauf, und
  // eigenUndAst rechnete eine Linie, die auf jedem Tag exakt bei null liegt -
  // eine Kurve, deren zweite Linie nichts zeigt, ist Rauschen, keine Auskunft.
  const einheitenSerien: Verlaufsserie[] | null = zeigeEinheitenKurve
    ? fuehrt
      ? eigenUndAst(einheitenStart, eigenVerlauf, astVerlauf)
      : [{ name: "Eigen", sockel: einheitenStart, tage: eigenVerlauf }]
    : null;
  const aktivitaetenSerien: Verlaufsserie[] = [
    {
      name: "Anrufe",
      sockel: 0,
      tage: aktivitaeten.tage
        .filter((tag) => tag.anrufe !== 0)
        .map((tag) => ({ tag: tag.tag, hundertstel: tag.anrufe })),
    },
    {
      name: "Termine",
      sockel: 0,
      tage: aktivitaeten.tage
        .filter((tag) => tag.vereinbart !== 0)
        .map((tag) => ({ tag: tag.tag, hundertstel: tag.vereinbart })),
    },
  ];

  // --- Coaching-Hinweise (AP-19, N7) --------------------------------------
  // Reine Regeln auf den EIGENEN Tageswerten der Person (nicht des Astes) -
  // das 1:1 handelt von genau diesem Menschen. `stillSeitTage` folgt exakt
  // dem Muster aus mannschaftsLage() (lib/fuehrung.ts): null, wenn es noch
  // nie eine Aktivitaet gab.
  const stillSeitTage = person.werte.letzteAktivitaet
    ? tageSeit(person.werte.letzteAktivitaet)
    : null;
  const coachingSaetze = zeigenKurven
    ? coachingHinweise({ tage: aktivitaeten.tage, stillSeitTage, heute })
    : [];

  // --- Vorfuehr-Kuerzel (AP-19, D17) ---------------------------------------
  // Die Person, ihr ganzer Ast und die eigene Fuehrungskraft darueber (das
  // "über"-Schild im Kopf) - dieselbe Namensmenge, die auf dieser Seite in
  // einer klaren Namensstelle steht (Titel, Listen). Kontaktnamen (Kunden)
  // gehoeren NICHT hierher: fuer sie gibt es keine Zaehlnummer, ihre Bloecke
  // werden stattdessen komplett verdeckt (VorfuehrVerdeckt weiter unten) -
  // Kundennamen sind schutzwuerdiger als Berater-Namen.
  const kurzMap = initialenKuerzel([
    person.name,
    ...ast.map((eintrag) => eintrag.name),
    ...(person.ueber ? [person.ueber] : []),
  ]);

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
    <VorfuehrProvider>
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between gap-3">
          <Link href="/mannschaft" className="text-13 font-medium text-navy-700 hover:underline">
            ← Mannschaft
          </Link>
          <VorfuehrSchalter />
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <Ampel ampel={person.ampel} variante="punkt" groesse="gross" />
          <h1 className={pageTitle}>
            <GpName name={person.name} kurz={kurzMap.get(person.name)} />
          </h1>
          {/* Der Zustand als Wort direkt hinter dem Namen - das ist die
              Antwort auf die Frage, mit der man diese Seite oeffnet. */}
          <Ampel ampel={person.ampel} variante="text" />
          {person.ueber && (
            <span className="rounded-full bg-sunken px-2.5 py-0.5 text-xs font-medium text-ink-muted">
              über <GpName name={person.ueber} kurz={kurzMap.get(person.ueber)} />
            </span>
          )}
          {person.ausgetreten && <span className="text-xs text-ink-soft">ausgetreten</span>}
        </div>
        <p className="mt-1 text-sm text-ink-muted">
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
          <p className="mt-1.5 text-sm text-ink-muted">
            <GpName name={person.vorname} kurz={kurzMap.get(person.name)} /> steht in der
            Struktur, nutzt die App aber noch nicht. Hier bleibt es leer, bis er sein Konto
            hat — Nullen wären eine Behauptung über jemanden, der nie gefragt wurde.
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
        <VorfuehrVerdeckt hinweis="Beim Vorführen ausgeblendet — Zuletzt/Als Nächstes nennt Kontaktnamen.">
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
        </VorfuehrVerdeckt>
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
        <p className="mt-1.5 text-sm text-ink">{fuehrungsSchritt(person)}</p>
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
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3.5 text-13 font-medium text-ink-muted transition hover:bg-sunken hover:text-ink"
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
          <ul className="mt-4 space-y-2 border-t border-line pt-3">
            {person.signale.map((signal) => (
              <li key={signal.schluessel} className="flex gap-2.5">
                <span
                  aria-hidden
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    signal.schwere === "rot" ? "bg-red-500" : "bg-amber-400"
                  }`}
                />
                <span className="text-sm">
                  <span className="font-medium text-ink">{signal.titel}</span>
                  <span className="text-ink-muted"> — {signal.schritt}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      )}

      {/* --- Fuers 1:1 ---------------------------------------------------
          Direkt unter "Dein Schritt", regelbasiert aus lib/coaching.ts:
          Engpass, Trend und Stillstand koennen gleichzeitig stehen; trifft
          nichts zu, steht ein Satz Anerkennung. Kein Sprachmodell, keine
          Push-Nachricht - siehe Kopfkommentar der Datei. Keine Namen in den
          Saetzen, also nichts fuers Vorfuehren zu verdecken. */}
      {!person.platzhalter && coachingSaetze.length > 0 && (
        <section className={`${card} p-4 sm:p-5`}>
          <h2 className={kicker}>Fürs 1:1</h2>
          <ul className="mt-1.5 space-y-1.5">
            {coachingSaetze.map((satz, index) => (
              <li key={index} className="text-sm text-ink">
                {satz}
              </li>
            ))}
          </ul>
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
          <div className="mt-4 border-t border-line pt-4">
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

      {/* --- Verlauf als Kurve (AP-19) ----------------------------------------
          Steht VOR der Tages-Liste, ersetzt sie nicht (N6: erst der Trend,
          dann die Ereignisse). Einheiten nur bei Zahlen UND eingeschaltetem
          Schalter; Aktivitaeten immer, wie auf /mannschaft (AP-17). Keine
          Namen im Bild - nichts zu verdecken. */}
      {!person.platzhalter && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className={sectionTitle}>Verlauf</h2>
            <span className="text-xs text-ink-muted">tippen und halten zum Ablesen</span>
          </div>
          {einheitenSerien && (
            <VerlaufsChart
              serien={einheitenSerien}
              heute={heute}
              monatStart={monatStartTag}
              // Eigene Fussnote statt des VerlaufsChart-Standardtexts: der
              // Standardtext spricht die zweite Person an ("deiner Einheiten")
              // - richtig auf der eigenen Seite, falsch auf der Seite eines
              // anderen Menschen, die diese Seite normalerweise zeigt.
              fussnote={
                "Kumuliert, inklusive der Einheiten von vor der App — die stehen als eine Zahl ohne Datum, davor läuft die Kurve flach. Ein Storno zieht die Kurve nach unten." +
                (fuehrt ? " Eigen = selbst gemeldet, Ast = die ganze Struktur ohne Eigen." : "")
              }
            />
          )}
          <VerlaufsChart
            serien={aktivitaetenSerien}
            heute={heute}
            monatStart={monatStartTag}
            zahlen="ganz"
            einheitWort="Aktivitäten"
            fussnote="Kumuliert; Termine = vereinbart."
          />
        </section>
      )}

      {/* --- Der Verlauf mit Namen ------------------------------------------ */}
      {!(person.platzhalter && !fuehrt) && (
      <VorfuehrVerdeckt hinweis="Beim Vorführen ausgeblendet — der Tages-Verlauf zeigt Kontaktnamen.">
      <section className={`${card} p-4 sm:p-5`}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className={kicker}>
            {fuehrt ? "Verlauf im Ast" : "Verlauf"} — letzte {VERLAUF_TAGE} Tage
          </h2>
          {verdeckt.length > 0 && (
            <span className="text-xs text-ink-soft">
              {verdeckt.length} {verdeckt.length === 1 ? "Person zeigt" : "Personen zeigen"} nur
              Zahlen
            </span>
          )}
        </div>

        {offeneIds.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">
            Hier stehen keine Vornamen. {person.einblick.hinweis}
          </p>
        ) : tage.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">
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
          <p className="mt-4 border-t border-line pt-3 text-xs text-ink-soft">
            Ohne Namen im Verlauf:{" "}
            {verdeckt.map((eintrag) => eintrag.vorname).join(", ")}. Deren Zahlen stehen
            trotzdem in der Summe oben.
          </p>
        )}
      </section>
      </VorfuehrVerdeckt>
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
                <ul className="mt-2.5 divide-y divide-line">
                  {offeneSachen.termine.map((eintrag) => (
                    <li
                      key={eintrag.id}
                      className="flex flex-wrap items-baseline gap-x-2 py-2 text-sm"
                    >
                      <span className="font-medium text-ink">{eintrag.name}</span>
                      {mitBerater && (
                        <span className="text-11 text-ink-soft">
                          {namen.get(eintrag.beraterId) ?? "—"}
                        </span>
                      )}
                      <span className="ml-auto text-xs tabular-nums text-ink-muted">
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
                <ul className="mt-2.5 divide-y divide-line">
                  {offeneSachen.liegt.map((eintrag) => (
                    <li
                      key={eintrag.id}
                      className="flex flex-wrap items-baseline gap-x-2 py-2 text-sm"
                    >
                      <span className="font-medium text-ink">{eintrag.name}</span>
                      <span className="text-xs text-ink-muted">{eintrag.phase}</span>
                      {mitBerater && (
                        <span className="text-11 text-ink-soft">
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
            <GpName name={person.vorname} kurz={kurzMap.get(person.name)} />s Direkte (
            {direkte.length})
          </h2>
          <ul className="mt-1.5 divide-y divide-line">
            {direkte.map((eintrag) => (
              <AstZeile key={eintrag.id} person={eintrag} kurz={kurzMap.get(eintrag.name)} />
            ))}
          </ul>

          {ast.length > direkte.length && (
            <details className="group mt-4 border-t border-line pt-3">
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2">
                <span className={kicker}>
                  Tiefer im Ast ({ast.length - direkte.length})
                </span>
                <span className="text-xs text-ink-soft group-open:hidden">anzeigen</span>
                <span className="hidden text-xs text-ink-soft group-open:inline">zuklappen</span>
              </summary>
              <ul className="mt-1.5 divide-y divide-line">
                {ast
                  .filter((eintrag) => !direkte.includes(eintrag))
                  .map((eintrag) => (
                    <AstZeile key={eintrag.id} person={eintrag} kurz={kurzMap.get(eintrag.name)} />
                  ))}
              </ul>
            </details>
          )}
        </section>
      )}

      {/* --- Aus der Mannschaft nehmen --------------------------------------
          Ganz unten, hinter allem anderen: der Griff, den man einmal im
          Quartal braucht, gehoert nicht neben den, den man taeglich braucht.
          Vorher konnte das nur die Systemverwaltung - und bis die reagiert
          hat, steht ein falscher Kasten im Organigramm und eine Null in jeder
          Auswertung des Astes. */}
      {person.id !== user.id && (
        <section className={`${card} p-4 sm:p-5`}>
          <h2 className={kicker}>Aus der Mannschaft nehmen</h2>
          <p className="mt-1.5 text-sm text-ink-muted">
            {person.platzhalter
              ? `${person.vorname} steht nur als Kasten im Baum. Löschen nimmt ihn samt offener Einladung heraus.`
              : `Austragen lässt ${person.vorname} im Baum stehen — die Historie bleibt, die Zahlen zählen nicht mehr mit. Löschen ist endgültig.`}
          </p>
          <div className="mt-3">
            <PersonEntfernen
              memberId={person.id}
              name={person.name}
              vorname={person.vorname}
              platzhalter={person.platzhalter}
              ausgetreten={person.ausgetreten}
              kontakte={eigeneKontakte}
              direkte={direkte.length}
              ueberName={person.ueber ?? "dir"}
            />
          </div>
        </section>
      )}

      <p className={kicker}>
        Vorname ja, alles andere nein: Nachnamen, Notizen, Telefonnummern,
        E-Mail-Adressen und Berufe der Kontakte stehen hier nirgends — auch nicht im
        Startfenster.
      </p>
    </div>
    </VorfuehrProvider>
  );
}
