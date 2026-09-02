"use client";

// Der eigene Einheiten-Verlauf als Kurve (docs/emil-feedback-plan.md, AP-08;
// Mehrserien, Ablese-Badge und freies Zahlenformat aus
// docs/emil-feedback-runde-2.md, AP-15).
//
// Emils Satz: "Diagramm Einheiten -> alles: Tagesdurchschnitt, wie viel pro
// Woche, Erfolgsdiagramm. Wie so ETF-Chart, ueber Woche, Monat, 6 Monate, Jahr
// und Insgesamt."
//
// Bewusst ohne Diagramm-Bibliothek (D9 im Plan) - dieselbe Entscheidung wie
// beim Organigramm: das Projekt hat ausser Next, React und Prisma nichts, und
// hier geht es um eine Polylinie und zwei Skalen. Das ist weniger Code als die
// Einbindung waere.
//
// Vier Festlegungen, die den Rest erklaeren:
//
// 1. DIE KURVE IST KUMULIERT UND STEHT AUF EINEM SOCKEL. Gezeichnet wird nicht,
//    was an einem Tag dazukam, sondern was insgesamt steht - einschliesslich
//    `einheitenStart`, der Zahl von vor der App. Ohne den Sockel endete die
//    Kurve auf einem anderen Wert als "Eigeneinheiten insgesamt" zwei Karten
//    weiter oben auf derselben Seite, und eine Seite, die sich selbst
//    widerspricht, glaubt einem niemand mehr.
// 2. STORNI DUERFEN WEHTUN. Eine negative Buchung zieht die Kurve nach unten,
//    und genau so soll es aussehen. Kein Glaetten, kein Abschneiden bei null,
//    keine erzwungene Monotonie: ein Storno ist in diesem Beruf der Normalfall
//    (siehe den Kommentar am Modell Einheitenbuchung), und eine Kurve, die ihn
//    verschweigt, waere die falsche Auskunft. Aus demselben Grund wird die
//    Linie in geraden Stuecken gezogen und nicht als Kurve geglaettet - eine
//    Bezier-Glaettung schiesst ueber Wendepunkte hinaus und wuerde einen
//    Einbruch weicher zeichnen, als er war.
// 3. KEINE SCHRIFT IM SVG. Die Zeichnung skaliert mit der Kartenbreite; Text
//    darin wuerde am Handy auf sechs Pixel schrumpfen und am grossen Schirm
//    aufblasen. Alle Beschriftungen sind deshalb HTML um das Bild herum -
//    dieselbe Ueberlegung wie beim Organigramm, wo die Kaesten echte
//    DOM-Elemente sind statt gemalter Rechtecke.
// 4. KEIN HEX-WERT IN DER ZEICHNUNG. Die Linie erbt `currentColor` von einer
//    Tailwind-Textklasse, der Verlauf darunter ebenso, die Hilfslinien haben
//    ihre eigene. Damit kippt der Dunkelmodus von allein mit - globals.css
//    tauscht die Variablen, keine Komponente muss davon wissen.
//
// Drei Zusaetze aus AP-15, die dieselben Festlegungen weiterdrehen:
//
// 5. ZWEI LINIEN, EINE SKALA. `serien` nimmt bis zu zwei Kurven an (z. B.
//    "Eigen" und "Team"). Ihr Minimum und Maximum wird GEMEINSAM gerechnet -
//    zwei verschieden skalierte Linien in einem Bild zeigten einen Abstand,
//    den es nicht gibt. Die getoente Flaeche bekommt nur die erste Serie: zwei
//    uebereinanderliegende Toenungen ergeben Matsch, und die zweite Linie ist
//    die Vergleichslinie, nicht die Hauptsache.
// 6. DER STAND STEHT AM FINGER. Der Kartenkopf zeigt weiter Wert und Datum,
//    aber beim Ablesen liegt er ausserhalb des Blickfelds (Befund N3 der
//    Vorfuehrung: Fadenkreuz mitten in der Kurve, Zahl weit oben). Deshalb
//    schwebt zusaetzlich ein Badge neben dem Fadenkreuz - als HTML ueber der
//    Zeichnung, versteht sich (Festlegung 3).
// 7. DIE KOMPONENTE KENNT IHRE EINHEIT NICHT. `format` und `einheitWort`
//    kommen von aussen, gerechnet wird drinnen ausschliesslich in Rohwerten
//    (heute Hundertstel). Damit zeichnet dieselbe Kurve spaeter Anrufe und
//    Termine ganzzahlig, ohne dass hier eine Fallunterscheidung entsteht.

import { useCallback, useId, useMemo, useRef, useState } from "react";
import { addMonths, dayDisplayFormat, dayToUtcDate, mondayOf } from "@/lib/dates";
import { formatEinheiten } from "@/lib/einheitenAnzeige";
import { KennzahlKachel } from "@/components/Kennzahl";
import { card, cn, kicker, segmentGruppe, segmentKnopf } from "@/components/ui";

