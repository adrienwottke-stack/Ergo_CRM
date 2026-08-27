// Gemeinsame Klassen-Bausteine, damit alle Seiten dieselbe Sprache sprechen.
//
// Designlinie "Liquid Glass - Werkzeug auf Glas": ruhige transluzente
// Flaechen statt satter Farbe, Haarlinien statt harter Kanten, Pillen statt
// eckiger Knoepfe. Radius-System: 16 px fuer Karten, 12 px fuer Felder, Pille
// (voll gerundet) fuer Knoepfe und Badges. Zahlen immer mit Tabellenziffern.
//
// Glas mit echtem Weichzeichner (backdrop-filter, die "glas"-Utilities aus
// globals.css) ist ausschliesslich schwebendem Chrome vorbehalten - Kopfzeile,
// Modal, Undo-Leiste. Karten, Chips und Felder hier bleiben Milchglas OHNE
// Weichzeichner (Token "surface"): halbtransparent genug, um den
// Tapeten-Canvas dahinter durchscheinen zu lassen, aber ohne die Kosten und
// Falstricke von Blur auf einer scrollenden Flaeche.
//
// Farben kommen ueber die semantischen Tokens aus globals.css (surface, line,
// ink, akzent), nicht mehr ueber die Rampe. Nur so kippt der Dunkelmodus
// sauber mit.

/** Klassen zusammensetzen, ohne eine Abhaengigkeit dafuer zu holen. */
export function cn(...teile: Array<string | false | null | undefined>) {
  return teile.filter(Boolean).join(" ");
}

export const card = "rounded-2xl border border-line bg-surface schatten-karte";

/** Karte, die auf einen Klick wartet: hebt sich unter dem Zeiger leicht an. */
export const cardInteractive = `${card} transition duration-200 hover:-translate-y-px hover:border-line-strong hover:schatten-hoch`;

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
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-akzent px-5 py-2 text-sm font-semibold text-white schatten-karte transition hover:bg-akzent-stark hover:schatten-hoch active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-akzent";

export const btnSecondary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line-strong bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:border-line-strong hover:bg-sunken hover:text-ink active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-akzent";

export const btnGhost =
  "text-sm font-medium text-akzent transition hover:text-akzent-stark";

const inputBasis =
  "min-h-11 w-full rounded-xl border border-transparent bg-sunken px-3.5 py-2 text-sm text-ink transition placeholder:text-ink-soft focus:border-akzent focus:outline-none focus:ring-2 focus:ring-akzent/20";

/** Eingabefeld unter einem <label> - der Abstand nach oben steckt schon drin. */
export const input = `mt-1.5 ${inputBasis}`;

// Dasselbe Feld ohne diesen Abstand - fuer Felder, die ohne Beschriftung
// darueber stehen (Suchfeld, Zeile mit Knopf daneben).
//
// Als eigene Konstante und NICHT als `${input} mt-0`: zwei Tailwind-Klassen
// derselben Eigenschaft entscheiden nicht nach der Reihenfolge im String,
// sondern nach der im erzeugten Stylesheet - das haette mal so und mal so
// ausgesehen.
export const inputBlank = inputBasis;

export const label = "block text-13 font-medium text-ink-muted";

export const pageTitle =
  "text-[2.125rem] font-bold leading-[1.15] tracking-[-0.022em] text-ink";

export const sectionTitle = "text-[1.0625rem] font-semibold tracking-tight text-ink";

export const th =
  "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-soft first:pl-5 last:pr-5";

// Kleines Überschriften-Label über Kennzahlen ("Zahlen-DNA")
export const kicker =
  "text-[11px] font-semibold uppercase tracking-wider text-ink-soft";

export const td = "px-4 py-3.5 first:pl-5 last:pr-5";

export const filterPill = (active: boolean) =>
  `inline-flex min-h-9 items-center rounded-full px-3.5 text-sm font-medium transition ${
    active
      ? "bg-akzent text-white schatten-karte"
      : "border border-line-strong bg-surface text-ink-muted hover:text-ink"
  }`;

// Die EINE Segmented-Control der App: zwei bis vier gleichwertige
// Ansichten nebeneinander, in einer eingesenkten Kapsel. Umschalter.tsx und
// WettbewerbNav.tsx bauen ihre Umschalter bisher noch selbst - die stellen
// erst eine spaetere Welle auf diesen Baustein um.
export const segmentGruppe = "inline-flex items-center gap-0.5 rounded-full bg-sunken p-1";

export const segmentKnopf = (aktiv: boolean) =>
  `inline-flex min-h-9 items-center justify-center rounded-full px-3.5 text-sm font-medium transition${
    aktiv ? " bg-surface text-ink schatten-karte" : " text-ink-muted hover:text-ink"
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
  `rounded-2xl border schatten-karte ${flaechen[ton]}`;

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
