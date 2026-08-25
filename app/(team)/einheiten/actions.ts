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
import { istKernstufe, parseEinheiten } from "@/lib/einheiten";

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

/** Eine Meldung: Menge, Tag, optional eine Notiz. */
export async function einheitenBuchen(formData: FormData) {
  const user = await requireUser();
  const hundertstel = parseEinheiten(feld(formData, "menge"));
  // 0 ist keine Buchung, sondern ein Fehlgriff im Formular.
  if (hundertstel === null || hundertstel === 0) return;

  const heute = berlinToday();
  const roh = feld(formData, "tag");
  const gewuenscht = roh && isValidDay(roh) ? roh : heute;
  // Nicht in der Zukunft, nicht vor dem Fenster.
  const tag =
    gewuenscht > heute || gewuenscht < shiftDay(heute, -RUECKWIRKEND_TAGE)
      ? heute
      : gewuenscht;

  await prisma.einheitenbuchung.create({
    data: {
      userId: user.id,
      hundertstel,
      tag: dayToUtcDate(tag),
      notiz: feld(formData, "notiz").slice(0, 120) || null,
    },
  });

  neuRechnen();
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
 * Kernstufe und Startbestand.
 *
 * Die Kernstufe entscheidet, in welcher Runde jemand steht und wessen Zahlen
 * er sieht. Ein leeres Feld setzt sie zurueck auf "nicht eingetragen" - dann
 * sieht er keine Runde und steht in keiner.
 */
export async function standSpeichern(formData: FormData) {
  const user = await requireUser();

  const stufeRoh = feld(formData, "kernstufe");
  const stufe = stufeRoh ? Number(stufeRoh) : null;
  const kernstufe = stufe !== null && istKernstufe(stufe) ? stufe : null;

  const startRoh = feld(formData, "einheitenStart");
  const start = parseEinheiten(startRoh);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      kernstufe,
      // Ein leeres Feld laesst den Bestand stehen, statt ihn auf 0 zu setzen:
      // wer nur seine Stufe korrigiert, soll nicht nebenbei seine Historie
      // verlieren. Eine echte 0 kommt durch parseEinheiten als 0 an.
      ...(start === null ? {} : { einheitenStart: Math.max(0, start) }),
    },
  });

  neuRechnen();
}
