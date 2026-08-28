// Einheiten und Karrierestufe (docs/einheiten-plan.md).
//
// Das Werkzeug zaehlt bis hierhin Taetigkeiten: Anrufe, Nummern, Termine,
// Abschluesse. Das ist die richtige Waehrung fuer den Anfang - wer noch nichts
// erreicht hat, kann wenigstens fleissig sein. Es ist aber nicht die Waehrung,
// in der der Betrieb rechnet. Dort zaehlen EINHEITEN, und an ihnen haengt die
// KARRIERESTUFE.
//
// Drei Regeln, die den Rest erklaeren:
//
// 1. HIER ENTSTEHT KEINE UMSATZRECHNUNG. Sparte, Monatsbeitrag,
//    Laufzeitfaktoren und "100 Euro = 82 Einheiten" sind beim
//    Kernmodell-Rueckbau rausgeflogen (docs/audit-kernmodell.md, 3.11) und
//    kommen nicht wieder. Eine Einheit ist hier eine gemeldete Zahl mit einem
//    Datum daran.
// 2. EINHEITEN SIND KEINE WETTBEWERBSPUNKTE. Sie stehen in keiner Rangliste
//    und in keiner Stufe aus lib/stufen.ts. Waeren sie drin, schluege Verkauf
//    den Aufbau - und die gesamte Punktehistorie waere rueckwirkend eine
//    andere. Dieselbe Ueberlegung wie bei der Anwesenheit, die deshalb kein
//    sechster QuotaType wurde.
// 3. ALLES, WAS SPAETER ANDERS SEIN KOENNTE, STEHT AN EINER STELLE. Der
//    Schnitt des Produktionsmonats steht als Konstante hier. Die SCHWELLEN der
//    Karrierestufen stehen seit AP-07 nicht mehr im Code: sie liegen in der
//    Tabelle "Einstellung" und werden in der Werkstatt gepflegt
//    (docs/emil-feedback-plan.md, D4). Was unten noch als Konstante steht, ist
//    nur der Platzhalter, mit dem die Anzeige weiterlaeuft, solange die
//    Tabelle fehlt.

import { prisma } from "@/lib/prisma";
import { addDays, addMonths, berlinToday, dayToUtcDate } from "@/lib/dates";
import { einstellungen, ganzzahl } from "@/lib/einstellungen";
import { ebene, elternIdVon, strukturKonten } from "@/lib/struktur";

// --- Rechnen in Hundertsteln ------------------------------------------------
// Gespeichert wird eine ganze Zahl: 350 = 3,50 Einheiten. Kein Decimal - das
// ist bei Prisma eine Klasseninstanz und ueberlebt die Grenze zu einer
// Client-Komponente nicht. Diese Datei ist die einzige Stelle, an der aus
// "3,5" eine 350 wird - der Weg IN die Datenbank. Der Weg heraus (350 ->
// "3,50") steht seit AP-08 in lib/einheitenAnzeige.ts und wird hier
// weitergereicht; auch er gibt es nur einmal, nur eben eine Datei weiter,
// weil er auch im Browser gebraucht wird. Siehe direkt bei formatEinheiten.

/** Hoechstbetrag einer einzelnen Buchung. Alles darueber ist ein Tippfehler. */
export const BUCHUNG_MAX = 100_000 * 100;

// Die Anzeigerichtung (350 -> "3,50") liegt seit AP-08 eine Datei weiter, in
// lib/einheitenAnzeige.ts, und wird von dort weitergereicht: diese Datei
// importiert Prisma, und components/VerlaufsChart.tsx rechnet seine Kurve im
// Browser. Fuer jede Aufrufstelle bleibt es derselbe Import wie bisher - die
// Begruendung steht im Kopf der anderen Datei.
export { formatEinheiten } from "@/lib/einheitenAnzeige";

