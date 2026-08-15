// Gespraechsleitfaeden fuer die Namensliste.
//
// Die Standardtexte stehen hier im Code. Wer sie in der App bearbeitet, bekommt
// eine persoenliche Kopie in der Guide-Tabelle; alle anderen sehen weiter den
// Standard. Vorteil gegenueber einem Seeding: Wird ein Standardtext hier
// verbessert, erreicht das sofort jeden, der nichts eigenes gespeichert hat.
//
// Format: bewusst einfach, damit es im Textfeld bearbeitbar bleibt.
//   "# Ueberschrift"   – Abschnitt
//   "## Ueberschrift"  – Unterabschnitt (z. B. die Verzweigung im TVB)
//   "> Satz"           – woertliche Rede, wird hervorgehoben
//   "- Punkt"          – Aufzaehlung
//   alles andere       – Hinweistext

import type { ListKind } from "@/lib/generated/prisma/enums";

export type GuideKey = "VERKAUF_TVB" | "RECRUITING_ERSTKONTAKT";

export type GuideText = {
  key: GuideKey;
  title: string;
  body: string;
  /** Noch ein Geruest ohne eigenen Wortlaut – die Oberflaeche weist darauf hin. */
  isDraft: boolean;
};

export const guideKeyForList: Record<ListKind, GuideKey> = {
  RECRUITING: "RECRUITING_ERSTKONTAKT",
  VERKAUF: "VERKAUF_TVB",
};

// Der TVB-Leitfaden im Wortlaut. Die Stellen in [eckigen Klammern] sind
// bewusst offen – sie werden je Gespraech gefuellt, nicht einmalig ersetzt.
const VERKAUF_TVB = `Ca. 3 Minuten · Ziel: Termin legen · Ton: locker & ehrlich

# 01 · Smalltalk & Einstieg
Locker rein, dann die Erlaubnis holen.
Erst echtes Interesse zeigen – Hobby, Job, Wochenende. Das holt dich sauber ins Thema.
> Kurzer Smalltalk … und dann: „Darf ich direkt zum Punkt kommen?“

# 02 · Der Aufhänger · Thema Geld
Warum das Thema wichtig ist.
> „Du weißt ja, ich beschäftige mich mit dem Thema Sparanlagen, Kapitalanlagen bzw. allgemein mit dem Thema Geld. Das ist etwas, das man in der Regel nicht in der Schule behandelt hat — stimmst du mir zu, oder hast du was über Investieren und Steuern-sparen gelernt?“
Reaktion: „Ja, stimme ich dir zu“ / „Hab auch nichts darüber gelernt.“ → weiter.
> „Und das ist ja eine sehr wichtige Thematik — weil man später im Leben eine größere Summe braucht: ob fürs [Haus], [Auto] oder eben für die Rente.“
> „Und wenn man sich nie damit beschäftigt, wird man logischerweise später auch nichts haben.“
Persönlich machen: den echten Traum der Person einsetzen — Porsche, Audi, eigenes Haus, was auch immer sie antreibt.

# 03 · Bedarfsfrage
Was macht er aktuell mit seinem Geld?
> „Ich weiß ja, du machst eine Ausbildung als / arbeitest als [Tätigkeit] — was machst du aktuell mit deinem Geld? Investierst du es schon oder liegt es auf dem Konto rum?“
Nur bei A- und B-Kontakten locker nachlegen: „Schmeißt du's zum Fenster raus? Verbrennst du's für Zigaretten? Haust du's beim Feiern alles auf den Tisch?“ — Stimmung machen, nicht bei kühlen Kontakten.

# 04 · Verzweigung · je nach Antwort

## Weg A · Er macht schon etwas
Sparkonto, zurücklegen, Spardose …
> „Perfekt, genauso hab ich dich eingeschätzt! Ich zeige dir eine Möglichkeit, wie du passiv & langfristig aus wenig Geld mehr Geld machst. Wann passt's dir besser — unter der Woche oder am Wochenende?“

## Weg B · Er macht nichts
Das Geld liegt einfach rum.
> „Dann ist heute dein Glückstag! / Perfekt, dass du rangegangen bist — ich zeige dir eine Möglichkeit, wie du passiv & langfristig aus wenig Geld mehr Geld machen kannst!“

## Weg C · Er investiert schon (ETF / Fonds)
> „Perfekt, genauso hab ich dich eingeschätzt — wo investierst du es denn?“
Ziel: herausfinden, ob es über Trade Republic / einen Broker oder über eine Versicherung läuft.

## C1 · Über eine Versicherung
> „Perfekt, dann biete ich dir einen kostenlosen Vergleich an. Wenn ja, hast du entweder schon das Beste am Markt — oder ich kann dir etwas noch Besseres zeigen. Du kannst also nur gewinnen!“

## C2 · Trade Republic / anderer Broker
> „Mega! [Vorteile unseres Produkts nennen] — hast du schon mal über Steueroptimierung nachgedacht? Oder wie du noch mehr Rendite holst? Langfristig sicherer? Mehr Flexibilität? Gebühren sparen?“
> „Dann kann ich dir genau zeigen, wie das funktioniert!“

# Alternativtechnik
Statt Ja/Nein zwei Optionen anbieten — beide führen zum Ja.
> „Passt's dir besser unter der Woche oder am Wochenende?“
Damit steht die Terminfrage nie zur Debatte, nur noch das Wann.

# 05 · Wichtige Punkte
- Ca. 3 Minuten. Kurz halten — es geht nur um den Termin, nicht ums Verkaufen.
- Ehrliches Interesse: erst Mensch, dann Thema.
- Wissen, wen du anrufst: Hobby, Beruf, finanzielle Ziele vorher kurz checken.
- Emotionen! 3–5 Stichpunkte notieren, die dich selbst überzeugt haben — vorm Call durchlesen.
- Ablauf erklären: der Termin dauert ca. 1 – 1,5 Stunden. Klar ansagen.
- Druck rausnehmen: „Am Ende entscheidest du selbst, ob du's nutzt oder nicht.“
- EFA können: Einwände souverän parieren, vorbereitet sein.
- Termin legen! Das ist das einzige Ziel des Calls. Nicht ohne Termin auflegen.`;

