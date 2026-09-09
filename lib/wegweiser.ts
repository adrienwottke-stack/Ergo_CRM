// Der Wegweiser: ein Index, der Orte UND Verben haelt
// (docs/findbarkeit-plan.md, Abschnitt 5 und 6).
//
// Der Anlass: ein Partner hat "Einheiten eintragen" nicht gefunden. Der Weg
// dorthin ging ueber "Wettbewerb" - eine Kategorie, an die niemand denkt, der
// eine Produktionszahl melden will.
//
// Dahinter steckt ein allgemeiner Satz: Die Navigation ist nach ORTEN sortiert
// (Namen, Heute, Kalender, Trichter ...), der Nutzer sucht nach VERBEN
// (eintragen, nachtragen, anrufen, umhaengen). Eine Leiste kann nicht beides
// gleichzeitig sein. Ein Index kann es.
//
// Deshalb steht in jedem Titel hier das Verb vorne: "Einheiten eintragen",
// nicht "Einheiten". Wer nur den Ort sucht, findet ihn ueber die Synonyme
// trotzdem.

export type WegweiserEintrag = {
  /** Stabiler Schluessel - taucht im Treffer-los-Log nie auf, nur intern. */
  id: string;
  /** Verb zuerst. Das ist die Zeile, die der Nutzer liest. */
  titel: string;
  href: string;
  /** Woher der Punkt kommt. Beantwortet nebenbei "wo haette ich suchen sollen?". */
  bereich: string;
  /**
   * Die Sprache des Betriebs, nicht die der Navigationsleiste.
   *
   * Hier steckt die eigentliche Arbeit - nicht im Suchfeld. Jedes Wort, das
   * hier fehlt, taucht frueher oder spaeter im Treffer-los-Log auf
   * (lib/suchlog.ts) und gehoert dann hierher.
   */
  synonyme: string[];
  nurAdmin?: boolean;
};