/**
 * "3,5" | "3.5" | "1.000" | "1.234,75" | "1 000,50" | "-12" -> Hundertstel.
 * null, wenn es keine Zahl ist.
 *
 * DER PUNKT IST ZWEIDEUTIG, und zwar auf eine teure Art: in "1.234,75" trennt
 * er Tausender, in "3.5" die Nachkommastelle. Bei einer Karrierezahl ist der
 * Unterschied ein Faktor 1000 - "1.000" als 1,00 zu lesen waere die Art
 * Fehler, die niemand mehr findet.
 *
 * Drei Regeln, in dieser Reihenfolge:
 *   1. Steht ein Komma da, sind alle Punkte Tausendertrenner.
 *   2. Ohne Komma gilt eine Dreiergruppierung ("1.000", "12.500.000") als
 *      Tausendertrennung. Alles andere ("3.5", "12.50") ist ein Dezimalpunkt.
 *   3. Ein Leerzeichen zaehlt NUR als Tausendertrenner, wenn er eine
 *      vollstaendige Dreiergruppe bildet ("1 000", "1 000,50") - genau wie
 *      beim Punkt in Regel 2. Jedes andere Ziffer-Leerzeichen-Muster
 *      ("32 67") ist ein Tippfehler und kein Tausendertrenner: fruehrer
 *      verschwand das Leerzeichen kommentarlos, und aus "32 67" wurde still
 *      3267,00 - Faktor 100 daneben. NBSP (U+00A0) und schmales Leerzeichen
 *      (U+202F), wie sie beim Einfuegen einer Zahl aus einer anderen App
 *      mitkommen koennen, zaehlen dabei wie ein normales Leerzeichen.
 */
export function parseEinheiten(roh: string): number | null {
  const platzNormalisiert = roh.replace(/[\u00a0\u202f]/g, " ").trim();
  if (!platzNormalisiert) return null;

  let sauber = platzNormalisiert;
  if (sauber.includes(" ")) {
    // Nur eine vollstaendige Dreiergruppierung ist ein Tausendertrenner -
    // alles andere ist ein Fehler und wird NICHT stillschweigend
    // zusammengezogen (siehe Regel 3 oben).
    if (!/^-?\d{1,3}( \d{3})+(,\d+)?$/.test(sauber)) return null;
    sauber = sauber.replace(/ /g, "");
  }

  const tausendergruppiert = /^-?\d{1,3}(\.\d{3})+$/.test(sauber);
  const normalisiert =
    sauber.includes(",") || tausendergruppiert
      ? sauber.replace(/\./g, "").replace(",", ".")
      : sauber;
  if (!/^-?\d+(\.\d+)?$/.test(normalisiert)) return null;
  const wert = Math.round(Number(normalisiert) * 100);
  if (!Number.isFinite(wert)) return null;
  return Math.max(-BUCHUNG_MAX, Math.min(BUCHUNG_MAX, wert));
}

// --- Der Produktionsmonat ---------------------------------------------------
// Voreinstellung: der Kalendermonat, Europe/Berlin, wie jeder andere Zeitraum
// im Werkzeug.
//
// Schneidet der Betrieb anders (Stichtag 16., "bis zum letzten Arbeitstag"),
// ist das EINE Zahl hier - keine Aufrufstelle erfaehrt davon. Die Buchung
// traegt ein Datum und keine Monatszuordnung, deshalb laesst sich der Schnitt
// aendern, ohne Daten anzufassen.
export const PRODUKTIONSMONAT_ERSTER_TAG = 1;

