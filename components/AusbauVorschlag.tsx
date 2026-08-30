// Der Vorschlag an die Fuehrungskraft: hier ist jemand so weit
// (docs/ausbau-plan.md, Abschnitt 3).
//
// Sieht aus wie eine Fuehrungsaufgabe und steht an derselben Stelle - ist aber
// keine. Es gibt bewusst KEINEN LeadershipTask-Datensatz dahinter:
//
//   - app/(app)/mannschaft/actions.ts haelt fest, dass eine Aufgabe NUR durch
//     einen Tipp der Fuehrungskraft entsteht, und docs/audit-kernmodell.md
//     Abschnitt 9 nennt automatisch erzeugte Aufgaben ausdruecklich "bewusst
//     nicht gebaut" - nach zwei Wochen haette man zweihundert davon.
//   - Ein gespeicherter Vorschlag muesste beim Freischalten, beim Umhaengen
//     und beim Deaktivieren aufgeraeumt werden. Gerechnet verschwindet er von
//     selbst, sobald ausbau === 2 steht.
//
// Deshalb auch kein "Erledigt" und kein "3 Tage spaeter": es gibt nichts
// abzuhaken. Wer nicht freischaltet, sieht die Zeile morgen wieder - und das
// ist die richtige Antwort, nicht ein Fehler.

import { ausbauFreischalten } from "@/app/(app)/mannschaft/actions";
import type { Vorschlag } from "@/lib/ausbau";
import { card } from "@/components/ui";
import { UnlockIcon } from "@/components/icons";

export default function AusbauVorschlag({
  vorschlaege,
}: {
  vorschlaege: Vorschlag[];
}) {
  if (vorschlaege.length === 0) return null;

  return (
    <ul className="space-y-3">
      {vorschlaege.map((vorschlag) => (
        <li key={vorschlag.userId} className={`${card} border-l-4 border-l-emerald-500 p-4`}>
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-11 font-semibold uppercase tracking-wide text-emerald-700">
              Freischalten
            </span>
            <span className="text-sm font-semibold text-ink">
              {vorschlag.name}
            </span>
          </div>

          {/* Der Grund steht daneben, nicht nur der Name. Eine
              Fuehrungskraft soll entscheiden koennen, ohne erst nachzusehen -
              und sie soll widersprechen koennen, wenn die Zahlen zwar stimmen,
              der Mensch aber noch nicht so weit ist. */}
          <p className="mt-1.5 text-sm font-medium text-ink">
            {vorschlag.name.split(" ")[0]} hat {vorschlag.grund}.
          </p>
          <p className="mt-0.5 text-sm text-ink-muted">
            Trichter und Wettbewerb aufmachen? Zurück geht es nicht.
          </p>

          <div className="mt-3">
            <form action={ausbauFreischalten}>
              <input type="hidden" name="memberId" value={vorschlag.userId} />
              <button
                type="submit"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-akzent px-3.5 text-13 font-semibold text-white transition hover:bg-akzent-stark"
              >
                <UnlockIcon className="h-4 w-4" />
                Aufmachen
              </button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}
