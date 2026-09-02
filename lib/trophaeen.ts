// Saison-Trophaeen: was am Monatsende stehen bleibt (AP-28, D19).
//
// Die Woche ist der Spieltag, der Monat die Saison (docs/wettbewerb-plan.md,
// Abschnitt 1). Die Wochentabelle faellt jeden Montag auf null zurueck - danach
// erinnert nichts mehr daran, wer im August vorn war. Eine Trophaee ist genau
// das: der Beweis, dass ein Monat stattgefunden hat.
//
// Vier Entscheidungen, die den Rest erklaeren:
//
// 1. MIT ABLAUF, DESHALB UEBERHAUPT. Eine Abzeichen-Sammlung OHNE Ablauf wurde
//    geprueft und verworfen ("nach acht Wochen hat jeder alles, und nichts
//    bedeutet mehr etwas", docs/wettbewerb-plan.md 13.4). Eine Trophaee traegt
//    ihr Saison-Datum und wird im naechsten Monat neu vergeben. Sie wird nicht
//    gesammelt, sie wird verliehen.
// 2. NICHTS WIRD GESPEICHERT. Keine Migration, keine Tabelle, kein zweiter
//    Punktespeicher - gerechnet wird bei jeder Anzeige aus DailyLog, wie
//    ueberall hier. Der Preis dafuer ist bewusst: aendert jemand die Gewichte
//    in lib/labels.ts oder die Schwelle unten, schreibt sich die Vitrine
//    rueckwirkend um, und der August kann im Oktober anders aussehen als im
//    September. Das ist ehrlicher als eine Vitrine, die alte Regeln einfriert
//    und damit zwei Regelwerke nebeneinander stellt, von denen keiner mehr
//    weiss, welches gerade gilt. Dieselbe Falle, derselbe Rat wie bei
//    quotaTypePoints und STUFEN: einmal setzen, dann nicht mehr daran drehen.
// 3. DIESELBEN PUNKTE WIE DIE ARENA. Der Saisonsieger wird mit
//    quotaTypePoints gerechnet UND mit dem Anwesenheits-Punkt, exakt wie
//    ladeRangliste in lib/arena.ts. Sonst gaebe es zwei Punktbegriffe: die
//    Wochentabelle zaehlt 84, die Vitrine 71, und niemand koennte erklaeren,
//    warum. Wer nur da war, kann damit theoretisch eine tote Saison gewinnen -
//    dieselbe Eigenschaft hat die Wochentabelle seit dem Anwesenheits-Punkt,
//    und sie ist dort bewusst so entschieden worden.
//    Die Tageskappen (quotaTagesKappe) werden hier NICHT nachtraeglich
//    angewandt, weil die Arena das auch nicht tut: die Kappe ist eine Grenze
//    beim Eintragen (kappeRest in lib/fairness.ts), keine Korrektur beim
//    Ablesen. Sie hier zu ziehen, waere derselbe Fehler wie eine eigene
//    Punkterechnung.
// 4. KEIN PLATZHALTER KANN GEWINNEN. Gerechnet wird ueber DailyLog und
//    Anwesenheit; beide haengen an einer Person. Konten ohne Wettbewerbs-
//    Identitaet haben dort keine Zeile und tauchen deshalb nie auf - das muss
//    nicht zusaetzlich gefiltert werden.

import { prisma } from "@/lib/prisma";
import { ANWESENHEITS_PUNKT } from "@/lib/anwesenheit";
import { addMonths, berlinDayOf, berlinToday, startOfMonth } from "@/lib/dates";
import { quotaTypePoints } from "@/lib/labels";

// Mindestbasis fuer den Quotenkoenig. Ohne sie gewinnt, wer drei Anrufe
// gemacht und einen Termin bekommen hat - dieselbe Ueberlegung wie bei
// TITEL_MINDEST in lib/titel.ts, nur ueber einen Monat statt eine Woche.
// Vierzig ist bewusst hoeher als die zwanzig der Wochen-Titel: eine Saison ist
// vier Wochen lang, und eine Quote aus zwanzig Anrufen in einem Monat sagt
// nichts ueber Faehigkeit, sondern nur ueber Glueck. Sie zu senken ist billig,
// sie zu erhoehen nimmt jemandem rueckwirkend eine Trophaee weg.
export const QUOTENKOENIG_MINDEST_ANRUFE = 40;

export type TrophaeenArt = "saisonsieger" | "quotenkoenig" | "dauerlaeufer";

/** Feste Reihenfolge fuer die Anzeige. Die Vitrine soll nicht springen. */
export const TROPHAEEN_ARTEN: readonly TrophaeenArt[] = [
  "saisonsieger",
  "quotenkoenig",
  "dauerlaeufer",
];

export const TROPHAEEN_ETIKETT: Record<TrophaeenArt, string> = {
  saisonsieger: "Saisonsieger",
  quotenkoenig: "Quotenkönig",
  dauerlaeufer: "Dauerläufer",
};

