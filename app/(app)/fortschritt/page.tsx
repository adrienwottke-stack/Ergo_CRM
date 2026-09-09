import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ladeHauptziel, ladeZiele } from "@/lib/ziele";
import { zielPruefzeit } from "@/lib/ziele-modell";
import { ladeEinheitenErinnerungen } from "@/lib/einheiten-erinnerung";
import { formatEinheiten, ladeEinheiten } from "@/lib/einheiten";
import { berlinToday } from "@/lib/dates";
import ZielKarte from "@/components/ziele/ZielKarte";
import SeitenKopf from "@/components/SeitenKopf";
import { ChevronRightIcon, PlusIcon } from "@/components/icons";
import {
  btnPrimary,
  btnSecondary,
  card,
  column,
  kicker,
  sectionTitle,
} from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function FortschrittPage() {
  const user = await requireUser();
  const heute = berlinToday();
  const [ziele, hauptziel, erinnerungen, einheiten] = await Promise.all([
    ladeZiele(user.id),
    ladeHauptziel(user.id),
    ladeEinheitenErinnerungen(user.id, true),
    ladeEinheiten(
      {
        id: user.id,
        name: user.name,
        karrierestufe: user.karrierestufe,
        einheitenStart: user.einheitenStart,
      },
      heute,
    ),
  ]);
  const aktiv = ziele.filter(
    (ziel) =>
      !ziel.archiviertAt &&
      ziel.ende > zielPruefzeit(ziel.zeitraum) &&
      ziel.zusage !== "ABGELEHNT",
  );
  const offeneZiele = aktiv.filter((ziel) => ziel.zusage === "OFFEN");
  const bestaetigteZiele = aktiv.filter((ziel) => ziel.zusage === "BESTAETIGT");
  const hauptzielAktiv =
    hauptziel && bestaetigteZiele.some((ziel) => ziel.id === hauptziel.id)
      ? hauptziel
      : null;
  const weitereZiele = bestaetigteZiele.filter(
    (ziel) => ziel.id !== hauptzielAktiv?.id,
  );
  const vergangen = ziele.filter((ziel) => !aktiv.includes(ziel));

  return (
    <div className={`${column} space-y-6`}>
      <SeitenKopf
        titel="Fortschritt"
        unterzeile="Deine Ziele und das, was du dafür geschafft hast."
        werkzeuge
      />

      <section
        id="ziele"
        aria-labelledby="hauptziel-titel"
        className="scroll-mt-8 space-y-3"
      >
        {hauptzielAktiv ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <h2 id="hauptziel-titel" className={kicker}>
                Dein Hauptziel
              </h2>
              <Link href="/fortschritt/neu" className={btnSecondary}>
                <PlusIcon className="h-4 w-4" />
                Weiteres Ziel
              </Link>
            </div>
            <ZielKarte
              ziel={hauptzielAktiv}
              userId={user.id}
              hauptzielId={hauptzielAktiv.id}
            />
          </>
        ) : (
          <div className={`${card} p-5 sm:p-6`}>
            <p className={kicker}>Dein nächster Schritt</p>
            <h2
              id="hauptziel-titel"
              className="mt-2 text-xl font-semibold text-ink"
            >
              Setz dir ein klares Ziel
            </h2>
            <p className="mt-2 max-w-xl text-base text-ink-muted">
              Eine Woche oder ein Monat genügt. Dein Stand wächst mit deiner
              eingetragenen Arbeit.
            </p>
            <Link className={`${btnPrimary} mt-5`} href="/fortschritt/neu">
              Ziel setzen
            </Link>
          </div>
        )}
      </section>

      {(offeneZiele.length > 0 || erinnerungen.length > 0) && (
        <section aria-labelledby="offen-titel" className="space-y-3">
          <h2 id="offen-titel" className={sectionTitle}>
            Offene Bestätigungen und Nachträge
          </h2>
          {offeneZiele.map((ziel) => (
            <ZielKarte
              key={ziel.id}
              ziel={ziel}
              userId={user.id}
              hauptzielId={null}
            />
          ))}
          {erinnerungen.length > 0 && (
            <Link
              href="/fortschritt/einheiten-offen"
              className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 transition hover:bg-sunken"
            >
              <span>
                <span className="block text-base font-medium text-ink">
                  Einheiten nachtragen
                </span>
                <span className="block text-sm text-ink-muted">
                  {erinnerungen.length === 1
                    ? "Eine Erinnerung wartet"
                    : `${erinnerungen.length} Erinnerungen warten`}
                </span>
              </span>
              <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-muted" />
            </Link>
          )}
        </section>
      )}

      <section
        aria-labelledby="einheiten-titel"
        className="flex flex-wrap items-center justify-between gap-4 border-y border-line py-4"
      >
        <div>
          <h2 id="einheiten-titel" className={kicker}>
            Einheiten
          </h2>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">
            {formatEinheiten(einheiten.ich.gesamt)}
            <span className="ml-2 text-sm font-normal text-ink-muted">
              insgesamt
            </span>
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            {formatEinheiten(einheiten.ich.monat)} im {einheiten.monat.label}
          </p>
        </div>
        <Link
          href="/einheiten#menge"
          className={hauptzielAktiv ? btnPrimary : btnSecondary}
        >
          Einheiten eintragen
        </Link>
      </section>

      {weitereZiele.length > 0 && (
        <section aria-labelledby="weitere-ziele-titel" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="weitere-ziele-titel" className={sectionTitle}>
              Weitere aktive Ziele
            </h2>
          </div>
          {weitereZiele.map((ziel) => (
            <ZielKarte
              key={ziel.id}
              ziel={ziel}
              userId={user.id}
              hauptzielId={hauptzielAktiv?.id ?? null}
            />
          ))}
        </section>
      )}

      <nav aria-label="Weitere Fortschrittsbereiche">
        <p className={kicker}>Weitere Auswertungen</p>
        <div className="mt-2 divide-y divide-line border-y border-line">
          {[
            ["/arena", "Wettbewerb", "Gemeinsam dranbleiben"],
            ["/trichter", "Trichter", "Erkennen, wo es hakt"],
            ["/fortschritt/warum", "Mein Warum", "Wofür du das machst"],
          ].map(([href, titel, text]) => (
            <Link
              key={href}
              href={href}
              className="flex min-h-16 items-center justify-between gap-4 py-3 transition hover:text-link"
            >
              <div>
                <p className="text-base font-medium text-ink">{titel}</p>
                <p className="mt-0.5 text-sm text-ink-muted">{text}</p>
              </div>
              <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-muted" />
            </Link>
          ))}
        </div>
      </nav>

      {vergangen.length > 0 && (
        <details>
          <summary className="flex min-h-12 cursor-pointer items-center text-base font-medium text-ink-muted">
            Frühere Ziele · {vergangen.length}
          </summary>
          <div className="mt-3 space-y-3">
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
