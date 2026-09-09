import Link from "next/link";
import { segmentGruppe, segmentKnopf } from "@/components/ui";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/icons";

// Ansicht waehlen und blaettern.
//
// Reine Links, kein Client-Javascript: die ganze Anwendung faellt ohne JS auf
// echte Server-Navigation zurueck (siehe next.config.ts), und ein Kalender,
// dessen Blaetterpfeile dann tot sind, waere die auffaelligste Luecke darin.

export type Ansicht = "monat" | "woche" | "tag" | "liste";

export const ANSICHTEN: { wert: Ansicht; label: string }[] = [
  { wert: "monat", label: "Monat" },
  { wert: "woche", label: "Woche" },
  { wert: "tag", label: "Tag" },
  { wert: "liste", label: "Liste" },
];

function href(ansicht: Ansicht, tag: string) {
  return `/kalender?ansicht=${ansicht}&tag=${tag}`;
}

export function Umschalter({
  ansicht,
  tag,
  heute,
  zurueck,
  vor,
  titel,
}: {
  ansicht: Ansicht;
  tag: string;
  heute: string;
  zurueck: string;
  vor: string;
  titel: string;
}) {
  const springKnopf =
    "flex h-11 w-11 items-center justify-center rounded-lg border border-line-strong bg-surface text-ink-muted transition hover:border-line-strong hover:text-ink";

  return (
    <div className="space-y-3">
      <div className="flex min-h-11 items-center gap-2">
        <h2 className="min-w-0 flex-1 truncate text-base font-semibold tracking-tight text-ink">
          {titel}
        </h2>
        {tag !== heute && (
          <Link
            href={href(ansicht, heute)}
            className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-link hover:text-link-stark"
          >
            Heute
          </Link>
        )}
        <Link href={href(ansicht, zurueck)} aria-label="Vorheriger Zeitraum" className={springKnopf}>
          <ArrowLeftIcon className="h-4 w-4" />
        </Link>
        <Link href={href(ansicht, vor)} aria-label="Nächster Zeitraum" className={springKnopf}>
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>

      <div className={`${segmentGruppe} w-full`}>
        {ANSICHTEN.map(({ wert, label }) => (
          <Link
            key={wert}
            href={href(wert, tag)}
            aria-current={wert === ansicht ? "page" : undefined}
            className={`${segmentKnopf(wert === ansicht)} min-w-0 flex-1 px-2 sm:px-3.5`}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
