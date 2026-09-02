// Der Rueckblick fuer den Teamabend: automatisch erzeugte Karten mit je EINEM
// Highlight - docs/emil-feedback-runde-2.md, Abschnitt 7, AP-24, Entscheidung
// D20 ("Auto-Rueckblick-Karten, von Emil kuratiert; Negatives nur aggregiert").
//
// Emils Satz dahinter (N13): der Teamabend ist Kommunikation, nicht
// Auswertung. Er will ansprechen koennen, "was lief, was nicht und was bei
// Einzelnen besonders gut lief" - und zwar vorbereitet, nicht suchend.
//
// DIE PRANGER-REGEL IST DIE WICHTIGSTE ZEILE DIESER DATEI.
//
// Was hakt, steht NIE an einem Namen (CONTEXT.md, Glossar "Rueckblick-Karte";
// docs/wettbewerb-plan.md:407-421 "bewusst nicht gebaut": kein
// Abstiegs-Pranger, keine automatische Meldung an die Fuehrungskraft, weil
// beides den Wettbewerb in ein Kontrollinstrument verwandelt). Deshalb ist
// diese Datei zweigeteilt:
//
//   Personenkarten  tragen einen Namen und sind AUSNAHMSLOS positiv. Wer kein
//                   Highlight hat, bekommt keine Karte - eine Karte "Nick:
//                   nur 4 Anrufe" gibt es nicht und darf es nie geben.
//   Team-Karte      traegt das, was hakt, und traegt KEINEN Namen. Genau eine,
//                   ueber die ganze Struktur summiert.
//
// Wer hier eine Karte ergaenzt, prueft zuerst diese Trennung. Eine negative
// Personenkarte waere kein Fehler in der Anzeige, sondern ein anderes Produkt.
//
// DIE PRIORITAETENLISTE - MAXIMAL EINE KARTE JE PERSON.
//
// Zehn Karten ueber fuenf Koepfe sind kein Rueckblick, sondern eine Tabelle.
// Jede Person bekommt daher hoechstens ihr STAERKSTES Highlight, in dieser
// Reihenfolge (AP-24):
//
//   1. haelt gerade einen Wochentitel  - die hoechste Auszeichnung der Woche
//      (lib/titel.ts); sie steht ohnehin schon auf dem Bildschirm, die Karte
//      erzaehlt sie nur aus.
//   2. beste Uebergangsquote Anrufe -> vereinbarte Termine, Mindestbasis
//      10 Anrufe. SUPERLATIV, also genau eine Person: der Satz behauptet
//      "beste Quote der Woche", und das darf nur stimmen. Haelt der Beste
//      schon einen Titel, entfaellt die Quoten-Karte ersatzlos - der Zweite
//      bekommt sie NICHT, sonst stuende eine Unwahrheit an der Wand.
//   3. groesster Sprung der Anrufe gegen die Vorwoche, absolut >= 5. Das ist
//      eine SCHWELLE, kein Superlativ: der Kartentext behauptet nichts ueber
//      andere ("31 Anrufe, 12 mehr als in der Vorwoche"), und ein Teamabend
//      mit einer einzigen Karte waere kein Rueckblick. "Groesster" entscheidet
//      damit die Reihenfolge der Karten, nicht wer ueberhaupt eine bekommt.
//   4. Serie >= 3 Tage. Dieselbe Zahl wie in der Arena (streakDays,
//      lib/stats.ts) ueber dasselbe 60-Tage-Fenster - zwei Bildschirme
//      desselben Abends duerfen nicht zwei Serien zeigen.
//
// Die Mindestmengen stehen wie in lib/titel.ts an EINER Stelle
// (RUECKBLICK_SCHWELLEN). Ohne sie gewinnt "beste Quote", wer zwei Anrufe und
// einen Termin hatte.
//
// EINE DATENRUNDE FUER ALLES.
//
// Ein einziges dailyLog.groupBy ueber 60 Tage traegt jede Zahl dieser Datei:
// die laufende Woche (Mo bis heute), die Vorwoche fuer den Sprung, die
// Tagesmenge fuer die Serie und die Team-Summen fuer den Engpass. Keine
// Abfrage je Person - genau das verbietet AP-24 ("keine neuen je Zeile"). Das
// Fenster ist mit Absicht 60 Tage: dieselbe Spanne, aus der lib/arena.ts die
// Serie rechnet. Enger gefasst zeigte der Teamabend eine kuerzere Serie als
// die Arena am selben Tag.
//
// Die Titel-Staende kommen als Parameter herein, wenn der Aufrufer sie schon
// hat: /teamabend laedt ladeTitelStaende() ohnehin fuer den Block "Titel
// dieser Woche". Ohne den Parameter laedt diese Datei sie selbst nach - der
// Aufruf bleibt damit fuer sich allein benutzbar, kostet die Seite aber keine
// zweite Runde. Die Titel sind bewusst die NETZWERKWEITEN Staende: wer in
// meiner Struktur die beste Quote hat, haelt deshalb noch keinen Titel - und
// eine Karte, die einen Titel behauptet, den die Arena nicht zeigt, waere
// genau die Sorte Fehler, die vor versammelter Mannschaft auffliegt.