/** Eine Tagessumme in Hundertsteln. Deckungsgleich mit `Verlaufstag` aus
 *  lib/einheiten.ts - dort steht sie neben Prisma und ist von hier aus
 *  unerreichbar (siehe Kopf von lib/einheitenAnzeige.ts). */
export type Verlaufspunkt = { tag: string; hundertstel: number };

/** Eine gezeichnete Linie: ihr Name fuer die Legende, ihr eigener Sockel und
 *  ihre eigenen Tagessummen. Zwei davon nimmt die Komponente an, mehr nicht
 *  (siehe SERIEN_TON). */
export type Verlaufsserie = {
  name: string;
  /** Der Stand vor der ersten Buchung DIESER Serie, in Hundertsteln. */
  sockel: number;
  /** Tagessummen, aufsteigend. Nur Tage MIT Buchungen. */
  tage: Verlaufspunkt[];
};

type Zeitraum = "woche" | "monat" | "halbjahr" | "jahr" | "gesamt";

// Am Handy stehen fuenf Knoepfe nebeneinander - dort tragen sie die Kurzform.
// Der lange Name bleibt als aria-label und ab sm sichtbar.
const ZEITRAEUME: { wert: Zeitraum; kurz: string; lang: string }[] = [
  { wert: "woche", kurz: "W", lang: "Woche" },
  { wert: "monat", kurz: "M", lang: "Monat" },
  { wert: "halbjahr", kurz: "6M", lang: "6 Monate" },
  { wert: "jahr", kurz: "J", lang: "Jahr" },
  { wert: "gesamt", kurz: "Alles", lang: "Gesamt" },
];

// --- Die Toene der Serien ---------------------------------------------------
// Zwei Eintraege, und die Laenge dieser Liste ist zugleich die Hoechstzahl der
// Serien. Beide Toene sind vorhandene Tokens aus globals.css: die fuehrende
// Serie behaelt den Akzent - genau den, den die einzige Kurve immer hatte -,
// die zweite bekommt den gedeckten Schriftton, der in beiden Ansichten gut
// gegen die Karte steht. Kein neuer Farbwert, kein Hex (Festlegung 4).
const SERIEN_TON: { linie: string; flaeche: string; ring: string }[] = [
  { linie: "text-akzent", flaeche: "bg-akzent", ring: "ring-akzent/25" },
  { linie: "text-ink-muted", flaeche: "bg-ink-muted", ring: "ring-ink-muted/25" },
];

const MAX_SERIEN = SERIEN_TON.length;

// --- Die Zeichenflaeche -----------------------------------------------------
// Die viewBox ist ein reines Rechenraster, keine Pixelangabe: das SVG wird per
// CSS auf die Kartenbreite UND auf eine feste Hoehe gezogen
// (preserveAspectRatio="none").
//
// Bei erhaltenem Seitenverhaeltnis waere die Kurve am Handy 94 px hoch
// gewesen - ein Strich, kein Diagramm. Verzerrtes Ziehen kostet normalerweise
// eine gleichmaessige Strichstaerke; das faengt vectorEffect
// "non-scaling-stroke" ab, das jeden Strich in Bildschirm-Pixeln misst statt
// im Raster. Was sich dagegen NICHT gerade ziehen laesst, ist ein Kreis - der
// Ablesepunkt sitzt deshalb als HTML ueber der Zeichnung und nicht darin
// (Festlegung 3 im Kopf, dieselbe Ueberlegung wie bei der Schrift).
const BREITE = 640;
const HOEHE = 200;
/** Halbe Strichbreite plus Luft, damit die Linie am Rand nicht abgeschnitten
 *  wird - SVG malt einen Strich mittig auf den Pfad. */
const RAND_X = 4;
const RAND_OBEN = 12;
const RAND_UNTEN = 12;

/**
 * Hoechstzahl gezeichneter Punkte. Greift erst ab rund anderthalb Jahren
 * Historie, also praktisch nur im Zeitraum "Gesamt": darueber wird jeder n-te
 * Tag genommen. Weil jeder Punkt den LAUFENDEN Stand traegt und nicht die
 * Tagesbewegung, geht dabei kein Storno verloren - der Einbruch steht ab dem
 * naechsten Stuetzpunkt weiter in der Kurve. Verloren geht nur ein Auf und Ab
 * INNERHALB eines uebersprungenen Fensters, und das waere auf 640 Einheiten
 * Breite ohnehin keinen halben Pixel breit.
 */
const MAX_PUNKTE = 480;

const MS_TAG = 86_400_000;

/** Tag als fortlaufende Nummer - die X-Achse rechnet in Tagen, nicht in
 *  Datums-Objekten. */
function tagNummer(tag: string): number {
  return Math.round(dayToUtcDate(tag).getTime() / MS_TAG);
}

