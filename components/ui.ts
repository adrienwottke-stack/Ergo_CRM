// Gemeinsame Klassen-Bausteine, damit alle Seiten dieselbe Sprache sprechen.
//
// Designlinie "Werkzeug": flache weisse Flaechen, 1-px-Haarlinien statt
// Schatten, ein Radius-System (12 px Container, 8 px Bedienelemente,
// rund nur fuer Badges) und Zahlen immer mit Tabellenziffern.

export const card = "rounded-xl border border-slate-200 bg-surface";

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
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-akzent px-5 py-2 text-sm font-medium text-white transition hover:bg-akzent-stark active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600";

export const btnSecondary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-surface px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600";

export const btnGhost =
  "text-sm font-medium text-slate-500 transition hover:text-slate-900";

export const input =
  "mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-surface px-3.5 py-2 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/15";

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
      ? "bg-akzent text-white"
      : "border border-slate-300 bg-surface text-slate-600 hover:border-slate-400 hover:text-slate-900"
  }`;
