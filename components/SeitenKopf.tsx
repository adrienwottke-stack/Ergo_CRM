import { cn, kicker as kickerStil, pageTitle } from "@/components/ui";

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
}: {
  /** Kleine Zeile darueber - nennt den Bereich, nicht die Seite. */
  kicker?: string;
  titel: string;
  unterzeile?: React.ReactNode;
  /** Rechts aussen, z. B. "Beenden" oder ein Filter. */
  aktion?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        {kicker && <p className={cn(kickerStil, "mb-1")}>{kicker}</p>}
        <h1 className={pageTitle}>{titel}</h1>
        {unterzeile && (
          <p className="mt-1.5 text-sm text-ink-muted">{unterzeile}</p>
        )}
      </div>
      {aktion && <div className="shrink-0">{aktion}</div>}
    </div>
  );
}
