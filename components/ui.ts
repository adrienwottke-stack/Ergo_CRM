// Gemeinsame Klassen-Bausteine, damit alle Seiten dieselbe Sprache sprechen.
//
// Designlinie "Werkzeug": flache weisse Flaechen, 1-px-Haarlinien statt
// Schatten, ein Radius-System (12 px Container, 8 px Bedienelemente,
// rund nur fuer Badges) und Zahlen immer mit Tabellenziffern.

export const card = "rounded-xl border border-slate-200 bg-white";

export const btnPrimary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-navy-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-navy-950 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600";

export const btnSecondary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600";

export const btnGhost =
  "text-sm font-medium text-slate-500 transition hover:text-slate-900";

export const input =
  "mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/15";

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
      ? "bg-navy-900 text-white"
      : "border border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900"
  }`;
