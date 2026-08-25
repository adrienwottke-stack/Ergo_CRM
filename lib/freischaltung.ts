// Was man sich aufmacht.
//
// Eine Stufe allein ist eine Zahl. Sie wird erst zu einem Grund, weiterzumachen,
// wenn hinter ihr etwas steht, das vorher zu war.
//
// Wichtig: hier stehen ausschließlich Dinge, die NEBEN der Arbeitswertung
// liegen. Das Storno-Spiel ist eine getrennte Liga (docs/wettbewerb-plan.md,
// 13.4) - Punkte fließen von der Arbeit ins Spiel, nie zurück. Das muss nicht
// bewacht werden: das Spiel ist eine eigene Anwendung ohne Rückkanal.

export type Freischaltbar = {
  schluessel: string;
  name: string;
  /** Ein Satz. Was ist das, und warum sollte es jemanden interessieren. */
  beschreibung: string;
  /** Ab welcher Stufe die Kachel aufgeht. */
  abStufe: number;
  url: string;
  /** Führt aus dem Werkzeug heraus - dann in einem neuen Tab. */
  extern: boolean;
};

export const FREISCHALTBAR: readonly Freischaltbar[] = [
  {
    schluessel: "storno",
    name: "Storno",
    beschreibung:
      "Ein Jahr im Außendienst als Kartenspiel. Wischen, entscheiden, überleben bis Heiligabend.",
    abStufe: 2,
    url: "https://storno-five.vercel.app",
    extern: true,
  },
];

export function istFrei(eintrag: Freischaltbar, stufenNummer: number): boolean {
  return stufenNummer >= eintrag.abStufe;
}
