"use server";

// Was jemand an seinen eigenen Einheiten aendert. Immer nur an den eigenen.
//
// Es gibt hier bewusst keinen Weg, die Zahl eines anderen anzufassen - auch
// nicht fuer eine Fuehrungskraft. Derselbe Grund wie bei der Telefonnummer
// (app/(app)/kontoActions.ts): traegt es ein anderer ein, steht dort
// irgendwann eine falsche Zahl, und niemand weiss mehr, woher sie kam.

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { berlinToday, dayToUtcDate, isValidDay, shiftDay } from "@/lib/dates";
import {
  eigenerGesamtstand,
  eigenerMonatsstand,
  formatEinheiten,
  istKarrierestufe,
  parseEinheiten,
} from "@/lib/einheiten";

// Wie weit zurueck eine Buchung datiert werden darf. Zwei Jahre, weil
// Einheiten monatsweise abgerechnet werden und der Auszug spaet kommt.
//
// Das ist ausdruecklich NICHT das Nachtragsfenster aus lib/fairness.ts: dort
// geht es um Wettbewerbspunkte, die sich am Freitagabend erfinden lassen. An
// einer Einheit haengt kein Punkt, nur die eigene Biografie - eine enge Frist
// wuerde hier nur verhindern, dass die Zahl stimmt.
const RUECKWIRKEND_TAGE = 730;

function feld(formData: FormData, name: string): string {
  const wert = formData.get(name);
  return typeof wert === "string" ? wert.trim() : "";
}

function neuRechnen() {
  revalidatePath("/einheiten");
}

/**
 * Der eine Schreibweg fuer eine Buchung.
 *
 * Steht als eigene Funktion da, seit die Einheiten auch aus dem Schnellfenster
 * der Kopfzeile und aus der Frage nach einem Abschluss kommen
 * (docs/findbarkeit-plan.md). Drei Eingaenge, eine Pruefung, eine Tabelle - es
 * gibt keinen zweiten Weg in die Datenbank, der eigene Fehler machen kann.
 */
async function buchen(
  userId: string,
  mengeRoh: string,
  tagRoh: string,
  notizRoh: string
): Promise<boolean> {
  const hundertstel = parseEinheiten(mengeRoh);
  // 0 ist keine Buchung, sondern ein Fehlgriff im Formular.
  if (hundertstel === null || hundertstel === 0) return false;

  const heute = berlinToday();
  const gewuenscht = tagRoh && isValidDay(tagRoh) ? tagRoh : heute;
  // Nicht in der Zukunft, nicht vor dem Fenster.
  const tag =
    gewuenscht > heute || gewuenscht < shiftDay(heute, -RUECKWIRKEND_TAGE)
      ? heute
      : gewuenscht;

  await prisma.einheitenbuchung.create({
    data: {
      userId,
      hundertstel,
      tag: dayToUtcDate(tag),
      notiz: notizRoh.slice(0, 120) || null,
    },
  });

  neuRechnen();
  return true;
}

/**
 * Eine Meldung: Menge, Tag, optional eine Notiz - das Formular auf /einheiten.
 *
 * Nimmt die drei Felder einzeln entgegen statt FormData: die Seite ruft diese
 * Aktion aus einer kleinen Client-Insel heraus direkt auf (kein
 * `useActionState`-Praezedenzfall im Projekt, Hausmuster stattdessen wie bei
 * einheitSchnellBuchen unten) und braucht den Rueckgabewert, um eine
 * Fehleingabe sichtbar zu machen - vorher verschwand ein Tippfehler
 * kommentarlos, weil das Formular das buchen()-Ergebnis verwarf
 * (docs/emil-feedback-plan.md, AP-03).
 */
export async function einheitenBuchen(
  mengeRoh: string,
  tagRoh: string,
  notizRoh: string
): Promise<{ ok: true } | { ok: false; fehler: string }> {
  const user = await requireUser();
  const gebucht = await buchen(user.id, mengeRoh, tagRoh, notizRoh);
  if (!gebucht) {
    return { ok: false, fehler: "Das war keine Zahl. Zum Beispiel: 12,5" };
  }
  return { ok: true };
}

/**
 * Dieselbe Buchung, aber von unterwegs: aus dem Schnellfenster der Kopfzeile,
 * direkt nach einem Abschluss, oder aus der Einheiten-Karte auf /heute
 * (docs/emil-feedback-plan.md, AP-02).
 *
 * Immer auf heute datiert - wer rueckwirkend buchen will, hat auf /einheiten
 * ein Datumsfeld. Und immer mit dem neuen Monats- UND Gesamtstand als
 * Rueckwert: die Zahlen leben danach im Browser, und dort sollen die wahren
 * stehen und nicht die erhofften. Dasselbe Muster wie beim Schnellzaehler
 * (quickLogAction.ts).
 *
 * Beide Staende kommen fertig formatiert zurueck ("12,5") und nicht als
 * Hundertstel: lib/einheiten.ts bleibt die einzige Stelle, die das Umrechnen
 * kennt, und ein Client-Baustein duerfte sie gar nicht laden - sie haengt an
 * Prisma.
 */
export async function einheitSchnellBuchen(
  mengeRoh: string,
  notizRoh = ""
): Promise<
  { ok: true; monat: string; gesamt: string } | { ok: false; fehler: string }
> {
  const user = await requireUser();

  const gebucht = await buchen(user.id, mengeRoh, "", notizRoh);
  if (!gebucht) {
    return { ok: false, fehler: "Das war keine Zahl. Zum Beispiel: 12,5" };
  }

  const [monat, gesamt] = await Promise.all([
    eigenerMonatsstand(user.id),
    eigenerGesamtstand(user.id, user.einheitenStart),
  ]);

  return { ok: true, monat: formatEinheiten(monat), gesamt: formatEinheiten(gesamt) };
}

/**
 * Eine eigene Buchung wieder loeschen - auch eine alte.
 *
 * Anders als bei DailyLog (dort nur der heutige Tag): an einem DailyLog haengt
 * ein Wettbewerbspunkt, und wer alte Eintraege loeschen darf, kann eine
 * Rangliste nachtraeglich umschreiben. An einer Einheit haengt nichts
 * dergleichen. Ein Zahlendreher im letzten Monat muss korrigierbar sein.
 */
export async function buchungLoeschen(formData: FormData) {
  const user = await requireUser();
  const id = feld(formData, "buchungId");
  if (!id) return;

  await prisma.einheitenbuchung.deleteMany({
    where: { id, userId: user.id },
  });

  neuRechnen();
}

/**
 * Karrierestufe und Startbestand.
 *
 * Die Karrierestufe entscheidet, in welcher Runde jemand steht und wessen Zahlen
 * er sieht. Ein leeres Feld setzt sie zurueck auf "nicht eingetragen" - dann
 * sieht er keine Runde und steht in keiner.
 */
export async function standSpeichern(formData: FormData) {
  const user = await requireUser();

  const stufeRoh = feld(formData, "karrierestufe");
  const stufe = stufeRoh ? Number(stufeRoh) : null;
  const karrierestufe = stufe !== null && istKarrierestufe(stufe) ? stufe : null;

  const startRoh = feld(formData, "einheitenStart");
  const start = parseEinheiten(startRoh);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      karrierestufe,
      // Ein leeres Feld laesst den Bestand stehen, statt ihn auf 0 zu setzen:
      // wer nur seine Stufe korrigiert, soll nicht nebenbei seine Historie
      // verlieren. Eine echte 0 kommt durch parseEinheiten als 0 an.
      ...(start === null ? {} : { einheitenStart: Math.max(0, start) }),
    },
  });

  neuRechnen();
}