const monatsFormat = new Intl.DateTimeFormat("de-DE", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export type Produktionsmonat = {
  /** Erster Tag, UTC-Mitternacht - direkt als Prisma-Filter verwendbar. */
  start: Date;
  /** Letzter Tag, UTC-Mitternacht. */
  ende: Date;
  /** "August 2026" - benannt nach dem Monat, in dem der Zeitraum beginnt. */
  label: string;
};

export function produktionsmonat(tag: string): Produktionsmonat {
  const datum = dayToUtcDate(tag);
  const vorDemStichtag = datum.getUTCDate() < PRODUKTIONSMONAT_ERSTER_TAG;
  const ersterDesMonats = new Date(
    Date.UTC(
      datum.getUTCFullYear(),
      datum.getUTCMonth() + (vorDemStichtag ? -1 : 0),
      1
    )
  );
  // Kurze Monate: ein Stichtag am 31. faellt im Februar auf den Letzten.
  const tageImMonat = new Date(
    Date.UTC(
      ersterDesMonats.getUTCFullYear(),
      ersterDesMonats.getUTCMonth() + 1,
      0
    )
  ).getUTCDate();
  const start = new Date(ersterDesMonats.getTime());
  start.setUTCDate(Math.min(PRODUKTIONSMONAT_ERSTER_TAG, tageImMonat));

  return {
    start,
    ende: addDays(addMonths(start, 1), -1),
    label: monatsFormat.format(start),
  };
}

// --- Die Karrierestufe ----------------------------------------------------------
// "Karrierestufe" und nicht "Stufe": lib/stufen.ts belegt das Wort im selben
// Bereich schon (Anwaerter bis Veteran, gerechnet aus Wettbewerbspunkten,
// sichtbar auf /spiel). Zwei Dinge gleich zu nennen waere der sichere Weg in
// die Verwechslung.

export const KARRIERESTUFE_MIN = 1;
// Sechs, nicht neun: darueber gibt es im Betrieb keine Karrierestufe mehr. Die
// Zahl steht nur hier - istKarrierestufe() und das max-Feld im Formular haengen
// beide daran, in der Datenbank sitzt kein Constraint.
export const KARRIERESTUFE_MAX = 6;

/**
 * Der PLATZHALTER, solange die Tabelle "Einstellung" nicht da ist.
 *
 * Bis AP-07 war das hier die Wahrheit ueber die Schwellen. Jetzt ist es der
 * Rueckfall fuer genau einen Fall: die Migration liegt committet im Repo, ist
 * aber noch nicht deployt (siehe schwelleFuer). Danach zaehlt nur noch, was in
 * der Werkstatt steht.
 *
 * Die 500 stehen schon in docs/recruiting-plan.md ("nach ~500 Einheiten besteht
 * der Alltag aus Rekrutierung") und sind dort als offener Punkt markiert -
 * ebenso in docs/emil-feedback-plan.md, Abschnitt 7, Punkt 1. TODO-Emil: seine
 * echten Werte traegt der Admin selbst ein, ohne dass jemand diese Datei
 * anfasst.
 *
 * Fuer Karrierestufe 2 aufwaerts steht hier ABSICHTLICH nichts: eine erfundene
 * Schwelle ist schlimmer als keine, weil sie jemandem sagt, er sei fast da.
 * Ohne Eintrag zeigt die Seite die Zahlen und die Runde, aber keinen Balken.
 */
export const SCHWELLEN: Record<number, number> = {
  1: 500 * 100,
};

/** Der Schluessel einer Schwelle in der Tabelle "Einstellung": "schwelle.1". */
export function schwellenSchluessel(karrierestufe: number): string {
  return `schwelle.${karrierestufe}`;
}

/**
 * Alle hinterlegten Schwellen: Karrierestufe -> Hundertstel.
 *
 * Erst die Tabelle, dann der Platzhalter. Der Unterschied, auf den es dabei
 * ankommt: eine ANTWORTENDE Tabelle ohne Zeile fuer eine Stufe heisst "fuer
 * diese Stufe gibt es keine Schwelle" - da faellt nichts auf die Konstante
 * zurueck, sonst koennte der Admin die 500 nie wieder loswerden. Nur eine
 * Tabelle, die gar nicht antwortet (Migration unterwegs), laesst den
 * Platzhalter gelten.
 *
 * Was keine positive ganze Zahl ist, faellt raus: eine 0 waere keine Schwelle,
 * sondern eine Division durch null im Fortschrittsbalken.
 */
export async function alleSchwellen(): Promise<Map<number, number>> {
  const werte = await einstellungen();
  if (werte === null) {
    return new Map(
      Object.entries(SCHWELLEN).map(([stufe, hundertstel]) => [
        Number(stufe),
        hundertstel,
      ])
    );
  }

  const schwellen = new Map<number, number>();
  for (let stufe = KARRIERESTUFE_MIN; stufe <= KARRIERESTUFE_MAX; stufe++) {
    const hundertstel = ganzzahl(werte.get(schwellenSchluessel(stufe)));
    if (hundertstel !== null && hundertstel > 0) schwellen.set(stufe, hundertstel);
  }
  return schwellen;
}

/**
 * Was der eigenen Karrierestufe bis zur naechsten fehlt, in Hundertsteln.
 *
 * Seit AP-07 async, weil die Zahl aus der Datenbank kommt und nicht mehr aus
 * dem Code. Die Abfrage dahinter ist je Anfrage gecacht (lib/einstellungen.ts),
 * mehrere Aufrufer auf einer Seite kosten also eine Abfrage, nicht drei.
 */
export async function schwelleFuer(
  karrierestufe: number | null
): Promise<number | null> {
  if (karrierestufe === null) return null;
  return (await alleSchwellen()).get(karrierestufe) ?? null;
}

export function istKarrierestufe(wert: number): boolean {
  return (
    Number.isInteger(wert) && wert >= KARRIERESTUFE_MIN && wert <= KARRIERESTUFE_MAX
  );
}

// --- Die Stufenrunde --------------------------------------------------------
// Wer dieselbe Karrierestufe traegt, sieht die Einheiten der anderen - ueber die
// ganze Instanz, quer durch alle Aeste.
//
// Das ist BEWUSST NICHT lib/scope.ts. Dort liegt die Struktur-Grenze ("ich und
// alles unter mir"), und sie bleibt unangetastet. Die Runde ist eine zweite,
// flache Grenze mit einer anderen Frage dahinter: nicht "wen fuehre ich",
// sondern "wer ist so weit wie ich". Deshalb steht sie hier und nirgends sonst.
//
// Sichtbar wird ausschliesslich, was auch die Rangliste zeigt: Name und Zahl.
// Keine Kontaktdaten, keine Pipeline, keine Kundennamen.

export type EinheitenStand = {
  userId: string;
  name: string;
  /** Startbestand plus alle Buchungen, in Hundertsteln. */
  gesamt: number;
  /** Buchungen im laufenden Produktionsmonat, in Hundertsteln. */
  monat: number;
  istDu: boolean;
};

export type EinheitenSeite = {
  monat: Produktionsmonat;
  ich: EinheitenStand;
  /**
   * Die Runde inklusive der eigenen Zeile, sortiert nach dem laufenden Monat.
   * Leer, solange keine Karrierestufe eingetragen ist.
   *
   * Sortiert nach MONAT, nicht nach Gesamt: Gesamt ist Biografie - wer lange
   * dabei ist, steht dort immer vorn, und die Liste waere jeden Monat dieselbe.
   */
  runde: EinheitenStand[];
  /** Was die eigene Karrierestufe bis zur naechsten braucht, oder null. */
  schwelle: number | null;
};

type Betrachter = {
  id: string;
  name: string;
  karrierestufe: number | null;
  einheitenStart: number;
};

/** Zwei Zahlen je Kopf, in Hundertsteln: alles und der laufende Monat. */
export type Zahlenpaar = { gesamt: number; monat: number };

/**
 * Was EIN Konto im laufenden Produktionsmonat gebucht hat.
 *
 * Die kleine Schwester von ladeEinheiten(): kein Feld, keine Runde, keine
 * Schwelle - nur die eine Zahl. Dafuer gibt es zwei Stellen, an denen sie
 * gebraucht wird, ohne dass die ganze Seite gerechnet werden soll: das
 * Schnellfenster in der Kopfzeile und die Frage nach einem Abschluss
 * (docs/findbarkeit-plan.md).
 *
 * Ohne einheitenStart, und das mit Absicht: der Startbestand ist Historie und
 * gehoert in die Gesamtsumme, nicht in einen Monat.
 */
export async function eigenerMonatsstand(userId: string): Promise<number> {
  const monat = produktionsmonat(berlinToday());
  const summe = await prisma.einheitenbuchung.aggregate({
    where: { userId, tag: { gte: monat.start, lte: monat.ende } },
    _sum: { hundertstel: true },
  });
  return summe._sum.hundertstel ?? 0;
}

/**
 * Der Gesamtstand EINES Kontos: Startbestand plus alle eigenen Buchungen,
 * ohne Team und ohne Runde.
 *
 * Die zweite kleine Schwester von ladeEinheiten() (siehe eigenerMonatsstand
 * direkt darueber, gleicher Grund): fuer die Einheiten-Karte auf /heute
 * (docs/emil-feedback-plan.md, AP-02) - force-dynamic, bei jedem Aufruf neu
 * geladen, und deshalb zu teuer fuer die komplette Stufenrunde aus
 * ladeEinheiten(). Denselben Wert braucht auch einheitSchnellBuchen fuer
 * seinen Rueckgabewert, damit der Fortschrittsbalken nach einer
 * Inline-Buchung ohne Seiten-Reload stimmt.
 *
 * einheitenStart wird uebergeben statt selbst geladen - aus demselben Grund
 * wie bei eigenerMonatsstand: die Aufrufstelle hat das Konto (requireUser())
 * ohnehin schon in der Hand.
 */
export async function eigenerGesamtstand(
  userId: string,
  einheitenStart: number
): Promise<number> {
  const summe = await prisma.einheitenbuchung.aggregate({
    where: { userId },
    _sum: { hundertstel: true },
  });
  return einheitenStart + (summe._sum.hundertstel ?? 0);
}

// --- Der eigene Verlauf -----------------------------------------------------
// Emils Satz dazu: "Diagramm Einheiten -> alles: Tagesdurchschnitt, wie viel
// pro Woche, Erfolgsdiagramm. Wie so ETF-Chart, ueber Woche, Monat, 6 Monate,
// Jahr und Insgesamt" (docs/emil-feedback-plan.md, AP-08).

/** Ein Kalendertag mit seiner Nettosumme, in Hundertsteln. */
export type Verlaufstag = {
  /** "2026-08-28" - der Berliner Kalendertag, wie ihn `tag` speichert. */
  tag: string;
  /** Summe aller Buchungen dieses Tages. NEGATIV heisst: Storni ueberwiegen. */
  hundertstel: number;
};

/**
 * Die eigenen Tagessummen - die dritte kleine Schwester von ladeEinheiten().
 *
 * Eine Abfrage, ein groupBy auf `tag` (Praezedenz: dailyLog.groupBy in
 * lib/fuehrung.ts). Der Index [userId, tag] traegt genau diesen Zugriff.
 *
 * BEWUSST OHNE ZEITRAUM-FILTER, obwohl der Chart fuenf Zeitraeume anbietet.
 * Zwei Gruende, die beide in dieselbe Richtung zeigen:
 *
 * 1. "Gesamt" ist einer der fuenf Umschalter - die ganze Historie muss also
 *    ohnehin einmal ueber die Leitung.
 * 2. Jeder KUERZERE Zeitraum braucht seinen Sockel, und der ist die Summe von
 *    allem DAVOR. Ein Filter auf die Woche wuerde also eine zweite Abfrage
 *    nach sich ziehen, nur um zu erfahren, wo die Woche anfaengt.
 *
 * Der Umschalter kostet damit keinen Serverweg: der Browser hat alle fuenf
 * Zeitraeume schon in der Hand und schneidet sie sich selbst zurecht. Eine
 * Zeile je Tag MIT Buchung, nicht je Tag - wer zwei Jahre lang jede Woche
 * einmal eintraegt, hat rund hundert davon.
 *
 * Ohne einheitenStart, wie eigenerMonatsstand(): den Sockel haelt die
 * Aufrufstelle ueber requireUser() ohnehin schon in der Hand.
 */
export async function eigenerVerlauf(userId: string): Promise<Verlaufstag[]> {
  const zeilen = await prisma.einheitenbuchung.groupBy({
    by: ["tag"],
    where: { userId },
    _sum: { hundertstel: true },
    orderBy: { tag: "asc" },
  });

  // `tag` steht als UTC-Mitternacht in der Datenbank, die ersten zehn Zeichen
  // der ISO-Form sind damit genau der Berliner Kalendertag. Als Zeichenkette
  // und nicht als Date, weil beides ueber die Grenze zur Client-Komponente
  // muss und ein Datum dort ohnehin wieder als Zeichenkette ankaeme.
  return zeilen.map((zeile) => ({
    tag: zeile.tag.toISOString().slice(0, 10),
    hundertstel: zeile._sum.hundertstel ?? 0,
  }));
}

/**
 * Die gebuchten Summen je Konto - EINE Abfrage je Zeitraum, nie eine je Kopf.
 *
 * Bewusst OHNE einheitenStart: den holt jede Aufrufstelle selbst, weil sie das
 * Konto ohnehin schon in der Hand hat. Hier zusaetzlich zu laden hiesse, ihn an
 * jeder Stelle zweimal aus der Datenbank zu ziehen.
 */
async function buchungssummenJe(
  ids: string[],
  monat: Produktionsmonat
): Promise<Map<string, Zahlenpaar>> {
  const summen = new Map<string, Zahlenpaar>(
    ids.map((id) => [id, { gesamt: 0, monat: 0 }])
  );
  if (ids.length === 0) return summen;

  const [gesamtZeilen, monatsZeilen] = await Promise.all([
    prisma.einheitenbuchung.groupBy({
      by: ["userId"],
      where: { userId: { in: ids } },
      _sum: { hundertstel: true },
    }),
    prisma.einheitenbuchung.groupBy({
      by: ["userId"],
      where: { userId: { in: ids }, tag: { gte: monat.start, lte: monat.ende } },
      _sum: { hundertstel: true },
    }),
  ]);

  for (const zeile of gesamtZeilen) {
    const eintrag = summen.get(zeile.userId);
    if (eintrag) eintrag.gesamt = zeile._sum.hundertstel ?? 0;
  }
  for (const zeile of monatsZeilen) {
    const eintrag = summen.get(zeile.userId);
    if (eintrag) eintrag.monat = zeile._sum.hundertstel ?? 0;
  }

  return summen;
}

export async function ladeEinheiten(
  betrachter: Betrachter,
  heute: string
): Promise<EinheitenSeite> {
  const monat = produktionsmonat(heute);

  // Platzhalter (Konten ohne Zugangsdaten) und Ausgetretene stehen in keiner
  // Runde: wer nie gearbeitet hat, hat keine Einheiten.
  const konten =
    betrachter.karrierestufe === null
      ? []
      : await prisma.user.findMany({
          where: {
            karrierestufe: betrachter.karrierestufe,
            deactivatedAt: null,
            passwordHash: { not: null },
          },
          select: { id: true, name: true, einheitenStart: true },
        });

  if (!konten.some((konto) => konto.id === betrachter.id)) {
    konten.push({
      id: betrachter.id,
      name: betrachter.name,
      einheitenStart: betrachter.einheitenStart,
    });
  }

  const gebucht = await buchungssummenJe(
    konten.map((konto) => konto.id),
    monat
  );

  const staende: EinheitenStand[] = konten.map((konto) => ({
    userId: konto.id,
    name: konto.name,
    gesamt: konto.einheitenStart + (gebucht.get(konto.id)?.gesamt ?? 0),
    monat: gebucht.get(konto.id)?.monat ?? 0,
    istDu: konto.id === betrachter.id,
  }));

  staende.sort(
    (a, b) =>
      b.monat - a.monat || b.gesamt - a.gesamt || a.name.localeCompare(b.name)
  );

  return {
    monat,
    ich: staende.find((stand) => stand.istDu)!,
    runde: betrachter.karrierestufe === null ? [] : staende,
    schwelle: await schwelleFuer(betrachter.karrierestufe),
  };
}

// --- Team-Einheiten ---------------------------------------------------------
// Eigeneinheiten schreibt jeder selbst. Was darunter haengt, laeuft von allein
// nach oben: wer einen Geschaeftspartner unter sich hat, sieht dessen Zahlen in
// seiner Team-Summe - und der wiederum die seiner Leute. Ueber alle Ebenen.
//
// Zwei Festlegungen, die den Rest erklaeren:
//
// 1. TEAM IST EXKLUSIV. "Team" ist alles UNTER jemandem, ohne ihn selbst. Ein
//    Blattknoten hat Team = 0 und trotzdem Eigeneinheiten. Wer beides in eine
//    Zahl wirft, kann spaeter nie mehr sagen, was jemand selbst geschrieben
//    hat - und genau danach fragt die Karrierestufe.
// 2. NICHTS WIRD GESPEICHERT. Die Summe entsteht bei jedem Aufruf aus dem
//    Struktur-Pfad. Ein mitgefuehrtes Feld muesste bei jeder Buchung UND bei
//    jedem Umhaengen fortgeschrieben werden - und stuende ab dem ersten
//    verpassten Fall dauerhaft falsch da.

/** Eigene Zahl, Team-Zahl und beides zusammen - je Kopf, in Hundertsteln. */
export type EinheitenAufteilung = {
  eigenGesamt: number;
  eigenMonat: number;
  /** Alles UNTER dieser Person, ohne sie selbst. */
  teamGesamt: number;
  teamMonat: number;
  /** Eigen + Team. Was der ganze Ast zusammen geschrieben hat. */
  astGesamt: number;
  astMonat: number;
};

/**
 * Die Team-Summe des Betrachters: alles unter ihm, ohne ihn selbst.
 *
 * `null`, wenn niemand unter ihm haengt - dann gibt es keine Team-Zahl, und
 * eine 0 waere an der Stelle keine Auskunft, sondern eine leere Karte fuer die
 * Mehrheit ohne eigene Leute.
 */
export async function teamEinheiten(
  betrachterId: string,
  monat: Produktionsmonat
): Promise<Zahlenpaar | null> {
  const imAst = await strukturKonten(betrachterId);
  const unterMir = imAst.filter((id) => id !== betrachterId);
  if (unterMir.length === 0) return null;

  const [konten, gebucht] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: unterMir } },
      select: { id: true, einheitenStart: true },
    }),
    buchungssummenJe(unterMir, monat),
  ]);

  const summe: Zahlenpaar = { gesamt: 0, monat: 0 };
  for (const konto of konten) {
    summe.gesamt += konto.einheitenStart + (gebucht.get(konto.id)?.gesamt ?? 0);
    summe.monat += gebucht.get(konto.id)?.monat ?? 0;
  }
  return summe;
}

