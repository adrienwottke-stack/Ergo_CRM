import Link from "next/link";
import { cn } from "@/components/ui";
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
    "flex h-11 w-11 items-center justify-center rounded-lg border border-line-strong bg-surface text-slate-600 transition hover:border-slate-400 hover:text-slate-900";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Link href={href(ansicht, zurueck)} aria-label="Zurück" className={springKnopf}>
          <ArrowLeftIcon className="h-4 w-4" />
        </Link>
        <Link href={href(ansicht, vor)} aria-label="Vor" className={springKnopf}>
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
        <h2 className="ml-1 text-base font-semibold tracking-tight text-slate-900">
          {titel}
        </h2>
        {tag !== heute && (
          <Link
            href={href(ansicht, heute)}
            className="ml-1 text-sm font-medium text-navy-600 hover:underline"
          >
            Heute
          </Link>
        )}
      </div>

      {/* Segmentgruppe. Am Handy scrollt sie lieber, als umzubrechen. */}
      <div className="flex gap-0.5 rounded-lg bg-sunken p-0.5">
        {ANSICHTEN.map(({ wert, label }) => (
          <Link
            key={wert}
            href={href(wert, tag)}
            aria-current={wert === ansicht ? "page" : undefined}
            className={cn(
              "min-h-9 rounded-[6px] px-3 py-1.5 text-sm font-medium transition",
              wert === ansicht
                ? "bg-surface text-slate-900 schatten-karte"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
