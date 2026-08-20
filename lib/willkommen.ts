// Das Drehbuch des Willkommens-Ablaufs (docs/willkommen-plan.md).
//
// Alle Saetze, Zweige und Rechenannahmen an einer Stelle - diese Datei wird
// am Launch-Tag noch dreimal umgeschrieben, und dann soll niemand in JSX
// zwischen divs suchen muessen. Keine KI, keine Zufaelle: Regie.

import type { ListKind } from "@/lib/generated/prisma/enums";

// Wer spricht, wenn kein Einladender am Konto haengt (Admin, Altkonten).
export const FALLBACK_ABSENDER = "Paul Ehlert";

// --- Akte -------------------------------------------------------------------
// Die Reihenfolge des Ablaufs. "boot" ist das Hochfahren (zwei Sekunden
// Theater), danach arbeitet jeder Akt etwas ab. Der Fortschrittsbalken oben
// rechnet mit dieser Liste.

export const AKTE = [
  "boot",
  "chat",
  "rechnung",
  "einwand",
  "brief",
  "sprint",
  "einstufung",
  "foto",
  "rangliste",
  "ankunft",
] as const;

export type Akt = (typeof AKTE)[number];

// Fuehrungskraefte (bestehende Konten mit Leuten darunter) bekommen einen
// eigenen, kuerzeren Weg: verstehen, was sie sehen - und die ersten
// Einladungen verschicken. Der Sprint waere fuer sie Beschaeftigungstherapie.
export const LEADER_AKTE = ["boot", "chatLeader", "fuehrung", "einladen", "ankunftLeader"] as const;

export type LeaderAkt = (typeof LEADER_AKTE)[number];

// --- Akt 1: Der Chat --------------------------------------------------------

export type ChatBlase = { art: "blase"; text: string };
export type ChatFrage = {
  art: "frage";
  id: string;
  /** Die Frage selbst - erscheint als letzte Blase vor den Antwortknoepfen. */
  text: string;
  optionen: { id: string; label: string; antwort: string[] }[];
};
export type ChatSchritt = ChatBlase | ChatFrage;

export function introChat(vorname: string, greeting: string | null): ChatSchritt[] {
  return [
    // Die persoenliche Zeile des Einladenden schlaegt jedes Template. Fehlt
    // sie, kommt der Standard-Einstieg.
    greeting
      ? { art: "blase", text: greeting }
      : { art: "blase", text: `Moin ${vorname}! Schön, dass du da bist.` },
    { art: "blase", text: "Bevor du irgendwas anklickst — zwei ehrliche Fragen." },
    {
      art: "frage",
      id: "track",
      text: "Was willst du hier vor allem?",
      optionen: [
        {
          id: "VERKAUF",
          label: "Kunden gewinnen",
          antwort: ["Gut. Dann bauen wir dir gleich deine Verkaufsliste."],
        },
        {
          id: "RECRUITING",
          label: "Ein Team aufbauen",
          antwort: ["Stark. Dann sammeln wir gleich Leute, die du begeistern willst."],
        },
      ],
    },
    {
      art: "frage",
      id: "liste",
      text: "Wie viele Leute stehen auf deiner Namensliste?",
      optionen: [
        {
          id: "kopf",
          label: "Im Kopf so 20",
          antwort: [
            "Im Kopf ist die Liste am Freitag noch da. Am Montag sind es zwölf.",
            "Deshalb wohnt sie ab heute hier.",
          ],
        },
        {
          id: "null",
          label: "Ehrlich: keine",
          antwort: ["Perfekt. Dann fangen wir genau da an — dauert drei Minuten."],
        },
      ],
    },
    { art: "blase", text: "Erstmal zeig ich dir, was das hier für dich rechnet. Los." },
  ];
}

// --- Akt 2: Die Hochrechnung ------------------------------------------------
// Kein Versprechen, Mathe: die Quoten sind bewusst vorsichtig gewaehlt und
// stehen hier, damit man nach dem ersten echten Monat nachschaerfen kann.