function datumNummer(datum: Date): number {
  return Math.round(datum.getTime() / MS_TAG);
}

function nummerDatum(nummer: number): Date {
  return new Date(nummer * MS_TAG);
}

// Beide Formate mit timeZone "UTC" - zwingend: die Tage stehen als
// UTC-Mitternacht des Berliner Kalendertags in der Datenbank. Ein Formatierer
// ohne feste Zone wuerde sie in der Auslieferung (Vercel laeuft in UTC, der
// Browser in Berlin) mal auf den Vortag schieben.
const monatJahrFormat = new Intl.DateTimeFormat("de-DE", {
  month: "short",
  year: "2-digit",
  timeZone: "UTC",
});

const vollDatumFormat = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

/** Ab wie vielen Tagen die Achse Monate statt Tagen nennt. */
const MONATSACHSE_AB = 100;

/** Abstand zwischen Ablesepunkt und Badge. Grosszuegig gewaehlt: darunter
 *  liegt beim Ablesen eine Fingerkuppe, und die ist breiter als der Punkt. */
const BADGE_ABSTAND = "1.5rem";

/** Anteil der Zeichenhoehe, unter dem oberhalb des Punktes kein Platz mehr
 *  fuer das Badge ist - dann klappt es unter den Punkt. Rund gerechnet gegen
 *  die 160 px am Handy: zwei Zeilen Badge sind gut 44 px, dazu der Abstand.
 *  Deshalb bleibt das Badge auch bei zwei Serien zweizeilig - die Werte stehen
 *  nebeneinander, nicht untereinander. */
const BADGE_KIPPT = 0.5;

/** Der Fussnoten-Text der eigenen Kurve auf /einheiten - Default, wenn kein
 *  Aufrufer eine eigene Erklaerung mitgibt (z. B. die Struktur-Kurve auf
 *  /mannschaft, die einen anderen Sockel-Sachverhalt erklaeren muss). */
const FUSSNOTE_STANDARD =
  "Kumuliert, inklusive deiner Einheiten vor der App. Ein Storno zieht die Kurve nach unten — so, wie er auch deinen Stand zieht.";

/** Ein Stuetzpunkt: Tagesnummer, Rohwert und die Stelle im Rechenraster. */
type Koordinate = { nr: number; wert: number; x: number; y: number };

/** Eine fertig gerechnete Serie. `spur` ist ihr Platz in SERIEN_TON und damit
 *  ihre Farbe - im Rechenteil steht bewusst keine Klasse, der weiss nur, wo
 *  die Linie langlaeuft. */
type GezeichneteSerie = {
  spur: number;
  name: string;
  koordinaten: Koordinate[];
  linie: string;
  flaechePfad: string;
  startwert: number;
  endwert: number;
  veraenderung: number;
};

/** Formatter fuer Zaehlgroessen (Anrufe, Termine): der Rohwert IST die Zahl. */
function ganzeZahl(wert: number): string {
  return String(wert);
}

