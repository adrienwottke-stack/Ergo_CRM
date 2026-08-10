// Gemeinsame Klassen-Bausteine, damit alle Seiten dieselbe Sprache sprechen.

export const card =
  "rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgb(15_23_42/0.04),0_8px_24px_-12px_rgb(15_23_42/0.12)]";

export const btnPrimary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-navy-800 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-navy-900 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-500";

export const btnSecondary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-500";

export const btnGhost =
  "text-sm font-medium text-slate-500 transition hover:text-slate-900";

export const input =
  "mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-navy-500 focus:outline-none focus:ring-4 focus:ring-navy-500/10";

export const label = "block text-[13px] font-medium text-slate-600";

export const pageTitle =
  "text-[1.6rem] font-semibold tracking-tight text-slate-900";

export const sectionTitle = "text-base font-semibold text-slate-900";

export const th =
  "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 first:pl-5 last:pr-5";

export const td = "px-4 py-3.5 first:pl-5 last:pr-5";

export const filterPill = (active: boolean) =>
  `inline-flex min-h-9 items-center rounded-full px-3.5 text-sm font-medium transition ${
    active
      ? "bg-navy-800 text-white shadow-sm"
      : "border border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900"
  }`;