export const WEGWEISER: WegweiserEintrag[] = [
  {
    id: "teamziele",
    titel: "Gemeinsames Teamziel setzen",
    href: "/mannschaft/ziele",
    bereich: "Team",
    synonyme: [
      "Teamziel",
      "gemeinsamer Fortschritt",
      "gemeinsame Einheiten",
      "Teamfortschritt",
    ],
  },
  // --- Die Zahl, in der der Betrieb rechnet --------------------------------
  // Steht ganz oben, weil sie der Anlass fuer diesen ganzen Baustein war.
  {
    id: "einheiten-eintragen",
    titel: "Einheiten eintragen",
    href: "/einheiten",
    bereich: "Einheiten",
    synonyme: [
      "einheit",
      "produktion",
      "produktionsmonat",
      "stueck",
      "bewertungssumme",
      "bws",
      "eingereicht",
      "umsatz",
      "geschaeft",
      "abschluss buchen",
      "melden",
      "nachtragen",
      "storno",
      "karrierestufe",
      "stufe",
    ],
  },

  // --- Namen ---------------------------------------------------------------
  {
    id: "namen-sammeln",
    titel: "Namen sammeln",
    href: "/namen/sammeln",
    bereich: "Namen",
    synonyme: [
      "name aufnehmen",
      "neue namen",
      "liste fuellen",
      "nachfuellen",
      "brainstorming",
      "wen kenne ich",
      "bekanntenkreis",
    ],
  },
  {
    id: "namen-durchlauf",
    titel: "Liste durchtelefonieren",
    href: "/namen/anrufen",
    bereich: "Namen",
    synonyme: [
      "anrufen",
      "durchlauf",
      "durchgang",
      "telefonieren",
      "telefonat",
      "kalt",
      "abtelefonieren",
      "leitfaden",
      "gespraechsleitfaden",
      "einwand",
    ],
  },
  {
    id: "namen-nummern",
    titel: "Nummern nachtragen",
    href: "/namen/nummern",
    bereich: "Namen",
    synonyme: [
      "telefonnummer",
      "nummer fehlt",
      "handynummer",
      "kontaktdaten",
      "nummern suchen",
    ],
  },
  {
    id: "namensliste",
    titel: "Namensliste ansehen",
    href: "/namen",
    bereich: "Namen",
    synonyme: [
      "liste",
      "kontakte",
      "adressen",
      "meine namen",
      "wen kann ich anrufen",
      "umhaengen",
      "stapel",
    ],
  },
  {
    id: "kontakt-neu",
    titel: "Kontakt anlegen",
    href: "/contacts/new",
    bereich: "Namen",
    synonyme: [
      "neuer kontakt",
      "person anlegen",
      "kunde anlegen",
      "eintragen",
      "erfassen",
      "hinzufuegen",
    ],
  },

  // --- Der Tag -------------------------------------------------------------
  {
    id: "heute",
    titel: "Heute abarbeiten",
    href: "/heute",
    bereich: "Heute",
    synonyme: [
      "aufgaben",
      "faellig",
      "ueberfaellig",
      "wiedervorlage",
      "was steht an",
      "todo",
      "liegengeblieben",
      "postfach",
      "nachrichten",
    ],
  },

  // --- Kalender ------------------------------------------------------------
  {
    id: "termin-neu",
    titel: "Termin eintragen",
    href: "/kalender/neu",
    bereich: "Kalender",
    synonyme: [
      "termin anlegen",
      "eintrag anlegen",
      "blocker",
      "urlaub",
      "abwesenheit",
      "zeit blocken",
    ],
  },
  {
    id: "kalender",
    titel: "Kalender ansehen",
    href: "/kalender",
    bereich: "Kalender",
    synonyme: ["woche", "termine", "planung", "kalenderwoche"],
  },
  {
    id: "kalender-abo",
    titel: "Kalender aufs Handy holen",
    href: "/kalender/abo",
    bereich: "Kalender",
    synonyme: [
      "abo",
      "abonnieren",
      "ical",
      "ics",
      "apple kalender",
      "google kalender",
      "outlook",
      "synchronisieren",
    ],
  },
  {
    id: "kalender-quellen",
    titel: "Fremdkalender anbinden",
    href: "/kalender/quellen",
    bereich: "Kalender",
    synonyme: ["quelle", "caldav", "fremdtermine", "verbinden", "importieren"],
  },

  // --- Trichter ------------------------------------------------------------
  {
    id: "trichter",
    titel: "Trichter ansehen",
    href: "/trichter",
    bereich: "Trichter",
    synonyme: [
      "pipeline",
      "vorgaenge",
      "offene sachen",
      "was laeuft",
      "phasen",
      "quoten",
      "auswertung",
      "statistik",
    ],
  },

  // --- Mannschaft ----------------------------------------------------------
  {
    id: "mannschaft",
    titel: "Mannschaft ansehen",
    href: "/mannschaft",
    bereich: "Mannschaft",
    synonyme: [
      "struktur",
      "downline",
      "meine leute",
      "organigramm",
      "team",
      "partner",
      "fuehrung",
      "aufnehmen",
    ],
  },
  {
    id: "einladen",
    titel: "Jemanden einladen",
    href: "/einladen",
    bereich: "Einladen",
    synonyme: [
      "einladung",
      "werben",
      "rekrutieren",
      "recruiting",
      "zugang geben",
      "code",
      "qr",
      "neuer partner",
    ],
  },

  // --- Wettbewerb ----------------------------------------------------------
  {
    id: "aktivitaet-log",
    titel: "Aktivitäten nachtragen",
    href: "/log",
    bereich: "Wettbewerb",
    synonyme: [
      "anrufe zaehlen",
      "strichliste",
      "zaehler",
      "punkte",
      "meine aktivitaeten",
      "vergessen einzutragen",
    ],
  },
  {
    id: "rangliste",
    titel: "Rangliste ansehen",
    href: "/leaderboard",
    bereich: "Wettbewerb",
    synonyme: [
      "leaderboard",
      "tabelle",
      "wer fuehrt",
      "platzierung",
      "ranking",
      "vergleich",
    ],
  },
  {
    id: "arena",
    titel: "Arena öffnen",
    href: "/arena",
    bereich: "Wettbewerb",
    synonyme: [
      "wettbewerb",
      "puls",
      "zweikampf",
      "duell",
      "sprint",
      "bestmarke",
    ],
  },
  {
    id: "spiel",
    titel: "Spiel öffnen",
    href: "/spiel",
    bereich: "Wettbewerb",
    synonyme: ["storno", "stufen", "titel", "abzeichen", "freischalten"],
  },

  // --- Multiplikations-Runde (29.08.2026) ----------------------------------
  {
    id: "teamabend",
    titel: "Teamabend zeigen",
    href: "/teamabend",
    bereich: "Wettbewerb",
    synonyme: [
      "beamer",
      "teamtermin",
      "teammeeting",
      "wochenstart",
      "montagsrunde",
      "praesentieren",
      "vorfuehren",
    ],
  },
  {
    id: "bericht-link",
    titel: "Berichts-Link erzeugen",
    href: "/mannschaft/bericht",
    bereich: "Mannschaft",
    synonyme: [
      "bericht",
      "strukturbericht",
      "report",
      "nach oben",
      "direktion",
      "fk runde",
      "teilen",
      "vorzeigen",
    ],
  },
  {
    id: "kandidat-fuehren",
    titel: "Kandidaten führen",
    href: "/namen",
    bereich: "Namen",
    synonyme: [
      "kandidatur",
      "bewerber",
      "aufbau",
      "zusage",
      "infogespraech",
      "geschaeftspartner werben",
    ],
  },
  {
    id: "daten-exportieren",
    titel: "Daten exportieren",
    href: "/konto/export",
    bereich: "Konto",
    synonyme: [
      "export",
      "dsgvo",
      "auskunft",
      "sicherung",
      "backup",
      "herunterladen",
      "csv",
      "mitnehmen",
    ],
  },

  // --- Nur der Admin -------------------------------------------------------
  {
    id: "team-verwalten",
    titel: "Team verwalten",
    href: "/team",
    bereich: "Team",
    synonyme: [
      "konten",
      "nutzer",
      "passwort",
      "zugang",
      "sperren",
      "verwaltung",
    ],
    nurAdmin: true,
  },
  {
    id: "werkstatt",
    titel: "Werkstatt öffnen",
    href: "/werkstatt",
    bereich: "Team",
    synonyme: [
      "bausteine",
      "schalter",
      "feature",
      "nutzung",
      "rueckmeldungen",
      "was benutzt keiner",
    ],
    nurAdmin: true,
  },
];

