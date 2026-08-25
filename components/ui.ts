// Gemeinsame Klassen-Bausteine, damit alle Seiten dieselbe Sprache sprechen.
//
// Designlinie "Werkzeug": ruhige Flaechen, klare Kanten, ein Radius-System
// (12 px Container, 8 px Bedienelemente, rund nur fuer Badges) und Zahlen
// immer mit Tabellenziffern.
//
// Frueher hiess die Linie zusaetzlich "flache weisse Flaechen, 1-px-Haarlinien
// statt Schatten". Das war konsequent, aber die Oberflaeche wurde dadurch flach
// und grau: nichts lag vor etwas anderem, alles hatte dasselbe Gewicht. Jetzt
// tragen die Haarlinien einen sehr weichen, navy-getoenten Schatten. Einzeln
// sieht man ihn kaum - aber die Karte loest sich vom Grund, und genau das hat
// gefehlt.
//
// Farben kommen ueber die semantischen Tokens aus globals.css (surface, line,
// ink, akzent), nicht mehr ueber die Rampe. Nur so kippt der Dunkelmodus
// sauber mit.

/** Klassen zusammensetzen, ohne eine Abhaengigkeit dafuer zu holen. */
export function cn(...teile: Array<string | false | null | undefined>) {
  return teile.filter(Boolean).join(" ");
}

export const card = "rounded-xl border border-line bg-surface shadow-card";

/** Karte, die auf einen Klick wartet: hebt sich unter dem Zeiger leicht an. */
export const cardInteractive = `${card} transition duration-200 hover:-translate-y-px hover:border-line-strong hover:shadow-lift`;

/** Eingesenkte Flaeche - fuer Balken-Rinnen, Segment-Gruppen, Code. */
export const surfaceSunken = "bg-sunken";

// Spaltenbreiten. Eine Seite waehlt nicht mehr selbst eine Zahl, sondern die
// Rolle ihrer Spalte - dann wachsen alle Seiten gleich mit dem Bildschirm.
//
// Zwei Dinge greifen ineinander: die Wurzel-Schriftgroesse waechst ab 1280 px
// mit der Fensterbreite (siehe globals.css), und diese Klassen legen ab den
// grossen Haltepunkten je eine Stufe drauf. Auf dem Notebook bleibt alles wie
// vorher, am 27-Zoll-Schirm steht die Arbeit nicht mehr als schmaler Streifen
// in der Mitte.
//
// Nach oben ist trotzdem Schluss: eine Zeile, die ueber rund 90 Zeichen
// laeuft, liest niemand mehr gern.

// Formulare und Dialogseiten - eine Eingabe unter der anderen.
export const columnNarrow = "mx-auto w-full max-w-2xl xl:max-w-3xl";

// Die uebliche Arbeitsspalte: Liste, Verlauf, Durchlauf.
export const column = "mx-auto w-full max-w-3xl xl:max-w-4xl 2xl:max-w-5xl";

// Uebersichten mit Tabellen, die Platz brauchen.
export const columnWide = "mx-auto w-full max-w-5xl xl:max-w-6xl";

// Kopfzeile und Inhalt teilen sich dieselbe Begrenzung - sonst laeuft die
// Navigation gegen einen anderen Rand als die Seite darunter.
export const shell = "mx-auto w-full max-w-6xl 2xl:max-w-7xl";

// Seitenrand: waechst in Stufen mit, damit der Inhalt am grossen Schirm nicht
// an der Fensterkante klebt.
export const gutter = "px-4 sm:px-6 lg:px-8";

export const btnPrimary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-akzent px-5 py-2 text-sm font-medium text-white shadow-card transition hover:bg-akzent-stark hover:shadow-lift active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600";

export const btnSecondary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line-strong bg-surface px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600";

export const btnGhost =
  "text-sm font-medium text-slate-500 transition hover:text-slate-900";

export const input =
  "mt-1.5 min-h-11 w-full rounded-lg border border-line-strong bg-surface px-3.5 py-2 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/15";

export const label = "block text-[13px] font-medium text-slate-600";

export const pageTitle =
  "text-[1.75rem] font-semibold tracking-[-0.02em] text-slate-900";

export const sectionTitle = "text-base font-semibold tracking-tight text-slate-900";

export const th =
  "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 first:pl-5 last:pr-5";

// Kleines Überschriften-Label über Kennzahlen ("Zahlen-DNA")
export const kicker =
  "text-[11px] font-semibold uppercase tracking-wider text-slate-500";

// Kennzahlen: gross, ruhig, Ziffern buendig untereinander.
export const statValue =
  "font-semibold tabular-nums tracking-tight text-slate-900";

export const td = "px-4 py-3.5 first:pl-5 last:pr-5";

export const filterPill = (active: boolean) =>
  `inline-flex min-h-9 items-center rounded-full px-3.5 text-sm font-medium transition ${
    active
      ? "bg-akzent text-white shadow-card"
      : "border border-line-strong bg-surface text-slate-600 hover:border-slate-400 hover:text-slate-900"
  }`;

/**
 * Die fuenf Toene der Anwendung. Vorher stand an jeder Stelle eine eigene
 * Handschrift ("bg-red-50/70", "bg-emerald-50/60", "bg-amber-50"), was die
 * Seiten unruhig gemacht hat. Ein Ton heisst jetzt immer dasselbe:
 * info = es laeuft etwas, erfolg = erledigt, warnung = es hakt,
 * gefahr = jemand wartet auf dich.
 */
export type Ton = "neutral" | "info" | "erfolg" | "warnung" | "gefahr";

const flaechen: Record<Ton, string> = {
  neutral: "border-line bg-slate-50",
  info: "border-navy-200 bg-navy-50",
  erfolg: "border-emerald-200 bg-emerald-50",
  warnung: "border-amber-200 bg-amber-50",
  gefahr: "border-red-200 bg-red-50",
};

/** Getoente Flaeche mit passender Kante. */
export const flaeche = (ton: Ton = "neutral") =>
  `rounded-xl border shadow-card ${flaechen[ton]}`;

const chips: Record<Ton, string> = {
  neutral: "bg-slate-100 text-slate-600",
  info: "bg-navy-50 text-navy-700",
  erfolg: "bg-emerald-50 text-emerald-700",
  warnung: "bg-amber-50 text-amber-800",
  gefahr: "bg-red-50 text-red-700",
};

/** Kleines rundes Etikett fuer Zaehler, Zustaende, Merkmale. */
export const chip = (ton: Ton = "neutral") =>
  `inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${chips[ton]}`;

/** Punktfarben derselben Tonleiter - fuer Ampeln, Marker, Zeitleisten. */
export const punkt: Record<Ton, string> = {
  neutral: "bg-slate-300",
  info: "bg-navy-500",
  erfolg: "bg-emerald-500",
  warnung: "bg-amber-400",
  gefahr: "bg-red-500",
};