import { prisma } from "@/lib/prisma";
import { berlinDayOf, berlinToday, dayToUtcDate, mondayOf, shiftDay } from "@/lib/dates";
import { streakDays } from "@/lib/stats";
import { strukturKonten } from "@/lib/struktur";
import { ladeTitelStaende, type TitelStand } from "@/lib/titel";
import type { QuotaType } from "@/lib/generated/prisma/enums";

/** Die Schwellen an einer Stelle - siehe TITEL_MINDEST in lib/titel.ts. */
export const RUECKBLICK_SCHWELLEN = {
  /** Anrufe, ab denen eine Quote ueberhaupt eine Aussage ist. */
  quoteAnrufe: 10,
  /** Zusaetzliche Anrufe gegen die Vorwoche, ab denen der Sprung zaehlt. */
  sprungAnrufe: 5,
  /** Tage in Folge, ab denen die Serie eine Karte wert ist. */
  serieTage: 3,
  /** Basis eines Uebergangs, ab der er Engpass sein darf. */
  engpassBasis: 10,
} as const;

// Dasselbe Fenster wie die Serien-Rechnung in lib/arena.ts.
const SERIEN_FENSTER_TAGE = 60;

export type Rueckblickart = "titel" | "quote" | "sprung" | "serie" | "engpass";

/**
 * Eine Karte fuer den Teamabend. Ein Gedanke, eine Zahl, ein Satz.
 *
 * `id` ist stabil ueber Neuladen hinweg ("person-<userId>", "team-engpass") -
 * daran haengt die Kuratierung in components/RueckblickKarten.tsx.
 */
export type Rueckblickkarte = {
  id: string;
  art: Rueckblickart;
  /** Kleines Etikett ueber der Zahl ("Beste Quote", "Serie"). */
  marke: string;
  /** Die Zahl, die gross steht - fertig formatiert ("26 %", "+12"). */
  zahl: string;
  /** Der eine trockene Satz darunter. Enthaelt die Zahl noch einmal im Text. */
  text: string;
};

export type Rueckblick = {
  karten: Rueckblickkarte[];
  /**
   * Ob unter dieser Fuehrungskraft ueberhaupt jemand haengt.
   *
   * Trennt die zwei Leerfaelle, die verschieden aussehen muessen: ohne
   * Struktur entfaellt die Sektion still (ein Rueckblick auf sich selbst ist
   * kein Teamabend), mit Struktur aber ohne Highlight steht ein Satz da.
   */
  hatStruktur: boolean;
};

// --- Innenleben --------------------------------------------------------------

type Kopf = {
  personId: string;
  /** Stabiler Teil der Karten-Id. */
  kartenSchluessel: string;
  name: string;
  anrufe: number;
  vereinbart: number;
  anrufeVorwoche: number;
  serie: number;
};

type LogZeile = {
  personId: string;
  type: QuotaType;
  date: Date;
  _sum: { count: number | null };
};

/** Karte plus die zwei Zahlen, nach denen sortiert wird. */
type Entwurf = { karte: Rueckblickkarte; rang: number; groesse: number };

const RANG: Record<Rueckblickart, number> = {
  titel: 0,
  quote: 1,
  sprung: 2,
  serie: 3,
  engpass: 4,
};

function prozent(teil: number, ganz: number): number {
  return ganz === 0 ? 0 : Math.round((teil / ganz) * 100);
}