export const QUOTEN = {
  erreicht: 0.5, // jeder zweite Anrufversuch wird ein Gespraech
  terminJeGespraech: 0.3,
  gehalten: 0.7,
  abschlussJeTermin: 0.35,
};

export type Hochrechnung = {
  gespraecheWoche: number;
  termineMonat: number;
  abschluesseMonat: number;
  vorratWochen: number;
};

export function rechne(namen: number, anrufeProTag: number): Hochrechnung {
  const anrufeWoche = anrufeProTag * 5;
  const gespraecheWoche = anrufeWoche * QUOTEN.erreicht;
  const termineMonat = gespraecheWoche * 4 * QUOTEN.terminJeGespraech;
  const abschluesseMonat = termineMonat * QUOTEN.gehalten * QUOTEN.abschlussJeTermin;
  return {
    gespraecheWoche: Math.round(gespraecheWoche),
    termineMonat: Math.round(termineMonat),
    abschluesseMonat: Math.max(1, Math.round(abschluesseMonat)),
    vorratWochen: Math.max(1, Math.round(namen / anrufeWoche)),
  };
}

// --- Akt 3: Der Einwand-Test --------------------------------------------------
// Die eigentliche Angst an Tag 1 ist nicht die Bedienung, sondern der erste
// Anruf. Der Inhalt kommt aus den Leitfaeden (lib/guides.ts) - hier wird er
// spielbar gemacht, nicht neu erfunden.

export type Einwand = {
  satz: string;
  optionen: { text: string; richtig: boolean }[];
  /** Warum die richtige Antwort die richtige ist - eine Zeile. */
  begruendung: string;
};

export const EINWAENDE: Record<ListKind, Einwand[]> = {
  VERKAUF: [
    {
      satz: "„Da hab ich kein Geld für.“",
      optionen: [
        { text: "„Okay, meld dich, wenn sich das ändert.“", richtig: false },
        {
          text: "„Genau darum geht's — aus wenig Geld mehr machen. Deshalb reden wir ja.“",
          richtig: true,
        },
        { text: "„Es kostet doch erstmal gar nichts!“", richtig: false },
      ],
      begruendung:
        "Der Einwand IST dein Aufhänger: wer wenig hat, braucht das Thema am dringendsten.",
    },
    {
      satz: "„Ich investier schon — Trade Republic.“",
      optionen: [
        { text: "„Oh. Na dann brauchst du ja nichts.“", richtig: false },
        {
          text: "„Mega! Und hast du dabei schon mal an Steuern und Gebühren gedacht? Genau da setz ich an.“",
          richtig: true,
        },
        { text: "„Verkauf das lieber und komm zu uns.“", richtig: false },
      ],
      begruendung:
        "Weg C im Leitfaden: nie gegen das Depot reden — die Lücke zeigen, die es lässt.",
    },
    {
      satz: "„Termin? Ich hab grad echt keine Zeit.“",
      optionen: [
        { text: "„Wann hättest du denn mal Zeit?“", richtig: false },
        { text: "„Dauert auch ganz kurz, versprochen!“", richtig: false },
        {
          text: "„Unter der Woche oder am Wochenende — was passt dir besser?“",
          richtig: true,
        },
      ],
      begruendung:
        "Alternativtechnik: zwei Optionen, beide führen zum Ja. Das Ob steht nie zur Debatte, nur das Wann.",
    },
  ],
  RECRUITING: [
    {
      satz: "„Ist das nicht so ein Schneeballsystem?“",
      optionen: [
        { text: "„Nein! Wie kommst du denn darauf?“", richtig: false },
        {
          text: "„Berechtigte Frage. Schau's dir einmal an und urteile selbst — genau dafür ist der Infoabend da.“",
          richtig: true,
        },
        { text: "„Das sagen nur Leute, die es nicht verstanden haben.“", richtig: false },
      ],
      begruendung:
        "Nicht verteidigen, einladen. Wer selbst geprüft hat, glaubt sich — dir muss er nichts glauben.",
    },
    {
      satz: "„Ich hab null Ahnung von Finanzen.“",
      optionen: [
        { text: "„Macht nichts, verkaufen kann jeder.“", richtig: false },
        {
          text: "„Hatte am Anfang keiner von uns. Genau dafür ist die Ausbildung da — neben Job oder Studium.“",
          richtig: true,
        },
        { text: "„Dann wird's Zeit, dass du's lernst.“", richtig: false },
      ],
      begruendung:
        "Der Einwand ist eine Sorge, kein Nein. Die Antwort nimmt sie ernst und räumt sie aus.",
    },
    {
      satz: "„Neben Job und Uni hab ich keine Zeit.“",
      optionen: [
        { text: "„Zeit hat man nie, Zeit nimmt man sich!“", richtig: false },
        {
          text: "„Läuft nebenbei, du bestimmst das Tempo. Schau's dir einmal an — unter der Woche oder am Wochenende?“",
          richtig: true,
        },
        { text: "„Okay, dann vielleicht später mal.“", richtig: false },
      ],
      begruendung:
        "Sorge ernst nehmen und trotzdem die Alternativtechnik ans Ende — die Terminfrage bleibt offen für das Wann, nicht das Ob.",
    },
  ],
};

