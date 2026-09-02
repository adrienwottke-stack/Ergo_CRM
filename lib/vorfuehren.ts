// Zaehlnamen fuer den Vorfuehr-Schalter (Lagebild-Plan): Namen werden
// verdeckt, Zahlen bleiben echt. Der erste Anlauf (Runde 1) baute Initialen
// ("Marc Weber" -> "M. W.", kollisionsaufloesend bis zum vollen Wort) -
// Emils Befund aus Runde 2 (N9): Kuerzel anonymisieren vor Insidern nicht,
// "E. C. kennt jeder im Team", der Klarname bleibt sofort erkennbar. Seit
// D17 zaehlt stattdessen die Position in der Liste: "GP 1", "GP 2", ... Eine
// Nummer verraet fuer sich allein niemanden - sie bleibt nur INNERHALB einer
// Seite stabil, weil sie aus der Reihenfolge der auf dieser Seite geladenen
// Namen entsteht (dieselbe Eingabeliste liefert immer dieselbe Zuordnung).
// Zwei verschiedene Seiten bauen ihre Liste unabhaengig und koennen
// demselben Menschen unterschiedliche Nummern geben - stabil gilt je Seite,
// nicht seitenuebergreifend.
//
// Reine Funktion, kein Prisma, kein "use client" noetig - lib/vorfuehren.ts
// darf sowohl im Server- als auch im Client-Teil importiert werden.

/**
 * Zaehlname je Name in Eingabereihenfolge: der erste, noch nicht gesehene
 * Name wird "GP 1", der naechste neue "GP 2", und so weiter.
 *
 * BEKANNTE GRENZE: taucht derselbe Name mehrfach in der Liste auf (zwei
 * gleichnamige Berater), bekommen beide dieselbe Nummer - die Funktion kennt
 * nur den String, keine Personen-ID, und die heutigen Aufrufer reichen Namen
 * ein, keine IDs. Bis das behoben ist, bleiben echte Namensvettern beim
 * Vorfuehren ununterscheidbar - das war schon vor D17 so (zwei identische
 * Namen wuchsen bei den alten Initialen bis zum vollen, wieder identischen
 * Wort).
 */
export function zaehlnamen(namen: string[]): Map<string, string> {
  const karte = new Map<string, string>();
  let naechsteNummer = 1;
  for (const name of namen) {
    if (karte.has(name)) continue;
    karte.set(name, `GP ${naechsteNummer}`);
    naechsteNummer += 1;
  }
  return karte;
}

/**
 * Name bleibt, bis die Aufrufer umgestellt sind - die Seiten gehoeren
 * gerade anderen Paketen. Liefert ab jetzt dasselbe wie zaehlnamen() (AP-22,
 * D17) statt der alten, kollisionsaufloesenden Initialen.
 */
export const initialenKuerzel = zaehlnamen;
