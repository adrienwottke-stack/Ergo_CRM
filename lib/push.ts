// Web-Push: die eine Stelle, an der Meldungen das Werkzeug verlassen.
//
// Drei Regeln, die den Rest erklaeren:
//
// 1. Eine Meldung nennt IMMER einen naechsten Schritt und fuehrt auf eine
//    Seite, auf der er getan werden kann. "Du hast 3 ueberfaellige Schritte"
//    ohne Ziel ist eine Beschimpfung, keine Erinnerung.
// 2. Fehler beim Senden duerfen NIE die ausloesende Handlung kippen. Wer einen
//    Termin eintraegt, hat einen Termin eingetragen - auch wenn Google gerade
//    keine Meldung annimmt.
// 3. Ein Abo, das der Browser abgeraeumt hat (404/410), fliegt sofort raus.
//    Sonst laeuft die Tabelle mit Leichen voll und jeder Versand wird langsamer.
//
// Ohne gesetzte VAPID-Schluessel passiert schlicht nichts. Das ist Absicht:
// die App muss auch ohne Push-Einrichtung vollstaendig laufen.

import webpush from "web-push";
import { prisma } from "@/lib/prisma";

const OEFFENTLICH = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const GEHEIM = process.env.VAPID_PRIVATE_KEY;
const ABSENDER = process.env.VAPID_SUBJECT ?? "mailto:kontakt@ergo-crm.local";

let bereit = false;

function pushBereit(): boolean {
  if (!OEFFENTLICH || !GEHEIM) return false;
  if (!bereit) {
    webpush.setVapidDetails(ABSENDER, OEFFENTLICH, GEHEIM);
    bereit = true;
  }
  return true;
}

export function pushEingerichtet(): boolean {
  return Boolean(OEFFENTLICH && GEHEIM);
}

export type Meldung = {
  titel: string;
  /** Ein Satz. Was ist passiert und was ist zu tun. */
  text: string;
  /** Wohin der Tipp auf die Meldung fuehrt. */
  url: string;
  /** Gleiche Kennung ersetzt eine noch offene Meldung, statt zu stapeln. */
  kennung?: string;
};

/**
 * Schickt eine Meldung an alle Geraete dieser Konten.
 *
 * Wirft nie. Der Rueckgabewert sagt, wie viele Geraete erreicht wurden - fuer
 * Protokolle und den Cron-Lauf.
 */
export async function sendeMeldung(
  userIds: string[],
  meldung: Meldung
): Promise<number> {
  if (userIds.length === 0 || !pushBereit()) return 0;

  let abos;
  try {
    abos = await prisma.pushAbo.findMany({
      where: { userId: { in: userIds } },
    });
  } catch {
    return 0;
  }
  if (abos.length === 0) return 0;

  const nutzlast = JSON.stringify(meldung);
  const tot: string[] = [];
  let zugestellt = 0;

  await Promise.all(
    abos.map(async (abo) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: abo.endpoint,
            keys: { p256dh: abo.p256dh, auth: abo.auth },
          },
          nutzlast
        );
        zugestellt += 1;
      } catch (fehler) {
        const status = (fehler as { statusCode?: number }).statusCode;
        // 404/410: der Browser kennt dieses Abo nicht mehr.
        if (status === 404 || status === 410) tot.push(abo.id);
      }
    })
  );

  try {
    if (tot.length > 0) {
      await prisma.pushAbo.deleteMany({ where: { id: { in: tot } } });
    }
    if (zugestellt > 0) {
      await prisma.pushAbo.updateMany({
        where: { userId: { in: userIds }, id: { notIn: tot } },
        data: { letzteZustellung: new Date() },
      });
    }
  } catch {
    // Aufraeumen ist Kuer. Die Meldung ist raus.
  }

  return zugestellt;
}

/**
 * Wie sendeMeldung, aber ohne await an der Aufrufstelle: die Handlung soll
 * nicht auf den Push-Dienst warten. Fehler landen nirgends - siehe Regel 2.
 */
export function meldeNebenbei(userIds: string[], meldung: Meldung): void {
  void sendeMeldung(userIds, meldung).catch(() => undefined);
}
