import { cn, kicker as kickerStil, pageTitle } from "@/components/ui";
import Link from "next/link";
import SeitenWerkzeuge from "@/components/SeitenWerkzeuge";

// Der Kopf einer Seite: woher man kommt, wo man ist, was hier geht.
//
// Bisher baute jede Seite ihren Kopf selbst - mal Titel allein, mal Titel mit
// Unterzeile, mal mit einem Knopf rechts, jedes Mal mit anderen Abstaenden.
// Zusammengefasst, damit der Einstieg in jede Seite gleich aussieht.

export default function SeitenKopf({
  kicker,
  titel,
  unterzeile,
  aktion,
  className,
  werkzeuge = false,
  zurueck,
}: {
  /** Kleine Zeile darueber - nennt den Bereich, nicht die Seite. */
  kicker?: string;
  titel: string;
  unterzeile?: React.ReactNode;
  /** Rechts aussen, z. B. "Beenden" oder ein Filter. */
  aktion?: React.ReactNode;
  className?: string;
  werkzeuge?: boolean;
  zurueck?: { href: string; label: string };
}) {
  return (
    <header className={cn("crm-page-head space-y-3", werkzeuge && "crm-page-head-with-tools", className)}>
      {zurueck && <Link href={zurueck.href} className="inline-flex min-h-11 items-center gap-2 text-base font-medium text-link"><span aria-hidden>‹</span>{zurueck.label}</Link>}
      <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        {kicker && <p className={cn(kickerStil, "mb-1")}>{kicker}</p>}
        <h1 className={pageTitle}>{titel}</h1>
        {unterzeile && (
          <p className="mt-1.5 text-sm text-ink-muted">{unterzeile}</p>
        )}
      </div>
      {werkzeuge && <div className="md:hidden"><SeitenWerkzeuge /></div>}
      </div>
      {aktion && <div className="flex flex-wrap items-center justify-end gap-2">{aktion}</div>}
    </header>
  );
}
