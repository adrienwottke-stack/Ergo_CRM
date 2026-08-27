import Link from "next/link";
import type { Mannschaftsperson } from "@/lib/fuehrung";
import { formatEinheiten, type EinheitenAufteilung } from "@/lib/einheiten";
import type { Ampel as AmpelWert } from "@/lib/signale";
import Ampel from "@/components/Ampel";
import { card, kicker, td, th } from "@/components/ui";

// Das Team-Cockpit: eine dichte Zeile pro Person statt einer Rechnung, die
// sich über Abschnitte verteilt. Genau das wollte Emil fuer den Teamabend -
// "Ampeln, beieinander" statt eine Karte je Person zum Scrollen.
//
// Reine Anzeige, keine eigene Abfrage: alles kommt aus der bereits geladenen
// `mannschaftsLage` (Ampel + Werte) und der `einheitenFuerStruktur`-Map, die
// die Seite ohnehin schon laedt. Zwei Rechnungen fuer dieselbe Zahl waeren der
// Fehler, vor dem lib/fuehrung.ts im Kopf warnt.
const AMPEL_RANG: Record<AmpelWert, number> = { rot: 0, gelb: 1, gruen: 2, grau: 3 };

export default function MannschaftsMatrix({
  personen,
  einheiten,
  zeigeEinheiten,
}: {
  /** Die Mannschaft ohne den Betrachter selbst - eine Fuehrungskraft fuehrt
   *  sich nicht selbst, siehe "Dein eigenes Geschaeft" weiter unten. */
  personen: Mannschaftsperson[];
  einheiten: Map<string, EinheitenAufteilung>;
  zeigeEinheiten: boolean;
}) {
  // Ausgetretene brauchen keine Fuehrung mehr - eine rote Ampel bei jemandem,
  // der laengst weg ist, waere eine falsche Auskunft. Dasselbe Prinzip wie bei
  // `dringend`/`ruhend` in lib/fuehrung.ts, die Ausgetretene ebenfalls aus der
  // Ampel-Betrachtung herausnehmen.
  const zeilen = personen
    .filter((person) => !person.ausgetreten)
    .slice()
    .sort((a, b) => AMPEL_RANG[a.ampel] - AMPEL_RANG[b.ampel]);

  // Niemand in der Struktur (oder alle ausgetreten): dann gibt es nichts
  // Dichtes zu zeigen - die Karte "Noch niemand in deiner Struktur" weiter
  // unten uebernimmt die Erklaerung.
  if (zeilen.length === 0) return null;

  const summe = zeilen.reduce(
    (acc, person) => {
      acc.anrufe += person.werte.anrufeWoche;
      acc.vereinbart += person.werte.vereinbart14;
      acc.abschluesse += person.werte.abschluesseMonat;
      acc.punkte += person.werte.punkteWoche;
      // Platzhalter tragen hier ohnehin immer 0 bei - niemand ohne
      // Zugangsdaten kann selbst etwas gebucht haben.
      acc.einheiten += einheiten.get(person.id)?.eigenMonat ?? 0;
      return acc;
    },
    { anrufe: 0, vereinbart: 0, abschluesse: 0, einheiten: 0, punkte: 0 }
  );

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className={kicker}>Team-Cockpit</h2>
        <span className="text-xs text-ink-muted">nach Dringlichkeit sortiert</span>
      </div>
      <div className={`${card} overflow-x-auto`}>
        <table className="w-full min-w-160 text-left text-sm">
          <thead className="border-b border-line/80 bg-sunken/60">
            <tr>
              <th className={th}>Name</th>
              <th className={`${th} text-right`}>Anrufe (Woche)</th>
              <th className={`${th} text-right`}>Vereinbart (14 Tage)</th>
              <th className={`${th} text-right`}>Abschlüsse (Monat)</th>
              {zeigeEinheiten && (
                <th className={`${th} text-right`}>Einheiten (Monat)</th>
              )}
              <th className={`${th} text-right`}>Punkte (Woche)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {/* Die Summenzeile steht oben, nicht unten: die Fuehrungskraft
                liest zuerst "wo steht die Mannschaft insgesamt" und danach
                erst, wer im Einzelnen dahintersteckt. */}
            <tr className="bg-sunken/60">
              <td className={`${td} font-semibold text-ink`}>
                Zusammen ({zeilen.length})
              </td>
              <td className={`${td} text-right font-semibold tabular-nums text-ink`}>
                {summe.anrufe}
              </td>
              <td className={`${td} text-right font-semibold tabular-nums text-ink`}>
                {summe.vereinbart}
              </td>
              <td className={`${td} text-right font-semibold tabular-nums text-ink`}>
                {summe.abschluesse}
              </td>
              {zeigeEinheiten && (
                <td className={`${td} text-right font-semibold tabular-nums text-ink`}>
                  {formatEinheiten(summe.einheiten)}
                </td>
              )}
              <td className={`${td} text-right font-semibold tabular-nums text-ink`}>
                {summe.punkte}
              </td>
            </tr>
            {zeilen.map((person) => {
              const zahlen = einheiten.get(person.id);
              return (
                <tr key={person.id}>
                  <td className={`${td} font-medium text-ink`}>
                    <span className="flex items-center gap-2">
                      <Ampel ampel={person.ampel} variante="punkt" />
                      <Link
                        href={`/mannschaft/${person.id}`}
                        className="rounded transition hover:text-navy-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600"
                      >
                        {person.name}
                      </Link>
                    </span>
                  </td>
                  {/* Ein Platzhalter hat nie angerufen, nie einen Termin
                      vereinbart - "0" waere hier ein Vorwurf an jemanden, der
                      die App noch gar nicht hat. Dieselbe Regel wie in der
                      bestehenden Einheiten-Tabelle weiter unten. */}
                  <td className={`${td} text-right tabular-nums text-ink-muted`}>
                    {person.platzhalter ? "—" : person.werte.anrufeWoche}
                  </td>
                  <td className={`${td} text-right tabular-nums text-ink-muted`}>
                    {person.platzhalter ? "—" : person.werte.vereinbart14}
                  </td>
                  <td className={`${td} text-right tabular-nums font-medium text-ink`}>
                    {person.platzhalter ? "—" : person.werte.abschluesseMonat}
                  </td>
                  {zeigeEinheiten && (
                    <td className={`${td} text-right tabular-nums text-ink-muted`}>
                      {person.platzhalter || !zahlen
                        ? "—"
                        : formatEinheiten(zahlen.eigenMonat)}
                    </td>
                  )}
                  <td className={`${td} text-right tabular-nums font-semibold text-ink`}>
                    {person.platzhalter ? "—" : person.werte.punkteWoche}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
