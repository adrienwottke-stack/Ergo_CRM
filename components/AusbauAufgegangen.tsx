import Link from "next/link";
import { ausbauGesehen } from "@/app/(app)/heute/actions";
import { card } from "@/components/ui";
import { UnlockIcon } from "@/components/icons";

// Der eine Moment, in dem die App ueber den Ausbau spricht
// (docs/ausbau-plan.md, Abschnitt 3).
//
// Es gibt keinen Zaehler, keinen Fortschrittsbalken und nirgends das Wort
// "Ausbau" - eine vierte Zahl neben Stufe, Karrierestufe und Platz wuerde den
// Start weiter aufladen, und genau der ist das Problem. Was es gibt, ist diese
// Karte: einmal, ganz oben, wegtippbar.
//
// Sie ist zugleich die Antwort auf "zu viele Begriffe". Umbenannt wird nichts -
// die Woerter stehen in CONTEXT.md und achtzehn Plan-Dokumenten und sind gut.
// Sie waren nur alle gleichzeitig da. Jetzt kommt jedes einmal mit einem Satz
// daneben, in dem Moment, in dem es das erste Mal gebraucht wird.

export default function AusbauAufgegangen() {
  return (
    <div className={`${card} border-l-4 border-l-emerald-500 p-4 sm:p-5`}>
      <div className="flex items-center gap-2">
        <UnlockIcon className="h-4.5 w-4.5 text-emerald-600" />
        <h2 className="text-sm font-semibold text-ink">
          Zwei neue Bereiche sind offen
        </h2>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        <Link
          href="/trichter"
          className="font-semibold text-ink underline decoration-line-strong underline-offset-2 hover:decoration-ink"
        >
          Trichter
        </Link>{" "}
        zeigt dir, an welcher Stelle deine Anrufe verloren gehen.{" "}
        <Link
          href="/arena"
          className="font-semibold text-ink underline decoration-line-strong underline-offset-2 hover:decoration-ink"
        >
          Wettbewerb
        </Link>{" "}
        zeigt, wo du im Team stehst.
      </p>

      {/* Ein Knopf, kein Kreuz in der Ecke: das Wegtippen ist hier eine
          Antwort ("verstanden"), keine Abwehr. */}
      <form action={ausbauGesehen} className="mt-3">
        <button
          type="submit"
          className="inline-flex min-h-11 items-center rounded-lg px-2 text-13 font-medium text-ink-muted transition hover:text-ink"
        >
          Verstanden
        </button>
      </form>
    </div>
  );
}
