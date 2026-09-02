import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { istAn } from "@/lib/features";
import {
  DIREKTKONTAKT_FENSTER,
  DIREKTKONTAKT_STUFEN,
  fensterVon,
  heuteStand,
  ladeDirektkontakt,
} from "@/lib/direktkontakt";
import { card, filterPill, kicker, pageTitle, sectionTitle } from "@/components/ui";
import LeerZustand from "@/components/LeerZustand";
import DirektkontaktZaehler from "@/components/DirektkontaktZaehler";
import DirektkontaktTrichter from "@/components/DirektkontaktTrichter";
import { MegafonIcon } from "@/components/icons";
import { zaehlen } from "./actions";

export const dynamic = "force-dynamic";

// Der Direktkontakttrichter (docs/emil-feedback-runde-2.md, AP-21).
//
// Ein verstecktes Werkzeug der Fuehrung: es steht in KEINER Leiste. Wer
// hierher will, kommt ueber den Wegweiser oder ueber die Mannschaft. Das ist
// Absicht - Direktansprache macht nicht jeder, und ein achter Reiter fuer
// etwas, das drei Leute benutzen, macht die Leiste fuer alle anderen
// schlechter. Der Riegel selbst liegt nicht hier, sondern im Gruppen-Layout:
// sperreFuer() kennt /direktkontakt als Bereich "fuehrung" (lib/ausbauSicht.ts)
// und zeigt einem Neuling ohne Direkte die Sperrseite statt dieser Seite.
//
// Die Seite haelt ausschliesslich die EIGENEN Zahlen. Kein Team-Vergleich,
// keine Kopplung an Punkte oder Arena, keine Kontaktpflicht - Begruendung in
// lib/direktkontakt.ts.

export default async function DirektkontaktPage({
  searchParams,
}: {
  searchParams: Promise<{ zeit?: string }>;
}) {
  const user = await requireUser();
  const { zeit } = await searchParams;
  const fenster = fensterVon(zeit);

  const an = await istAn("direktkontakt");
  if (!an) {
    return (
      <div className="space-y-6">
        <span className={kicker}>Führung</span>
        <LeerZustand
          symbol={<MegafonIcon className="h-6 w-6" />}
          titel="Der Direktkontakttrichter ist gerade abgeschaltet"
          text="Dieses Werkzeug ist derzeit aus. Die Werkstatt schaltet es wieder an; gezählte Zahlen bleiben stehen."
        />
      </div>
    );
  }

  // Zwei Fragen an dieselbe Tabelle, aber an zwei Zeitraeume: der Zaehler
  // schaut auf heute, der Trichter auf das gewaehlte Fenster. Eine Runde zum
  // Server, nicht zwei.
  const [heute, bild] = await Promise.all([
    heuteStand(user.id),
    ladeDirektkontakt(user.id, fenster),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <span className={kicker}>Führung</span>
        <h1 className={`${pageTitle} mt-1`}>Direktkontakt</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Fremde ansprechen — auf der Straße, über Instagram. Fünf Zähler, ein
          Daumen. Namen brauchst du hier keine.
        </p>
      </div>

      <DirektkontaktZaehler
        zaehlen={zaehlen}
        stufen={DIREKTKONTAKT_STUFEN.map((stufe) => ({
          key: stufe.key,
          titel: stufe.titel,
          anzahl: heute[stufe.key],
        }))}
      />

      <section className={`${card} p-6 sm:p-7`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className={sectionTitle}>Dein Trichter</h2>
          <div className="flex flex-wrap gap-2">
            {DIREKTKONTAKT_FENSTER.map((eintrag) => (
              <Link
                key={eintrag.key}
                href={`/direktkontakt?zeit=${eintrag.key}`}
                className={filterPill(fenster === eintrag.key)}
              >
                {eintrag.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6">
          {bild.gesamt === 0 ? (
            // Leer heisst hier nicht "kaputt", sondern "noch nicht gezaehlt" -
            // deshalb ohne eigenen Rahmen, die Karte ist schon da.
            <LeerZustand
              rahmen={false}
              symbol={<MegafonIcon className="h-6 w-6" />}
              titel="In diesem Zeitraum noch nichts gezählt"
              text="Tipp oben auf „Angesprochen“, sobald du jemanden ansprichst. Der Trichter entsteht von selbst."
            />
          ) : (
            <DirektkontaktTrichter stufen={bild.stufen} />
          )}
        </div>
      </section>

      <p className={kicker}>
        Nur deine eigenen Zahlen — kein Team-Vergleich, keine Punkte, keine
        Rangliste. Woche ab Montag, Berliner Kalender. Ein Tipp zu viel geht mit
        dem Minus wieder weg.
      </p>
    </div>
  );
}