export type Trophaee = {
  art: TrophaeenArt;
  halterPersonId: string;
  halterName: string;
  /** Die nackte Zahl - Punkte, Quote als Anteil 0..1, Tage. */
  wert: number;
  /** Dieselbe Zahl, wie sie dasteht: "312 Punkte", "26 %", "19 Tage". */
  wertText: string;
};

export type Saison = {
  /** "2026-08" - Berliner Kalendermonat. */
  schluessel: string;
  /** "August 2026". */
  label: string;
  /** "August" - ohne Jahr, fuer den Satz zum Zwischenstand. */
  monat: string;
  /** Bis zu drei. Fehlt eine Art, hat sie in dieser Saison niemand verdient. */
  trophaeen: Trophaee[];
};

/** Alles, was die Trophaeen ueber einen Kopf wissen muessen. Ein Monat, ein Kopf. */
export type SaisonZahlen = {
  personId: string;
  name: string;
  /** Wie in der Arena: Gewichte plus Anwesenheits-Punkte. */
  punkte: number;
  anrufe: number;
  termineVereinbart: number;
  /** Tage mit mindestens einem DailyLog-Eintrag. */
  tage: number;
  /**
   * Zeitstempel des ersten Eintrags des Monats. Entscheidet Gleichstaende:
   * bei gleichem Wert gewinnt, wer in diesem Monat zuerst angefangen hat.
   * Ein Gleichstand muss irgendwie aufgeloest werden, und "der Fruehere" ist
   * die einzige Regel, die niemand als Zufall empfindet - alphabetisch waere
   * eine Bevorzugung nach Nachnamen, die Datenbank-Reihenfolge waere gar keine
   * Regel. Wer im Monat nur anwesend war und nichts eingetragen hat, steht
   * hier auf Infinity und verliert jeden Gleichstand.
   */
  erstesLog: number;
};