/**
 * Ein Wort auf seinen Kern herunterbringen.
 *
 * Klein, ohne Eszett, ohne Umlaut. Das ist absichtlich verlustbehaftet: die
 * Regel laeuft ueber den Index UND ueber die Eingabe, damit "Stück", "Stueck"
 * und "Stuck" auf demselben Wort landen. Wer am Handy tippt, schreibt Umlaute
 * selten aus - und wer sie ausschreibt, soll deswegen nicht leer ausgehen.
 */
export function normalisiere(roh: string): string {
  return (
    roh
      .toLowerCase()
      .replace(/ß/g, "ss")
      // Erst den Umlaut auf seine ausgeschriebene Form, dann beide auf den
      // Grundbuchstaben. In dieser Reihenfolge landen "ü", "ue" und "u" auf
      // demselben Zeichen - egal, wie jemand am Handy tippt.
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/ae/g, "a")
      .replace(/oe/g, "o")
      .replace(/ue/g, "u")
      // Alles, was kein Buchstabe und keine Ziffer ist, wird zur Luecke:
      // Bindestriche, Punkte und ein versehentliches Komma sollen nicht
      // entscheiden, ob etwas gefunden wird.
      .replace(/[^a-z0-9 ]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

/**
 * Sucht im Index. Gibt die Treffer in der Reihenfolge zurueck, in der sie
 * gemeint sein duerften.
 *
 * Drei Stufen statt einer Fuzzy-Bibliothek: der Index hat zwanzig Zeilen, da
 * schlaegt eine Regel, die man lesen kann, jeden Algorithmus, den man nicht
 * mehr nachvollzieht.
 *   3 = der Titel faengt so an          ("einh" -> Einheiten eintragen)
 *   2 = ein Wort im Titel faengt so an  ("eintragen" -> Einheiten eintragen)
 *   1 = ein Synonym oder der Bereich passt
 */
export function sucheImWegweiser(
  roh: string,
  istAdmin: boolean,
): WegweiserEintrag[] {
  const frage = normalisiere(roh);
  if (!frage) return [];

  const bewertet: { eintrag: WegweiserEintrag; punkte: number }[] = [];

  for (const eintrag of WEGWEISER) {
    if (eintrag.nurAdmin && !istAdmin) continue;

    const titel = normalisiere(eintrag.titel);
    let punkte = 0;

    if (titel.startsWith(frage)) {
      punkte = 3;
    } else if (titel.split(" ").some((wort) => wort.startsWith(frage))) {
      punkte = 2;
    } else if (titel.includes(frage)) {
      punkte = 2;
    } else {
      const felder = [eintrag.bereich, ...eintrag.synonyme];
      const treffer = felder.some((feld) => {
        const wert = normalisiere(feld);
        return (
          wert.includes(frage) ||
          // Auch andersherum: wer "termin vereinbaren" tippt, meint das
          // Synonym "termin anlegen" - die Frage ist dann laenger als das Wort.
          (frage.length > 4 && frage.includes(wert))
        );
      });
      if (treffer) punkte = 1;
    }

    if (punkte > 0) bewertet.push({ eintrag, punkte });
  }

  // Bei gleicher Punktzahl bleibt die Reihenfolge des Index stehen: die ist
  // von Hand nach Haeufigkeit sortiert, nicht alphabetisch.
  return bewertet
    .sort((a, b) => b.punkte - a.punkte)
    .map((zeile) => zeile.eintrag);
}
