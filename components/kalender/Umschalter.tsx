import Link from "next/link";
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
  { wert: "liste", label: "Agenda" },
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
    "crm-calendar-step";

  return (
    <div className="crm-calendar-toolbar">
      <div className="crm-calendar-date">
        <h2 id="kalender-zeitraum">{titel}</h2>
        <nav aria-label="Zeitraum wechseln" className="crm-calendar-date-actions">
        <Link href={href(ansicht, zurueck)} aria-label="Vorheriger Zeitraum" className={springKnopf}>
          <ArrowLeftIcon className="h-4 w-4" />
        </Link>
        <Link href={href(ansicht, vor)} aria-label="Nächster Zeitraum" className={springKnopf}>
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
          <Link
            href={href(ansicht, heute)}
            className="crm-calendar-today"
            aria-current={tag === heute ? "date" : undefined}
          >
            Heute
          </Link>
        </nav>
      </div>

      <nav className="crm-view-tabs crm-calendar-views" aria-label="Kalenderansichten">
        {ANSICHTEN.map(({ wert, label }) => (
          <Link
            key={wert}
            href={href(wert, tag)}
            aria-current={wert === ansicht ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