/**
 * Die kurze Form eines Titel-Werts, fuer die Zahl, die gross steht.
 *
 * lib/titel.ts formatiert seine Werte als ganze Angabe: "26 %", "18 an einem
 * Tag", "5 von 5 Tagen". Der ganze Satz gehoert in den Kartentext; gross
 * stehen soll nur die Zahl davor - "18 an einem Tag" in Schlagzeilengroesse
 * braeche auf einer halben Karte in drei Zeilen um. Passt nichts, bleibt der
 * Wert unveraendert stehen: lieber ein langer Kopf als ein leerer.
 */
function kurzeZahl(wert: string): string {
  const treffer = /^\d+(?:[.,]\d+)?(?:\s*%)?/.exec(wert);
  return treffer ? treffer[0].trim() : wert;
}

/**
 * Die drei Uebergaenge des Trichters, in derselben Reihenfolge und mit
 * denselben Woertern wie /trichter (app/(app)/trichter/page.tsx:163-193) -
 * ein Engpass soll auf beiden Bildschirmen gleich heissen.
 *
 * Der Satzbau steckt hier, weil nur er die Einzahl kennt: die Basis liegt
 * dank engpassBasis immer ueber 1, das Ergebnis kann aber genau 1 sein.
 */
const UEBERGAENGE: {
  key: string;
  satz: (von: number, nach: number) => string;
}[] = [
  {
    key: "vereinbart",
    satz: (von, nach) =>
      `aus ${von} Anrufen ${nach === 1 ? "wurde 1 Termin" : `wurden ${nach} Termine`}`,
  },
  {
    key: "gehalten",
    satz: (von, nach) =>
      `aus ${von} vereinbarten Terminen ${
        nach === 1 ? "wurde 1 gehaltener Termin" : `wurden ${nach} gehaltene Termine`
      }`,
  },
  {
    key: "abschluesse",
    satz: (von, nach) =>
      `aus ${von} gehaltenen Terminen ${
        nach === 1 ? "wurde 1 Abschluss" : `wurden ${nach} Abschlüsse`
      }`,
  },
];

/**
 * Das staerkste Highlight einer Person - oder nichts.
 *
 * Rein: dieselbe Eingabe ergibt immer dieselbe Ausgabe, keine Datenbank, kein
 * Datum. Die Priorisierung steht im Kopfkommentar der Datei.
 */
function entwurfFuer(
  kopf: Kopf,
  stand: TitelStand | null,
  istBesteQuote: boolean
): Entwurf | null {
  const id = `person-${kopf.kartenSchluessel}`;

  if (stand?.haelter) {
    return {
      rang: RANG.titel,
      groesse: 0,
      karte: {
        id,
        art: "titel",
        marke: "Titel dieser Woche",
        zahl: kurzeZahl(stand.haelter.wert),
        text: `${kopf.name}: ${stand.titel} — ${stand.haelter.wert}.`,
      },
    };
  }

  if (istBesteQuote) {
    const anteil = prozent(kopf.vereinbart, kopf.anrufe);
    return {
      rang: RANG.quote,
      groesse: anteil,
      karte: {
        id,
        art: "quote",
        marke: "Beste Quote",
        zahl: `${anteil} %`,
        text: `${kopf.name}: ${kopf.vereinbart} ${
          kopf.vereinbart === 1 ? "Termin" : "Termine"
        } aus ${kopf.anrufe} Anrufen — beste Quote der Woche.`,
      },
    };
  }

  const sprung = kopf.anrufe - kopf.anrufeVorwoche;
  if (sprung >= RUECKBLICK_SCHWELLEN.sprungAnrufe) {
    return {
      rang: RANG.sprung,
      groesse: sprung,
      karte: {
        id,
        art: "sprung",
        marke: "Mehr Anrufe",
        zahl: `+${sprung}`,
        text: `${kopf.name}: ${kopf.anrufe} Anrufe, ${sprung} mehr als in der Vorwoche.`,
      },
    };
  }

  if (kopf.serie >= RUECKBLICK_SCHWELLEN.serieTage) {
    return {
      rang: RANG.serie,
      groesse: kopf.serie,
      karte: {
        id,
        art: "serie",
        marke: "Serie",
        zahl: `${kopf.serie} Tage`,
        text: `${kopf.name}: ${kopf.serie} Tage in Folge etwas eingetragen.`,
      },
    };
  }

  return null;
}

