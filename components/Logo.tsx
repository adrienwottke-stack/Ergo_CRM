// Abstrakte Wortmarke: Signet (aufsteigender Kurs im Rondell) + Schriftzug.

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className ?? "h-8 w-8"}
      aria-hidden
      fill="none"
    >
      <rect width="32" height="32" rx="9" fill="var(--color-navy-800)" />
      <path
        d="M8 20.5 13.5 15l3.5 3.5 7-7.5"
        stroke="var(--color-gold-400)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20.5 11h3.5v3.5"
        stroke="var(--color-gold-400)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Wordmark({
  sub,
  onDark = false,
}: {
  sub?: string;
  onDark?: boolean;
}) {
  return (
    // min-w-0 + truncate: die Wortmarke darf schrumpfen statt die Kopfzeile
    // breiter als den Bildschirm zu machen (sonst scrollt die Seite seitlich
    // und der sticky Header endet vor dem rechten Rand).
    <span className="flex min-w-0 items-center gap-2.5">
      <LogoMark className="h-8 w-8 shrink-0" />
      <span className="min-w-0 leading-tight">
        <span
          className={`block truncate text-[15px] font-semibold tracking-tight ${
            onDark ? "text-white" : "text-slate-900"
          }`}
        >
          Ergo CRM
        </span>
        {sub && (
          <span
            className={`hidden truncate text-[11px] font-medium sm:block ${
              onDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {sub}
          </span>
        )}
      </span>
    </span>
  );
}