export const einwandAbschluss =
  "Das steht alles im Leitfaden — direkt neben deiner Namensliste. Du musst nichts auswendig können.";

// --- Akt 4: Der Brief -------------------------------------------------------

export const briefFrage = [
  "Letzte Frage, dann geht's los: Warum machst du das hier?",
  "Schreib's in zwei Sätzen auf. Ich leg's weg — und zeig es dir genau einmal wieder: dann, wenn du es brauchst.",
];

// --- Akt 5: Der Sprint ------------------------------------------------------

export const SPRINT_SEKUNDEN = 60;
// "Die meisten schaffen X" - der Vergleichswert, gegen den das Ergebnis
// gestellt wird. Nach dem Launch durch den echten Median ersetzen.
export const SPRINT_VERGLEICH = 12;

export const sprintIntro = [
  "Jetzt du. 60 Sekunden.",
  "Schreib so viele Namen auf, wie dir einfallen — die ersten, nicht die besten.",
  "Nicht nachdenken. Nachdenken ist nachher.",
];

// --- Fuehrungskraefte-Weg ----------------------------------------------------

export function leaderChat(vorname: string): ChatSchritt[] {
  return [
    { art: "blase", text: `Moin ${vorname}! Ab heute ist das hier auch deine Führungszentrale.` },
    {
      art: "blase",
      text: "Kurz die Spielregeln: Du siehst von deinen Leuten Zahlen und Pipeline — nie Kundennamen.",
    },
    {
      art: "frage",
      id: "bereit",
      text: "Bereit?",
      optionen: [
        { id: "los", label: "Zeig mir das", antwort: ["Drei Dinge, dann bist du startklar."] },
      ],
    },
  ];
}

export const fuehrungsKarten = [
  {
    titel: "Die Mannschaft",
    text: "Ein Blick am Morgen: Wer läuft, wo hakt es, wer braucht dich. Die Ampel rechnet aus echten Zahlen — nicht aus Bauchgefühl.",
    ziel: "Mannschaft",
  },
  {
    titel: "Die Frühwarn-Signale",
    text: "Stille ist das wichtigste Signal: sie kommt vor der Kündigung, nicht schlechte Zahlen. Rot heißt anrufen — nicht nach Zahlen fragen, sondern wie es läuft.",
    ziel: "Ampel",
  },
  {
    titel: "Einladen statt anlegen",
    text: "Neue Leute holst du mit einem Link oder QR-Code. Sie legen sich ihren Zugang selbst an und hängen automatisch unter dir — mit deiner persönlichen Begrüßung im ersten Chat.",
    ziel: "Einladung",
  },
] as const;