/**
 * Fuer JEDEN uebergebenen Kopf: was er selbst geschrieben hat, was sein Team
 * darunter geschrieben hat, und beides zusammen.
 *
 * Gefaltet wird von unten nach oben: absteigend nach Tiefe sortiert ist ein
 * Knoten immer fertig, bevor seine Fuehrungskraft an die Reihe kommt. Dasselbe
 * Verfahren wie `astSummen` in lib/fuehrung.ts - dort fuer Taetigkeiten, hier
 * fuer Einheiten. Bewusst eine eigene Fassung statt eines gemeinsamen
 * Bausteins: die beiden Zahlenwelten sollen sich nicht vermischen, das ist der
 * ganze Sinn der Trennung in dieser Datei.
 *
 * Die Eltern-Id kommt aus dem Pfad, nicht aus leaderId - eine Abfrage weniger,
 * und der Pfad ist ohnehin die Wahrheit ueber den Baum.
 */
export async function einheitenFuerStruktur(
  personen: { id: string; path: string }[],
  monat: Produktionsmonat
): Promise<Map<string, EinheitenAufteilung>> {
  const aufteilung = new Map<string, EinheitenAufteilung>();
  if (personen.length === 0) return aufteilung;

  const ids = personen.map((person) => person.id);
  const [konten, gebucht] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, einheitenStart: true },
    }),
    buchungssummenJe(ids, monat),
  ]);
  const startJe = new Map(konten.map((konto) => [konto.id, konto.einheitenStart]));

  // Erst jeder mit seiner eigenen Zahl. Der Ast startet gleich der eigenen und
  // waechst gleich um das, was von unten hochkommt.
  for (const person of personen) {
    const eigenGesamt =
      (startJe.get(person.id) ?? 0) + (gebucht.get(person.id)?.gesamt ?? 0);
    const eigenMonat = gebucht.get(person.id)?.monat ?? 0;
    aufteilung.set(person.id, {
      eigenGesamt,
      eigenMonat,
      teamGesamt: 0,
      teamMonat: 0,
      astGesamt: eigenGesamt,
      astMonat: eigenMonat,
    });
  }

  const vonUntenNachOben = [...personen].sort(
    (a, b) => ebene(b.path) - ebene(a.path)
  );
  for (const person of vonUntenNachOben) {
    const elternId = elternIdVon(person.path);
    const oben = elternId ? aufteilung.get(elternId) : null;
    const meins = aufteilung.get(person.id);
    if (!oben || !meins) continue;
    oben.astGesamt += meins.astGesamt;
    oben.astMonat += meins.astMonat;
  }

  // Team ist, was der Ast ohne die eigene Zahl traegt. Erst hier, nach der
  // Faltung: waehrenddessen ist der Ast noch nicht fertig.
  for (const eintrag of aufteilung.values()) {
    eintrag.teamGesamt = eintrag.astGesamt - eintrag.eigenGesamt;
    eintrag.teamMonat = eintrag.astMonat - eintrag.eigenMonat;
  }

  return aufteilung;
}

