// Fruehwarn-Signale fuer die Mannschafts-Uebersicht.
//
// Zwei Festlegungen, die den Rest erklaeren:
//
// 1. Signale werden BERECHNET, nicht gespeichert. Wer sie automatisch in
//    Aufgaben verwandelt, hat nach zwei Wochen zweihundert davon und schaut
//    nie wieder hin. Aus einem Signal wird erst dann etwas, wenn die
//    Fuehrungskraft es antippt.
// 2. Die Schwellwerte stehen hier oben an einer Stelle. Nach dem ersten echten
//    Monat wird daran geschraubt, und dann will man nicht im Code suchen.
//
// Siehe docs/struktur-plan.md, Abschnitt 4.2.

export const SCHWELLEN = {
  stilleTage: 5,
  terminFensterTage: 14,
  gehaltenQuoteMin: 0.5,
  gehalteneTermineOhneAbschluss: 6,
  pipelineMindestbestand: 5,
  ueberfaelligMax: 10,
  onboardingWochen: 8,
  empfehlungTage: 30,
};

export type Schwere = "rot" | "gelb";
export type Ampel = "gruen" | "gelb" | "rot";

export type Signal = {
  schluessel: string;
  titel: string;
  /** Was die Fuehrungskraft daraus machen soll - nicht was die Zahl sagt. */
  schritt: string;
  schwere: Schwere;
};

export type SignalEingabe = {
  /** Stufe 1 – steht bei jedem Berater zur Verfuegung. */
  tageSeitAktivitaet: number | null; // null = im Rueckblick gar nichts
  termineVereinbart14: number;
  termineGehalten14: number;
  termineGehaltenMonat: number;
  abschluesseMonat: number;
  abschluesseGesamt: number;
  tageDabei: number | null;

  /** Stufe 2 – nur wenn der Berater seine Pipeline sichtbar macht. */
  pipelineSichtbar: boolean;
  kontakteInAkquise: number;
  ueberfaelligeSchritte: number;
  kundenOhneEmpfehlung: number;
};

export function signaleFuer(e: SignalEingabe): Signal[] {
  const signale: Signal[] = [];

  // Stille ist das wichtigste Signal ueberhaupt: sie geht der Kuendigung
  // voraus, nicht schlechte Zahlen.
  if (e.tageSeitAktivitaet === null || e.tageSeitAktivitaet >= SCHWELLEN.stilleTage) {
    signale.push({
      schluessel: "stille",
      titel:
        e.tageSeitAktivitaet === null
          ? "Lange gar nichts"
          : `Seit ${e.tageSeitAktivitaet} Tagen keine Aktivität`,
      schritt: "Anrufen. Nicht nach Zahlen fragen, sondern wie es läuft.",
      schwere: "rot",
    });
  }

  if (
    e.termineVereinbart14 >= 3 &&
    e.termineGehalten14 / e.termineVereinbart14 < SCHWELLEN.gehaltenQuoteMin
  ) {
    signale.push({
      schluessel: "termine_platzen",
      titel: `${e.termineGehalten14} von ${e.termineVereinbart14} Terminen gehalten`,
      schritt: "Termine platzen oder werden gemieden. Vorbereitung gemeinsam ansehen.",
      schwere: "gelb",
    });
  }

  if (
    e.termineGehaltenMonat >= SCHWELLEN.gehalteneTermineOhneAbschluss &&
    e.abschluesseMonat === 0
  ) {
    signale.push({
      schluessel: "kein_abschluss",
      titel: `${e.termineGehaltenMonat} Termine, kein Abschluss`,
      schritt: "Abschlussschwäche. Begleitung vereinbaren, nicht mehr Termine fordern.",
      schwere: "gelb",
    });
  }

  if (
    e.tageDabei !== null &&
    e.tageDabei <= SCHWELLEN.onboardingWochen * 7 &&
    e.abschluesseGesamt === 0
  ) {
    signale.push({
      schluessel: "onboarding",
      titel: `Seit ${Math.floor(e.tageDabei / 7)} Wochen dabei, noch kein Abschluss`,
      schritt: "Der teuerste Moment. Diese Woche gemeinsam einen Termin machen.",
      schwere: "rot",
    });
  }

  if (e.pipelineSichtbar) {
    if (e.kontakteInAkquise < SCHWELLEN.pipelineMindestbestand) {
      signale.push({
        schluessel: "pipeline_leer",
        titel: `Nur ${e.kontakteInAkquise} Kontakte in der Akquise`,
        schritt: "Kein Verkaufs-, sondern ein Nachschubproblem. Gemeinsam telefonieren.",
        schwere: "gelb",
      });
    }

    if (e.ueberfaelligeSchritte > SCHWELLEN.ueberfaelligMax) {
      signale.push({
        schluessel: "ueberfaellig",
        titel: `${e.ueberfaelligeSchritte} überfällige Schritte`,
        schritt: "Kein Verkaufsproblem, ein Disziplinproblem. Heute-Liste zusammen aufräumen.",
        schwere: "gelb",
      });
    }

    if (e.kundenOhneEmpfehlung > 0) {
      signale.push({
        schluessel: "empfehlungen",
        titel: `${e.kundenOhneEmpfehlung} Kunden ohne Empfehlungsfrage`,
        schritt: "Der billigste ungenutzte Hebel. Frage einüben.",
        schwere: "gelb",
      });
    }
  }

  return signale;
}

export function ampelVon(signale: Signal[]): Ampel {
  if (signale.some((signal) => signal.schwere === "rot")) return "rot";
  return signale.length > 0 ? "gelb" : "gruen";
}

export const ampelFarben: Record<Ampel, string> = {
  gruen: "bg-emerald-500",
  gelb: "bg-amber-400",
  rot: "bg-red-500",
};

export const ampelTexte: Record<Ampel, string> = {
  gruen: "läuft",
  gelb: "hakt",
  rot: "braucht dich",
};
