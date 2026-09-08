import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ladeHauptziel, ladeZiele } from "@/lib/ziele";
import { zielPruefzeit } from "@/lib/ziele-modell";
import { ladeEinheitenErinnerungen } from "@/lib/einheiten-erinnerung";
import ZielKarte from "@/components/ziele/ZielKarte";
import { column, pageTitle, btnPrimary } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function FortschrittPage() {
  const user = await requireUser();
  const [ziele, hauptziel, erinnerungen] = await Promise.all([
    ladeZiele(user.id),
    ladeHauptziel(user.id),
    ladeEinheitenErinnerungen(user.id, true),
  ]);
  const laufend = ziele.filter(
    (ziel) =>
      !ziel.archiviertAt &&
      ziel.ende > zielPruefzeit(ziel.zeitraum) &&
      ziel.zusage !== "ABGELEHNT",
  );
  const vergangen = ziele.filter((ziel) => !laufend.includes(ziel));
  return (
    <div className={`${column} space-y-8`}>
      <header className="space-y-3">
        <h1 className={pageTitle}>Fortschritt</h1>
        <p className="text-base text-slate-600">
          Deine Ziele und das, was du dafür geschafft hast.
        </p>
      </header>
      <nav
        aria-label="Fortschritt entdecken"
        className="divide-y divide-line rounded-xl border border-line bg-surface"
      >
        {[
          ["#ziele", "Deine Ziele", "Woche, Monat und dein nächster Schritt"],
          ["/einheiten", "Einheiten", "Eintragen und Entwicklung überblicken"],
          ["/arena", "Wettbewerb", "Gemeinsam dranbleiben"],
          ["/trichter", "Trichter", "Erkennen, wo es hakt"],
          ["/fortschritt/warum", "Mein Warum", "Wofür du das machst"],
        ].map(([href, titel, text]) => (
          <Link
            key={href}
            href={href!}
            className="flex min-h-20 items-center justify-between gap-4 p-5"
          >
            <div>
              <p className="text-lg font-medium">{titel}</p>
              <p className="mt-1 text-sm text-slate-600">{text}</p>
            </div>
            <span aria-hidden>→</span>
          </Link>
        ))}
      </nav>
      {erinnerungen.length > 0 && (
        <Link
          href="/fortschritt/einheiten-offen"
          className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-line p-4"
        >
          <span>Offene Einheiten · {erinnerungen.length}</span>
          <span aria-hidden>→</span>
        </Link>
      )}
      <section id="ziele" className="scroll-mt-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold">Deine Ziele</h2>
          <Link className={btnPrimary} href="/fortschritt/neu">
            Ziel setzen
          </Link>
        </div>
        {laufend.length === 0 ? (
          <p className="py-4 text-base text-slate-600">
            Ein klares Ziel für diese Woche genügt. Deinen Fortschritt zählen
            wir aus deiner Arbeit.
          </p>
        ) : (
          laufend.map((ziel) => (
            <ZielKarte
              key={ziel.id}
              ziel={ziel}
              userId={user.id}
              hauptzielId={hauptziel?.id ?? null}
            />
          ))
        )}
      </section>
      {vergangen.length > 0 && (
        <details className="space-y-4">
          <summary className="min-h-12 cursor-pointer text-lg font-medium">
            Frühere Ziele · {vergangen.length}
          </summary>
          <div className="space-y-4">
            {vergangen.map((ziel) => (
              <ZielKarte
                key={ziel.id}
                ziel={ziel}
                userId={user.id}
                hauptzielId={null}
              />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