const monatMitJahr = new Intl.DateTimeFormat("de-DE", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const monatAllein = new Intl.DateTimeFormat("de-DE", {
  month: "long",
  timeZone: "UTC",
});

/**
 * Der Beste nach `wert`. Null-Werte zaehlen nicht mit: eine Trophaee fuer
 * null Punkte, null Prozent oder null Tage ist keine Trophaee, sondern ein
 * leerer Kasten mit einem Namen darin.
 */
function bester(
  zeilen: readonly SaisonZahlen[],
  wert: (zeile: SaisonZahlen) => number,
): { zeile: SaisonZahlen; wert: number } | null {
  let treffer: { zeile: SaisonZahlen; wert: number } | null = null;
  for (const zeile of zeilen) {
    const w = wert(zeile);
    if (w <= 0) continue;
    const besser =
      !treffer ||
      w > treffer.wert ||
      (w === treffer.wert && zeile.erstesLog < treffer.zeile.erstesLog);
    if (besser) treffer = { zeile, wert: w };
  }
  return treffer;
}

function trophaee(
  art: TrophaeenArt,
  treffer: { zeile: SaisonZahlen; wert: number } | null,
  text: (wert: number) => string,
): Trophaee | null {
  if (!treffer) return null;
  return {
    art,
    halterPersonId: treffer.zeile.personId,
    halterName: treffer.zeile.name,
    wert: treffer.wert,
    wertText: text(treffer.wert),
  };
}

/**
 * Die Trophaeen einer Saison. Rein: keine Datenbank, kein Datum, kein Zufall -
 * dieselbe Eingabe ergibt immer dieselbe Ausgabe (wie titelStaende in
 * lib/titel.ts).
 */
export function trophaeenVon(zahlen: readonly SaisonZahlen[]): Trophaee[] {
  const sieger = trophaee(
    "saisonsieger",
    bester(zahlen, (z) => z.punkte),
    (wert) => `${wert} ${wert === 1 ? "Punkt" : "Punkte"}`,
  );

  const koenig = trophaee(
    "quotenkoenig",
    bester(
      zahlen.filter((z) => z.anrufe >= QUOTENKOENIG_MINDEST_ANRUFE),
      (z) => z.termineVereinbart / z.anrufe,
    ),
    (wert) => `${Math.round(wert * 100)} %`,
  );

  const laeufer = trophaee(
    "dauerlaeufer",
    bester(zahlen, (z) => z.tage),
    (wert) => `${wert} ${wert === 1 ? "Tag" : "Tage"}`,
  );

  return [sieger, koenig, laeufer].filter((t): t is Trophaee => t !== null);
}

/**
 * Die Vitrine: die letzten `anzahl` abgeschlossenen Saisons, neueste zuerst,
 * plus die laufende als Zwischenstand.
 *
 * Ein abgeschlossener Monat ohne jede Zeile taucht nicht auf. Drei leere
 * Kaesten aus der Zeit vor dem Start sind keine Geschichte, sondern Rauschen -
 * dafuer gibt es den Leerzustand auf /spiel.
 *
 * Eine einzige groupBy-Abfrage ueber den gesamten Zeitraum, danach wird in
 * Monate sortiert. Vier Abfragen fuer vier Monate waeren dieselbe Antwort zum
 * vierfachen Preis, und der Preis waechst mit jedem Monat, den jemand mehr
 * sehen will.
 */
export async function saisonTrophaeen(
  anzahl = 3,
): Promise<{ abgeschlossen: Saison[]; laufend: Saison | null }> {
  const heute = berlinToday();
  const dieserMonat = startOfMonth(heute);
  const zurueck = Math.max(0, Math.trunc(anzahl));
  const fensterStart = addMonths(dieserMonat, -zurueck);

  try {
    const [zeilen, personen, anwesend] = await Promise.all([
      // Nach Tag gruppiert, nicht nur nach Art: der Dauerlaeufer zaehlt Tage,
      // und _min.createdAt je Gruppe ergibt zusammengefasst den ersten
      // Eintrag des Monats fuer den Gleichstand.
      prisma.dailyLog.groupBy({
        by: ["personId", "type", "date"],
        where: { date: { gte: fensterStart } },
        _sum: { count: true },
        _min: { createdAt: true },
      }),
      prisma.person.findMany({ select: { id: true, name: true } }),
      // Eigene Tabelle, eigener Ausfall: steht sie noch nicht, laeuft die
      // Vitrine ohne Anwesenheits-Punkte weiter, statt ganz zu verschwinden.
      // Dieselbe Nachsicht wie anwesenheitJePerson in lib/anwesenheit.ts.
      prisma.anwesenheit
        .findMany({
          where: { day: { gte: fensterStart } },
          select: { personId: true, day: true },
        })
        .catch((): { personId: string; day: Date }[] => []),
    ]);

    const nameById = new Map(personen.map((person) => [person.id, person.name]));

    // Monat -> personId -> Zahlen. Und daneben die Tagesmengen, weil ein Set
    // sich nicht sinnvoll in SaisonZahlen halten laesst.
    const monate = new Map<string, Map<string, SaisonZahlen>>();
    const tageJe = new Map<string, Set<string>>();

    const hole = (monat: string, personId: string): SaisonZahlen => {
      let koepfe = monate.get(monat);
      if (!koepfe) {
        koepfe = new Map();
        monate.set(monat, koepfe);
      }
      let zahlen = koepfe.get(personId);
      if (!zahlen) {
        zahlen = {
          personId,
          name: nameById.get(personId) ?? "Unbekannt",
          punkte: 0,
          anrufe: 0,
          termineVereinbart: 0,
          tage: 0,
          erstesLog: Infinity,
        };
        koepfe.set(personId, zahlen);
      }
      return zahlen;
    };

    for (const zeile of zeilen) {
      const menge = zeile._sum.count ?? 0;
      if (menge === 0) continue;
      const tag = berlinDayOf(zeile.date);
      const monat = tag.slice(0, 7);
      const zahlen = hole(monat, zeile.personId);

      zahlen.punkte += menge * quotaTypePoints[zeile.type];
      if (zeile.type === "CALL") zahlen.anrufe += menge;
      if (zeile.type === "APPOINTMENT_SET") zahlen.termineVereinbart += menge;

      const erste = zeile._min?.createdAt?.getTime() ?? Infinity;
      if (erste < zahlen.erstesLog) zahlen.erstesLog = erste;

      const schluessel = `${monat}|${zeile.personId}`;
      let tage = tageJe.get(schluessel);
      if (!tage) {
        tage = new Set();
        tageJe.set(schluessel, tage);
      }
      tage.add(tag);
    }

    // Anwesenheit zaehlt auf die Punkte, aber NICHT auf die Tage des
    // Dauerlaeufers: "mindestens ein Eintrag" heisst gearbeitet, nicht
    // aufgemacht. Sonst waere der Dauerlaeufer eine Trophaee fuer das
    // Oeffnen einer App.
    for (const eintrag of anwesend) {
      const tag = berlinDayOf(eintrag.day);
      hole(tag.slice(0, 7), eintrag.personId).punkte += ANWESENHEITS_PUNKT;
    }

    for (const [monat, koepfe] of monate) {
      for (const zahlen of koepfe.values()) {
        zahlen.tage = tageJe.get(`${monat}|${zahlen.personId}`)?.size ?? 0;
      }
    }

    const saisonVon = (start: Date): Saison => {
      const schluessel = start.toISOString().slice(0, 7);
      const koepfe = monate.get(schluessel);
      return {
        schluessel,
        label: monatMitJahr.format(start),
        monat: monatAllein.format(start),
        trophaeen: koepfe ? trophaeenVon([...koepfe.values()]) : [],
      };
    };

    const abgeschlossen: Saison[] = [];
    for (let i = 1; i <= zurueck; i += 1) {
      const saison = saisonVon(addMonths(dieserMonat, -i));
      if (saison.trophaeen.length > 0) abgeschlossen.push(saison);
    }

    return { abgeschlossen, laufend: saisonVon(dieserMonat) };
  } catch {
    // Eine Vitrine darf die Seite nicht kippen, auf der sie steht.
    return { abgeschlossen: [], laufend: null };
  }
}
