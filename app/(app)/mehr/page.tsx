import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ausbaustand, zeigeMehrEintrag } from "@/lib/ausbau";
import { bitten } from "@/app/(app)/ausbauActions";
import { btnPrimary, card, columnNarrow, pageTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

// Eigene Intl-Instanz, wie es in diesem Projekt ueberall gehalten wird
// (siehe lib/export.ts).
const datumFormat = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "medium",
  timeZone: "Europe/Berlin",
});

// Der leise Eintrag am Ende der vier Reiter (docs/adr/0007-die-bitte-um-ausbau.md).
// "Das Cockpit kann mehr" - kein Banner, kein Hinweis auf einer anderen
// Seite. Wer nicht bittet, sieht diesen Satz nie wieder von selbst.
export default async function MehrPage() {
  const user = await requireUser();
  const stand = await ausbaustand(user);

  // Admin und voller Umfang haben hier nichts zu suchen. Der Eintrag in der
  // Navigation ist fuer sie ohnehin weg (components/AppShell.tsx), aber die
  // Adresse selbst bleibt offen, solange niemand sie prueft - derselbe
  // zeigeMehrEintrag() entscheidet hier ein zweites Mal.
  if (!zeigeMehrEintrag(stand)) redirect("/heute");

  return (
    <div className={`${columnNarrow} space-y-6`}>
      <div>
        <h1 className={pageTitle}>Mehr</h1>
      </div>

      <section className={`${card} space-y-4 p-5`}>
        <p className="text-sm text-ink">
          Der volle Umfang bringt drei weitere Bereiche: den Trichter (deine
          Zahlen von Anruf bis Abschluss), den Wettbewerb (Rangliste,
          Aktivitäten, das Spiel) und die Einheiten. Namen, Heute, Kalender
          und Einladen bleiben genauso da.
        </p>

        {user.bitteAm === null ? (
          <>
            <p className="text-sm text-ink-muted">
              Das öffnet deine Führungskraft — oder der Admin, wenn sie es
              nicht tut.
            </p>
            <form action={bitten}>
              <button type="submit" className={btnPrimary}>
                Ich bitte darum
              </button>
            </form>
          </>
        ) : (
          <p className="text-sm text-ink-muted">
            Gefragt am {datumFormat.format(user.bitteAm)} — deine
            Führungskraft und der Admin sehen es.
          </p>
        )}
      </section>
    </div>
  );
}