// Geruest, kein fertiger Leitfaden: die Struktur steht, der Wortlaut in den
// Klammern gehoert ersetzt. Ein ausgedachter Gespraechseinstieg waere
// schlimmer als eine ehrliche Luecke.
const RECRUITING_ERSTKONTAKT = `# Vorbereitung
Lächeln, aufrecht stehen, Namen der Person parat. Ziel ist der Termin, nicht das Erklären am Telefon.

# Einstieg
> Hallo [Name], hier ist [dein Name]. Hast du kurz zwei Minuten?

# Aufhänger
[Warum rufst du gerade diese Person an? Ein Satz, ehrlich und konkret — gemeinsame Vergangenheit, ihre berufliche Situation, eine Bemerkung von neulich.]

# Überleitung zum Beruf
[Was machst du jetzt, in einem Satz? Kein Fachchinesisch, keine Produkte.]

# Terminfrage
Alternativtechnik: zwei Optionen statt Ja/Nein.
> Ich zeig dir das am besten mal in Ruhe. Passt's dir besser unter der Woche oder am Wochenende?

# Einwände
"Keine Zeit" → [deine Antwort]
"Kein Interesse" → [deine Antwort]
"Schick mir was per Mail" → [deine Antwort]
"Was ist das denn genau?" → [deine Antwort, kurz halten, dann zurück zur Terminfrage]

# Abschluss
Termin wiederholen, Ort und Uhrzeit bestätigen, bedanken.
> Dann bis [Tag] um [Uhrzeit]. Ich freu mich!`;

export const DEFAULT_GUIDES: Record<GuideKey, GuideText> = {
  VERKAUF_TVB: {
    key: "VERKAUF_TVB",
    title: "TVB-Leitfaden · Terminvereinbarung",
    body: VERKAUF_TVB,
    isDraft: false,
  },
  RECRUITING_ERSTKONTAKT: {
    key: "RECRUITING_ERSTKONTAKT",
    title: "Recruiting · Erstkontakt",
    body: RECRUITING_ERSTKONTAKT,
    isDraft: true,
  },
};

export const ALL_GUIDE_KEYS: GuideKey[] = [
  "VERKAUF_TVB",
  "RECRUITING_ERSTKONTAKT",
];

export function isGuideKey(value: string): value is GuideKey {
  return (ALL_GUIDE_KEYS as string[]).includes(value);
}

// --- Anzeige ----------------------------------------------------------------

export type GuideBlock =
  | { kind: "heading"; text: string }
  | { kind: "subheading"; text: string }
  | { kind: "quote"; text: string }
  | { kind: "bullet"; text: string }
  | { kind: "text"; text: string };

// Zerlegt den Text in Bloecke. Leerzeilen trennen nur optisch und fallen weg.
export function parseGuide(body: string): GuideBlock[] {
  return body
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      if (line.startsWith("## ")) {
        return { kind: "subheading" as const, text: line.slice(3).trim() };
      }
      if (line.startsWith("# ")) {
        return { kind: "heading" as const, text: line.slice(2).trim() };
      }
      if (line.startsWith("> ")) {
        return { kind: "quote" as const, text: line.slice(2).trim() };
      }
      if (line.startsWith("- ")) {
        return { kind: "bullet" as const, text: line.slice(2).trim() };
      }
      return { kind: "text" as const, text: line.trim() };
    });
}

// Offene Stellen wie [dein Name]. Beim Geruest ein Hinweis, dass der eigene
// Wortlaut fehlt; beim fertigen Leitfaden nur Einsetzstellen je Gespraech.
export function countPlaceholders(body: string): number {
  return body.match(/\[[^\]]+\]/g)?.length ?? 0;
}