export default function VerlaufsChart({
  sockel,
  tage,
  serien,
  heute,
  monatStart,
  fussnote,
  format: formatProp,
  zahlen = "einheiten",
  einheitWort = "Einheiten",
}: {
  /** Einserien-Kurzform: `einheitenStart` in Hundertsteln, der Stand vor der
   *  ersten Buchung. Wird ignoriert, sobald `serien` gesetzt ist. */
  sockel?: number;
  /** Einserien-Kurzform: Tagessummen, aufsteigend. Nur Tage MIT Buchungen. */
  tage?: Verlaufspunkt[];
  /** Bis zu zwei Linien in einem Bild, gemeinsam skaliert. Ohne diese Prop
   *  zeichnet die Komponente genau eine Kurve aus `sockel`/`tage`. */
  serien?: Verlaufsserie[];
  /** Berliner Heute, "2026-08-28". */
  heute: string;
  /** Erster Tag des laufenden Produktionsmonats, "2026-08-01". Kommt fertig
   *  vom Server, weil produktionsmonat() neben Prisma steht. */
  monatStart: string;
  /** Text unter den drei Kennzahlen. Default = der Erklaertext der eigenen
   *  Kurve; ein Aufrufer mit anderem Sockel (z. B. eine ganze Struktur statt
   *  einer Person) gibt seinen eigenen mit. */
  fussnote?: string;
  /** Rohwert -> Anzeigetext. Default rechnet Hundertstel in Einheiten um; wer
   *  ganze Anrufe oder Termine zeichnet, gibt String(wert) mit. */
  format?: (wert: number) => string;
  /** Serialisierbare Alternative zu `format` fuer Server-Komponenten: eine
   *  Funktion kommt nicht ueber die Server/Client-Grenze (React wirft beim
   *  Rendern). "ganz" zeichnet Anrufe oder Termine als ganze Zahl. */
  zahlen?: "einheiten" | "ganz";
  /** Wie die Zahl heisst - nur fuer aria-label und Begleittexte. */
  einheitWort?: string;
}) {
  // Eine explizite Funktion gewinnt (Client-Aufrufer), sonst entscheidet
  // `zahlen` - so kann auch eine Server-Seite die Komponente ohne Funktion
  // aufrufen.
  const format = formatProp ?? (zahlen === "ganz" ? ganzeZahl : formatEinheiten);
  const [zeitraum, setZeitraum] = useState<Zeitraum>("monat");
  // Index in den Stuetzpunkten, waehrend ein Finger oder Zeiger auf der Kurve
  // liegt. EIN Index fuer alle Serien - sie teilen sich ihre Stuetzstellen.
  const [gelesen, setGelesen] = useState<number | null>(null);
  const flaeche = useRef<HTMLDivElement>(null);
  // useId() liefert Zeichen, die in einer Fragment-Referenz nichts zu suchen
  // haben (React setzt Doppelpunkte bzw. Guillemets als Trenner). Gesaeubert
  // bleibt eine Kennung, die auf Server und Client dieselbe ist - und zwei
  // Charts auf einer Seite greifen nicht in denselben Farbverlauf.
  const verlaufId = `verlauf-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  // Die Kurzform wird zur Serienliste: wer nur sockel/tage mitgibt, bekommt
  // exakt die Kurve von vorher. Der Name bleibt leer - bei einer Serie steht
  // keine Legende da, und ohne Legende braucht die Linie keinen Namen.
  const reihen = useMemo<Verlaufsserie[]>(
    () =>
      serien && serien.length > 0
        ? serien.slice(0, MAX_SERIEN)
        : [{ name: "", sockel: sockel ?? 0, tage: tage ?? [] }],
    [serien, sockel, tage]
  );

  const daten = useMemo(() => {
    // Je Serie eine eigene Tabelle Tagesnummer -> Tagessumme.
    const summen = reihen.map((reihe) => {
      const summeJeTag = new Map<number, number>();
      for (const eintrag of reihe.tage) {
        const nummer = tagNummer(eintrag.tag);
        summeJeTag.set(nummer, (summeJeTag.get(nummer) ?? 0) + eintrag.hundertstel);
      }
      return summeJeTag;
    });

    const heuteNr = tagNummer(heute);
    // Die frueheste Buchung UEBER ALLE Serien: "Gesamt" soll die ganze
    // Geschichte zeigen, auch wenn die zweite Linie spaeter anfaengt.
    const anfaenge = reihen
      .filter((reihe) => reihe.tage.length > 0)
      .map((reihe) => tagNummer(reihe.tage[0]!.tag));
    const ersteBuchung = anfaenge.length > 0 ? Math.min(...anfaenge) : heuteNr;
    const monatStartDatum = dayToUtcDate(monatStart);

    // Zeitraum-Grenzen ueber die bestehenden Helfer, nicht neu erfunden:
    // mondayOf() fuer den Wochenanfang, der Produktionsmonat vom Server, und
    // addMonths() darauf fuer das halbe und das ganze Jahr. Damit sind "6
    // Monate" und "Jahr" GANZE Produktionsmonate und nicht 180 Tage rueckwaerts
    // - derselbe Schnitt, nach dem die Zahlen ueber der Kurve gerechnet sind.
    const grenze = () => {
      switch (zeitraum) {
        case "woche":
          return tagNummer(mondayOf(heute));
        case "monat":
          return datumNummer(monatStartDatum);
        case "halbjahr":
          return datumNummer(addMonths(monatStartDatum, -5));
        case "jahr":
          return datumNummer(addMonths(monatStartDatum, -11));
        case "gesamt":
          return ersteBuchung;
      }
    };
    const vonNr = Math.min(heuteNr, grenze());

    // Der Anker liegt einen Tag VOR dem Zeitraum und traegt den Sockel. Ohne
    // ihn faehrt eine Buchung am ersten Tag des Zeitraums nicht sichtbar hoch,
    // sondern die Kurve begaenne einfach oben - der Sprung waere weg.
    const ankerNr = vonNr - 1;
    const spanne = heuteNr - vonNr + 1;
    // Ein Schritt fuer alle Serien: nur so liegen ihre Stuetzpunkte auf
    // denselben Tagen, und nur so passt ein Ablese-Index auf alle Linien.
    const schritt = Math.max(1, Math.ceil(spanne / MAX_PUNKTE));

    const gerechnet = reihen.map((reihe, index) => {
      const summeJeTag = summen[index]!;

      // Der Sockel des Zeitraums: alles, was VOR seinem ersten Tag steht.
      // Deshalb braucht die Komponente die ganze Historie und nicht den
      // Ausschnitt (siehe eigenerVerlauf in lib/einheiten.ts).
      let stand = reihe.sockel;
      for (const [nummer, hundertstel] of summeJeTag) {
        if (nummer < vonNr) stand += hundertstel;
      }
      const startwert = stand;

      const punkte: { nr: number; wert: number }[] = [{ nr: ankerNr, wert: stand }];
      for (let nummer = vonNr; nummer <= heuteNr; nummer++) {
        stand += summeJeTag.get(nummer) ?? 0;
        // Jeder Tag wird verrechnet, aber nicht jeder gezeichnet. Der letzte
        // Tag immer - er traegt den Wert, der auch oben in der Karte steht.
        if ((nummer - vonNr) % schritt === 0 || nummer === heuteNr) {
          punkte.push({ nr: nummer, wert: stand });
        }
      }
      return { name: reihe.name, startwert, punkte };
    });

    // Eine Skala fuer alle Linien (Festlegung 5): Minimum und Maximum ueber
    // saemtliche Serien, sonst zeigten zwei getrennt gedehnte Kurven einen
    // Abstand, den es nicht gibt.
    const alleWerte: number[] = [];
    for (const serie of gerechnet) {
      for (const punkt of serie.punkte) alleWerte.push(punkt.wert);
    }
    const hoch = Math.max(...alleWerte);
    const tief = Math.min(...alleWerte);
    // Eine waagerechte Linie (nichts gebucht) braucht trotzdem eine Skala,
    // sonst teilt die Y-Rechnung durch null. Eine Einheit Luft nach oben und
    // unten setzt sie dann in die Mitte.
    const spannweite = hoch - tief;
    const polster = spannweite === 0 ? Math.max(100, Math.abs(hoch) * 0.1) : spannweite * 0.12;
    const obenWert = hoch + polster;
    const untenWert = tief - polster;

    const x = (nummer: number) =>
      RAND_X + ((nummer - ankerNr) / (heuteNr - ankerNr)) * (BREITE - 2 * RAND_X);
    const y = (wert: number) =>
      RAND_OBEN +
      ((obenWert - wert) / (obenWert - untenWert)) * (HOEHE - RAND_OBEN - RAND_UNTEN);

    const boden = HOEHE - RAND_UNTEN;

    const gezeichnet: GezeichneteSerie[] = gerechnet.map((serie, index) => {
      const koordinaten: Koordinate[] = serie.punkte.map((punkt) => ({
        ...punkt,
        x: x(punkt.nr),
        y: y(punkt.wert),
      }));

      // Der Pfad: ein M auf den Anker, danach ein L je Stuetzpunkt. Gerade
      // Stuecke, siehe Festlegung 2 im Kopf.
      const linie = koordinaten
        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        .join(" ");
      // Dieselbe Linie, unten am Rand entlang zurueck und geschlossen: daraus
      // wird die getoente Flaeche unter der Kurve.
      const erster = koordinaten[0]!;
      const letzter = koordinaten[koordinaten.length - 1]!;
      const flaechePfad = `${linie} L ${letzter.x.toFixed(1)} ${boden} L ${erster.x.toFixed(1)} ${boden} Z`;

      return {
        spur: index,
        name: serie.name,
        koordinaten,
        linie,
        flaechePfad,
        startwert: serie.startwert,
        endwert: letzter.wert,
        veraenderung: letzter.wert - serie.startwert,
      };
    });

    return {
      gezeichnet,
      vonNr,
      ankerNr,
      heuteNr,
      spanne,
      // Die Nulllinie gehoert der fuehrenden Serie - sie ist die, ueber die
      // Kopf und Kennzahlen sprechen.
      sockelY: y(gezeichnet[0]!.startwert),
      leer: reihen.every((reihe) => reihe.tage.length === 0),
    };
  }, [reihen, heute, monatStart, zeitraum]);

  const { gezeichnet, vonNr, ankerNr, heuteNr, spanne, sockelY, leer } = daten;

  // Kopf, Kennzahlen und Nulllinie sprechen ueber die FUEHRENDE Serie - die
  // zweite ist der Vergleich und steht in der Legende.
  const fuehrend = gezeichnet[0]!;
  const { startwert, endwert, veraenderung } = fuehrend;

  // Kennzahlen, immer fuer den GEWAEHLTEN Zeitraum gerechnet - nicht fuer den
  // Monat, egal was der Umschalter sagt. "Je Woche" ist der Tagesschnitt mal
  // sieben und damit dieselbe Auskunft in der Waehrung, in der Emil denkt.
  const proTag = veraenderung / spanne;
  const proWoche = proTag * 7;

  const gelesenerPunkt = gelesen === null ? null : (fuehrend.koordinaten[gelesen] ?? null);
  const angezeigterWert = gelesenerPunkt ? gelesenerPunkt.wert : endwert;
  const angezeigteVeraenderung = gelesenerPunkt
    ? gelesenerPunkt.wert - startwert
    : veraenderung;

  // Der abgelesene Punkt je Serie. Ein Index passt auf alle, weil alle Serien
  // dieselben Stuetzstellen haben - gleiche Spanne, gleicher Schritt.
  const ablesungen: { serie: GezeichneteSerie; punkt: Koordinate }[] = [];
  if (gelesen !== null) {
    for (const serie of gezeichnet) {
      const punkt = serie.koordinaten[gelesen];
      if (punkt) ablesungen.push({ serie, punkt });
    }
  }

  const achseLinks =
    spanne > MONATSACHSE_AB
      ? monatJahrFormat.format(nummerDatum(vonNr))
      : dayDisplayFormat.format(nummerDatum(vonNr));

  const ariaLabel =
    gezeichnet.length === 1
      ? `Verlauf der ${einheitWort} seit ${achseLinks}: von ${format(
          startwert
        )} auf ${format(endwert)} ${einheitWort}.`
      : `Verlauf der ${einheitWort} seit ${achseLinks}: ${gezeichnet
          .map(
            (serie) =>
              `${serie.name} von ${format(serie.startwert)} auf ${format(serie.endwert)}`
          )
          .join(", ")} ${einheitWort}.`;

  const lesen = useCallback(
    (clientX: number) => {
      const rahmen = flaeche.current?.getBoundingClientRect();
      if (!rahmen || rahmen.width === 0) return;
      // Die Umkehrung von x(): Bildschirmpunkt -> Anteil -> Tagesnummer.
      const anteil = (clientX - rahmen.left) / rahmen.width;
      const inViewBox = anteil * BREITE;
      const roh = (inViewBox - RAND_X) / (BREITE - 2 * RAND_X);
      const ziel = ankerNr + roh * (heuteNr - ankerNr);

      // Gesucht wird auf der fuehrenden Serie - alle anderen haben dieselben
      // Stuetzstellen, der Index gilt also fuer jede Linie.
      const koordinaten = fuehrend.koordinaten;
      let besterIndex = 0;
      let besterAbstand = Infinity;
      for (let i = 0; i < koordinaten.length; i++) {
        const abstand = Math.abs(koordinaten[i]!.nr - ziel);
        if (abstand < besterAbstand) {
          besterAbstand = abstand;
          besterIndex = i;
        }
      }
      setGelesen(besterIndex);
    },
    [fuehrend, ankerNr, heuteNr]
  );

  if (leer) {
    return (
      <div className={`${card} px-6 py-10 text-center`}>
        <p className="text-sm font-medium text-ink">Noch keine Kurve</p>
        <p className="mt-1 text-sm text-ink-muted">
          Sobald du deine erste Zahl einträgst, wächst hier dein Verlauf.
        </p>
      </div>
    );
  }

  // --- Wo das Badge steht ---------------------------------------------------
  // Waagerecht klemmt es sich selbst in die Flaeche: es sitzt an der
  // x-Position und wird um DENSELBEN Prozentsatz seiner EIGENEN Breite
  // zurueckgeschoben. Bei 0 % steht es links buendig, bei 50 % mittig, bei
  // 100 % rechts buendig - eine Klemme ohne Messung des Elements.
  //
  // Senkrecht haengt es am HOECHSTEN abgelesenen Punkt (kleinstes y), damit es
  // bei zwei Linien ueber beiden steht, und mit Abstand darueber, damit die
  // Fingerkuppe darunter bleibt. Nur wenn oben kein Platz mehr ist, klappt es
  // unter den Punkt.
  const badgeX = gelesenerPunkt
    ? Math.min(100, Math.max(0, (gelesenerPunkt.x / BREITE) * 100)).toFixed(1)
    : "0";
  const badgeYRoh = ablesungen.length > 0 ? Math.min(...ablesungen.map((a) => a.punkt.y)) : 0;
  const badgeUnten = badgeYRoh / HOEHE < BADGE_KIPPT;

  return (
    <div className={`${card} p-5 sm:p-6`}>
      {/* --- Der Kopf: eine Zahl, gross ----------------------------------
          Unter dem Finger wechselt sie auf den Stand des angetippten Tages -
          wie im Depot. Ohne Finger steht dort der aktuelle Gesamtstand, und
          zwar exakt derselbe wie in der Karte "Eigeneinheiten insgesamt":
          Sockel plus alle Buchungen, dieselbe Rechnung. Bei zwei Linien
          spricht der Kopf ueber die erste; die zweite steht in der Legende. */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className={kicker}>
          {ZEITRAEUME.find((eintrag) => eintrag.wert === zeitraum)!.lang}
        </span>
        <span className="text-xs text-ink-soft">
          {gelesenerPunkt
            ? vollDatumFormat.format(nummerDatum(gelesenerPunkt.nr))
            : "Stand heute"}
        </span>
      </div>

      <p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums text-ink">
        {format(angezeigterWert)}
      </p>
      <p className="mt-1 text-13 font-medium text-ink-muted">
        <span
          className={cn(
            "tabular-nums",
            angezeigteVeraenderung > 0
              ? "text-emerald-700"
              : angezeigteVeraenderung < 0
                ? "text-red-600"
                : "text-ink-muted"
          )}
        >
          {angezeigteVeraenderung > 0 ? "+" : ""}
          {format(angezeigteVeraenderung)}
        </span>{" "}
        {zeitraum === "gesamt" ? "seit dem Start" : `seit ${achseLinks}`}
      </p>

      {/* --- Die Legende --------------------------------------------------
          Nur bei zwei Linien: eine einzelne Kurve braucht keine Zuordnung,
          und eine Legende mit einem Eintrag ist Zierrat. Der Wert wandert mit
          dem Finger mit, damit auch die zweite Serie eine abgelesene Zahl
          bekommt - im Kopf steht nur die erste. */}
      {gezeichnet.length > 1 && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-11 text-ink-muted">
          {gezeichnet.map((serie) => (
            <span key={serie.spur} className="inline-flex items-center gap-1.5">
              <span
                aria-hidden
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  SERIEN_TON[serie.spur]!.flaeche
                )}
              />
              <span>{serie.name}</span>
              <span className="font-semibold tabular-nums text-ink">
                {format(
                  gelesen === null ? serie.endwert : (serie.koordinaten[gelesen]?.wert ?? serie.endwert)
                )}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* --- Die Kurve ---------------------------------------------------
          touch-action "pan-y": senkrecht scrollt weiter die Seite, waagerecht
          faehrt der Finger die Kurve ab. Ohne das muesste man sich zwischen
          einer bedienbaren Kurve und einer scrollbaren Seite entscheiden. */}
      <div
        ref={flaeche}
        onPointerDown={(event) => {
          try {
            event.currentTarget.setPointerCapture(event.pointerId);
          } catch {
            // Weiter ohne Einfangen - das Ablesen funktioniert trotzdem.
          }
          lesen(event.clientX);
        }}
        onPointerMove={(event) => {
          // Die Maus liest im Vorbeifahren, der Finger nur beim Ziehen -
          // sonst bliebe nach einem Tipp ein Wert stehen, den niemand mehr
          // wegbekommt.
          if (event.pointerType === "mouse" || event.buttons > 0) {
            lesen(event.clientX);
          }
        }}
        onPointerUp={() => setGelesen(null)}
        onPointerCancel={() => setGelesen(null)}
        onPointerLeave={() => setGelesen(null)}
        style={{ touchAction: "pan-y" }}
        className="relative mt-4 cursor-crosshair"
      >
        <svg
          viewBox={`0 0 ${BREITE} ${HOEHE}`}
          preserveAspectRatio="none"
          className="block h-40 w-full text-akzent sm:h-56"
          role="img"
          aria-label={ariaLabel}
        >
          <defs>
            {/* Die Fuellung erbt ihre Farbe ueber currentColor vom <svg> und
                damit von der Tailwind-Klasse text-akzent - im Dunkeln kippt
                sie mit, ohne dass hier etwas steht. Sie gehoert der ersten
                Serie; die traegt denselben Ton (siehe SERIEN_TON). */}
            <linearGradient id={verlaufId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Wo der Zeitraum angefangen hat. Alles unter dieser Linie heisst:
              du stehst schlechter da als am ersten Tag - der sichtbare Preis
              eines Stornos. */}
          <line
            x1={RAND_X}
            y1={sockelY}
            x2={BREITE - RAND_X}
            y2={sockelY}
            stroke="currentColor"
            strokeWidth={1}
            strokeDasharray="4 5"
            vectorEffect="non-scaling-stroke"
            className="text-line-strong"
          />

          {/* Nur die fuehrende Serie bekommt die Flaeche - Festlegung 5. */}
          <path d={fuehrend.flaechePfad} fill={`url(#${verlaufId})`} stroke="none" />

          {/* Rueckwaerts gezeichnet: die fuehrende Serie kommt zuletzt und
              liegt damit oben, wo sich zwei Linien kreuzen. */}
          {gezeichnet
            .slice()
            .reverse()
            .map((serie) => (
              <path
                key={serie.spur}
                d={serie.linie}
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                className={SERIEN_TON[serie.spur]!.linie}
              />
            ))}

          {gelesenerPunkt && (
            <line
              x1={gelesenerPunkt.x}
              y1={RAND_OBEN}
              x2={gelesenerPunkt.x}
              y2={HOEHE - RAND_UNTEN}
              stroke="currentColor"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              className="text-ink-soft"
            />
          )}
        </svg>

        {/* Der Ablesepunkt als HTML: ein Kreis im verzerrt gezogenen SVG waere
            eine Ellipse. Prozentangaben treffen dieselbe Stelle, weil das SVG
            die Flaeche genau ausfuellt. Der Ring drumherum ist derselbe Ton mit
            wenig Deckung - er hebt den Punkt aus der Linie heraus, ohne die
            Kartenfarbe treffen zu muessen (die ist Milchglas). Je Linie einer. */}
        {ablesungen.map(({ serie, punkt }) => (
          <span
            key={serie.spur}
            aria-hidden
            style={{
              left: `${(punkt.x / BREITE) * 100}%`,
              top: `${(punkt.y / HOEHE) * 100}%`,
            }}
            className={cn(
              "pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4",
              SERIEN_TON[serie.spur]!.flaeche,
              SERIEN_TON[serie.spur]!.ring
            )}
          />
        ))}

        {/* --- Das Ablese-Badge ---------------------------------------------
            Festlegung 6: der Kartenkopf sagt dasselbe, steht beim Ablesen aber
            ausserhalb des Blickfelds. Hier steht die Auskunft dort, wo der
            Finger hinsieht - Datum, darunter die Werte je Linie NEBENeinander.
            Nebeneinander, weil das Badge sonst eine Zeile hoeher wuerde und
            oben aus der Flaeche stiege; in die Breite darf es wachsen, die
            Klemme faengt das ab. Die Zuordnung macht derselbe Farbpunkt wie in
            der Legende. */}
        {gelesenerPunkt && (
          <div
            aria-hidden
            style={{
              left: `${badgeX}%`,
              top: `${(badgeYRoh / HOEHE) * 100}%`,
              transform: `translate(-${badgeX}%, ${
                badgeUnten ? BADGE_ABSTAND : `calc(-100% - ${BADGE_ABSTAND})`
              })`,
            }}
            className="glas-stark pointer-events-none absolute z-10 whitespace-nowrap rounded-xl border border-line px-2.5 py-1.5 text-11 leading-tight schatten-pop"
          >
            <p className="tabular-nums text-ink-soft">
              {vollDatumFormat.format(nummerDatum(gelesenerPunkt.nr))}
            </p>
            <div className="mt-1 flex items-center gap-x-3">
              {ablesungen.map(({ serie, punkt }) => (
                <span key={serie.spur} className="flex items-center gap-1.5">
                  {gezeichnet.length > 1 && (
                    <span
                      className={cn(
                        "h-1.5 w-1.5 shrink-0 rounded-full",
                        SERIEN_TON[serie.spur]!.flaeche
                      )}
                    />
                  )}
                  <span className="font-semibold tabular-nums text-ink">
                    {format(punkt.wert)}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Die Achsenbeschriftung als HTML - siehe Festlegung 3 im Kopf. */}
      <div className="mt-1 flex items-baseline justify-between text-11 tabular-nums text-ink-soft">
        <span>{achseLinks}</span>
        <span>heute</span>
      </div>

      {/* --- Der Umschalter ----------------------------------------------
          segmentKnopf bringt min-h-11 mit; am Handy darf die Gruppe lieber
          seitlich scrollen als umbrechen (Muster: WettbewerbNav). */}
      <div className={cn(segmentGruppe, "no-scrollbar mt-4 w-full overflow-x-auto")}>
        {ZEITRAEUME.map(({ wert, kurz, lang }) => (
          <button
            key={wert}
            type="button"
            onClick={() => {
              setZeitraum(wert);
              setGelesen(null);
            }}
            aria-pressed={wert === zeitraum}
            aria-label={lang}
            className={cn(
              segmentKnopf(wert === zeitraum),
              "flex-1 shrink-0 whitespace-nowrap"
            )}
          >
            <span className="sm:hidden">{kurz}</span>
            <span className="hidden sm:inline">{lang}</span>
          </button>
        ))}
      </div>

      {/* --- Die drei Zahlen daneben -------------------------------------- */}
      {/* Am Handy nimmt die Leitzahl die ganze erste Reihe, die beiden
          Durchschnitte teilen sich die zweite. Zu dritt nebeneinander blieben
          bei 375 px rund 72 Pixel Innenraum je Kachel - "+1.234,50" braucht in
          tabular-nums das Anderthalbfache und liefe aus der Kachel heraus. Ab
          sm stehen wieder alle drei in einer Reihe. */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div className="col-span-2 sm:col-span-1">
          <KennzahlKachel
            wert={`${veraenderung > 0 ? "+" : ""}${format(veraenderung)}`}
            bezeichnung="im Zeitraum"
            ton={veraenderung > 0 ? "erfolg" : veraenderung < 0 ? "gefahr" : "neutral"}
          />
        </div>
        <KennzahlKachel wert={format(proTag)} bezeichnung="je Tag" />
        <KennzahlKachel wert={format(proWoche)} bezeichnung="je Woche" />
      </div>

      <p className="mt-3 text-xs text-ink-muted">{fussnote ?? FUSSNOTE_STANDARD}</p>
    </div>
  );
}
