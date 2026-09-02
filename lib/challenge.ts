// Die Team-Challenge: ein Wochenziel der ganzen Mannschaft
// (docs/emil-feedback-runde-2.md, Abschnitt 7, AP-27 und Entscheidung D19;
// CONTEXT.md, Glossar "Team-Challenge").
//
// Vier Festlegungen, die den Rest erklaeren:
//
// 1. GEGEN DAS ZIEL, NICHT GEGENEINANDER. In diesem Block steht kein Name,
//    kein Platz und kein Abstand zu jemandem. Wer wie viel beigetragen hat,
//    sagt die Tabelle darunter - ein Wochenziel, das nebenbei eine zweite
//    Rangliste aufmacht, ist keins.
// 2. KEINE PUNKTE FUERS ZIEL. Das Ziel aendert an keiner Wertung etwas, es
//    zeigt eine Summe. Alles andere waere ein zweiter Punktespeicher neben
//    DailyLog - genau das, was lib/arena.ts vermeidet.
// 3. NUR ANRUFE. Der Trichter faengt beim Anruf an, und eine Summe ueber
//    gemischte Arten koennte niemand nachrechnen. Die Gewichtung aus
//    lib/labels.ts bleibt draussen: gezaehlt werden Stueck, nicht Punkte.
// 4. DAS ZIEL LEGT DER BETRIEB FEST, NICHT DER CODE (D4, Muster
//    lib/einstellungen.ts). Die 100 sind ein Platzhalter, bis Emil seine Zahl
//    schickt (Plan, Abschnitt 9, E3) - eine Zahl im Code haette jede
//    Aenderung an einen Deploy gehaengt.

import { prisma } from "@/lib/prisma";
import { einstellungen, ganzzahl } from "@/lib/einstellungen";

/** Schluessel des Wochenziels in der Tabelle "Einstellung". */
export const CHALLENGE_WOCHENZIEL_SCHLUESSEL = "challenge.wochenziel";

/** Der Platzhalter, solange kein eigener Wert eingetragen ist. */
export const CHALLENGE_WOCHENZIEL_STANDARD = 100;

/**
 * Das Wochenziel aus der Werkstatt, sonst der Platzhalter.
 *
 * Dasselbe Muster wie fokusProzentsatz() in lib/einheiten.ts: fehlt die
 * Tabelle (Migration unterwegs) oder steht kein brauchbarer Wert drin, gilt
 * die Konstante. Eine 0 oder eine negative Zahl waere kein Ziel, sondern eine
 * Division durch null im Fortschrittsbalken - und faellt deshalb genauso
 * zurueck wie ein fehlender Eintrag.
 */
export async function challengeWochenziel(): Promise<number> {
  const werte = await einstellungen();
  if (werte === null) return CHALLENGE_WOCHENZIEL_STANDARD;
  const ziel = ganzzahl(werte.get(CHALLENGE_WOCHENZIEL_SCHLUESSEL));
  if (ziel === null || ziel < 1) return CHALLENGE_WOCHENZIEL_STANDARD;
  return ziel;
}

export type ChallengeStand = {
  /** Anrufe der laufenden Woche, ueber das ganze Netzwerk summiert. */
  anrufe: number;
  ziel: number;
  /** 0 bis 1 fuer den Balken. Ueber dem Ziel bleibt er bei 1. */
  anteil: number;
  erreicht: boolean;
};

/**
 * Der Stand der laufenden Woche.
 *
 * EINE Abfrage: eine Aggregation ueber DailyLog. Das Ziel daneben kostet
 * keine zweite - lib/einstellungen.ts liest die Tabelle je Anfrage genau
 * einmal und beantwortet danach aus dem Cache (die Werkstatt fragt auf ihrer
 * Seite denselben Schluessel noch einmal ab).
 *
 * Gezaehlt wird ohne Personenfilter, und das ist Absicht: die Challenge ist
 * die Summe des NETZWERKS. Beitragen kann nur, wer loggt - ein stiller Kopf
 * steht damit weder in der Summe noch irgendwo sonst. Derselbe Zeitraum wie
 * ladeRangliste (ab Wochenstart), damit die Zahl hier und die Anrufspalte
 * dort nicht auseinanderlaufen.
 */
export async function ladeChallenge(wochenStart: Date): Promise<ChallengeStand> {
  const [ziel, summe] = await Promise.all([
    challengeWochenziel(),
    prisma.dailyLog.aggregate({
      where: { type: "CALL", date: { gte: wochenStart } },
      _sum: { count: true },
    }),
  ]);

  const anrufe = summe._sum.count ?? 0;
  return {
    anrufe,
    ziel,
    anteil: ziel > 0 ? Math.min(1, anrufe / ziel) : 1,
    erreicht: anrufe >= ziel,
  };
}

/**
 * Der eine trockene Satz unter dem Balken.
 *
 * Register wie im ganzen Wettbewerb: Sportreportage ohne Ausrufezeichen
 * (docs/wettbewerb-plan.md, Abschnitt 1). "Ziel erreicht" ist die groesste
 * Feier, die hier vorgesehen ist - kein Konfetti, keine Emojis.
 *
 * `spieltagLaeuft` kommt von der Seite, die den Abpfiff ohnehin ausrechnet
 * (stundenBis in lib/arena.ts). Am Wochenende steht der Abpfiff hinter uns:
 * "noch 27 bis Freitag, 18 Uhr" waere dann schlicht falsch.
 */
export function challengeSatz(
  stand: ChallengeStand,
  spieltagLaeuft: boolean
): string {
  if (stand.erreicht) {
    return `Ziel erreicht: ${stand.anrufe} von ${stand.ziel}.`;
  }
  if (!spieltagLaeuft) {
    return `Spieltag vorbei: ${stand.anrufe} von ${stand.ziel} Anrufen.`;
  }
  const rest = stand.ziel - stand.anrufe;
  return `${stand.anrufe} von ${stand.ziel} Anrufen — noch ${rest} bis Freitag, 18 Uhr.`;
}