/** Ob irgendwo eine Zahl steht - sonst braucht die Aufstellung gar nicht erst
 *  auf den Bildschirm. */
export function traegtZahlen(
  aufteilung: Map<string, EinheitenAufteilung>
): boolean {
  for (const eintrag of aufteilung.values()) {
    if (eintrag.astGesamt !== 0 || eintrag.astMonat !== 0) return true;
  }
  return false;
}

// --- Fokus-Marker: der Prozentsatz der Einheitenaufteilung ------------------
// Emils zweiter Satz zu den Einheiten: "Einheitenaufteilung, eine Struktur
// erfuellt die 50%, damit du siehst, wo der Fokus drauf liegt"
// (docs/emil-feedback-plan.md, AP-06). Anders als bei den Karrierestufen-
// Schwellen gibt es hier nur EINE Zahl, keine Reihe je Stufe - sonst
// derselbe Weg wie schwelleFuer() oben: erst die Tabelle "Einstellung", sonst
// der Platzhalter. Die 50 sind ein angenommener Default (Plan, Abschnitt 7,
// Punkt 2), bis Emil seine eigene Zahl schickt.

/** Der Schluessel des Fokus-Prozentsatzes in der Tabelle "Einstellung". */
export const FOKUS_PROZENTSATZ_SCHLUESSEL = "fokus-prozentsatz";

/** Der Platzhalter, solange kein eigener Wert eingetragen ist. */
export const FOKUS_PROZENTSATZ_STANDARD = 50;

/**
 * Ab wie viel Prozent der Struktur-Summe ein direkter Ast als Fokus gilt.
 *
 * Dasselbe Muster wie schwelleFuer(): fehlt die Tabelle (Migration
 * unterwegs) oder steht kein gueltiger Wert drin, gilt der Platzhalter. Eine
 * 0 oder eine Zahl ueber 100 waere kein Prozentsatz, sondern ein Tippfehler -
 * und faellt deshalb genauso zurueck wie ein fehlender Eintrag.
 */
export async function fokusProzentsatz(): Promise<number> {
  const werte = await einstellungen();
  if (werte === null) return FOKUS_PROZENTSATZ_STANDARD;
  const prozent = ganzzahl(werte.get(FOKUS_PROZENTSATZ_SCHLUESSEL));
  if (prozent === null || prozent <= 0 || prozent > 100) {
    return FOKUS_PROZENTSATZ_STANDARD;
  }
  return prozent;
}