// --- Der Aufruf --------------------------------------------------------------

/**
 * Die Karten des Teamabends fuer die laufende Kalenderwoche (Montag bis
 * heute), gerechnet ueber die eigene Struktur der Fuehrungskraft
 * (strukturKonten - ich und alles unter mir, Ausgetretene draussen).
 *
 * `titel` reicht der Aufrufer durch, wenn er die Staende schon geladen hat -
 * siehe Kopfkommentar. `heute` gibt es nur, damit die Woche von aussen
 * feststellbar ist; im Betrieb bleibt es der Berliner Kalendertag.
 *
 * Jede Abfrage faellt im Fehlerfall auf eine leere Liste zurueck. Ein
 * Bildschirm, der vor versammelter Mannschaft mit einem Stacktrace stehen
 * bleibt, ist schlimmer als einer ohne Karten.
 */
export async function rueckblickKarten(
  fkUserId: string,
  optionen: { heute?: string; titel?: TitelStand[] } = {}
): Promise<Rueckblick> {
  const heute = optionen.heute ?? berlinToday();

  const konten = await strukturKonten(fkUserId).catch(() => [] as string[]);
  // Ein Konto ist man selbst. Wer niemanden unter sich hat, hat keinen
  // Teamabend - die Sektion entfaellt dann still.
  if (konten.length <= 1) return { karten: [], hatStruktur: false };

  const personen = await prisma.person
    .findMany({
      where: { userId: { in: konten } },
      select: { id: true, name: true, userId: true },
    })
    .catch(() => [] as { id: string; name: string; userId: string | null }[]);
  if (personen.length === 0) return { karten: [], hatStruktur: true };

  const seit = dayToUtcDate(shiftDay(heute, -SERIEN_FENSTER_TAGE));
  const zeilen = await prisma.dailyLog
    .groupBy({
      by: ["personId", "type", "date"],
      where: { personId: { in: personen.map((person) => person.id) }, date: { gte: seit } },
      _sum: { count: true },
    })
    .catch(() => [] as LogZeile[]);

  const wochenStart = mondayOf(heute);
  const vorwochenStart = shiftDay(wochenStart, -7);

  const koepfe = new Map<string, Kopf>();
  for (const person of personen) {
    koepfe.set(person.id, {
      personId: person.id,
      // Der Filter oben laesst nur Personen MIT Konto durch; das ?? faengt
      // nur die Typisierung ab (Person.userId ist im Schema optional).
      kartenSchluessel: person.userId ?? person.id,
      name: person.name,
      anrufe: 0,
      vereinbart: 0,
      anrufeVorwoche: 0,
      serie: 0,
    });
  }

  const tageJePerson = new Map<string, Set<string>>();
  const team = { anrufe: 0, vereinbart: 0, gehalten: 0, abschluesse: 0 };

  for (const zeile of zeilen) {
    const kopf = koepfe.get(zeile.personId);
    if (!kopf) continue;

    // DailyLog.date steht als UTC-Mitternacht des Berliner Kalendertags in der
    // Datenbank - berlinDayOf liest daraus denselben Tag-String wie
    // lib/arena.ts und lib/titel.ts.
    const tag = berlinDayOf(zeile.date);

    // Serie: jeder Tag mit einem Eintrag zaehlt, unabhaengig von Typ UND
    // Menge - genau wie ladeRangliste() in lib/arena.ts, die ihre Tagesmenge
    // ohne Blick auf count baut. Deshalb steht das vor der Mengen-Pruefung:
    // eine auf null korrigierte Buchung hat den Tag trotzdem stattfinden
    // lassen, und zwei Bildschirme desselben Abends duerfen nicht zwei
    // verschiedene Serien zeigen.
    let tage = tageJePerson.get(zeile.personId);
    if (!tage) {
      tage = new Set();
      tageJePerson.set(zeile.personId, tage);
    }
    tage.add(tag);

    const menge = zeile._sum.count ?? 0;
    if (menge === 0) continue;

    if (tag >= wochenStart && tag <= heute) {
      if (zeile.type === "CALL") {
        kopf.anrufe += menge;
        team.anrufe += menge;
      } else if (zeile.type === "APPOINTMENT_SET") {
        kopf.vereinbart += menge;
        team.vereinbart += menge;
      } else if (zeile.type === "APPOINTMENT_HELD") {
        team.gehalten += menge;
      } else if (zeile.type === "DEAL_WON") {
        team.abschluesse += menge;
      }
    } else if (tag >= vorwochenStart && tag < wochenStart && zeile.type === "CALL") {
      kopf.anrufeVorwoche += menge;
    }
  }

  for (const kopf of koepfe.values()) {
    kopf.serie = streakDays(tageJePerson.get(kopf.personId) ?? new Set(), heute);
  }

  // --- Titel: netzwerkweite Staende, hier nur auf die eigene Struktur
  //     heruntergefiltert. Haelt jemand zwei Titel, gilt der erste - eine
  //     Person bekommt nur eine Karte.
  const staende = optionen.titel ?? (await ladeTitelStaende(heute));
  const titelJePerson = new Map<string, TitelStand>();
  for (const stand of staende) {
    const haelter = stand.haelter;
    if (!haelter || !koepfe.has(haelter.personId)) continue;
    if (!titelJePerson.has(haelter.personId)) titelJePerson.set(haelter.personId, stand);
  }

  // --- Beste Quote: genau eine Person, sonst luegt der Satz. Ohne einen
  //     einzigen vereinbarten Termin ist eine Quote von 0 % kein Highlight.
  let besteQuote: Kopf | null = null;
  for (const kopf of koepfe.values()) {
    if (kopf.anrufe < RUECKBLICK_SCHWELLEN.quoteAnrufe || kopf.vereinbart === 0) continue;
    if (!besteQuote || kopf.vereinbart / kopf.anrufe > besteQuote.vereinbart / besteQuote.anrufe) {
      besteQuote = kopf;
    }
  }

  const entwuerfe: Entwurf[] = [];
  for (const kopf of koepfe.values()) {
    const entwurf = entwurfFuer(
      kopf,
      titelJePerson.get(kopf.personId) ?? null,
      besteQuote?.personId === kopf.personId
    );
    if (entwurf) entwuerfe.push(entwurf);
  }

  // Erst nach Art (die Prioritaetenliste), dann innerhalb der Art nach Groesse
  // - so steht der groesste Sprung vor dem kleineren. Der Name entscheidet
  // zuletzt, damit die Reihenfolge bei gleichen Zahlen nicht springt.
  entwuerfe.sort(
    (a, b) =>
      a.rang - b.rang ||
      b.groesse - a.groesse ||
      a.karte.text.localeCompare(b.karte.text, "de")
  );

  const karten = entwuerfe.map((entwurf) => entwurf.karte);

  // --- Die eine Team-Karte: der schwaechste Uebergang der Woche, ohne Namen.
  //     Bei Gleichstand gewinnt der fruehere Uebergang im Trichter - weiter
  //     vorn zu reparieren wirkt auf alles dahinter.
  const werte: Record<string, { von: number; nach: number }> = {
    vereinbart: { von: team.anrufe, nach: team.vereinbart },
    gehalten: { von: team.vereinbart, nach: team.gehalten },
    abschluesse: { von: team.gehalten, nach: team.abschluesse },
  };

  let engpass: { satz: string; von: number; nach: number } | null = null;
  let engpassAnteil = Infinity;
  for (const uebergang of UEBERGAENGE) {
    const wert = werte[uebergang.key];
    if (!wert || wert.von < RUECKBLICK_SCHWELLEN.engpassBasis) continue;
    const anteil = wert.nach / wert.von;
    if (anteil < engpassAnteil) {
      engpassAnteil = anteil;
      engpass = { satz: uebergang.satz(wert.von, wert.nach), von: wert.von, nach: wert.nach };
    }
  }

  if (engpass) {
    karten.push({
      id: "team-engpass",
      art: "engpass",
      marke: "Woran wir arbeiten",
      zahl: `${prozent(engpass.nach, engpass.von)} %`,
      text: `Woran wir diese Woche arbeiten: ${engpass.satz} (${prozent(
        engpass.nach,
        engpass.von
      )} %).`,
    });
  }

  return { karten, hatStruktur: true };
}
