// Der Abo-Schluessel und was im Feed steht.
//
// Getrennt von der Route, damit die Einstellungsseite denselben Code benutzt
// wie die Auslieferung - sonst waere der Link, der angezeigt wird, ein anderer
// als der, der funktioniert.

import { prisma } from "@/lib/prisma";
import { addDays, hasTimeOfDay } from "@/lib/dates";
import type { FeedEintrag } from "@/lib/ics";

/** Wie weit der Feed zurueck- und vorausschaut. */
const RUECKBLICK_TAGE = 30;
const VORLAUF_TAGE = 180;

/**
 * Wie lange eine Wiedervorlage im Kalender steht. Ein Rueckruf ist kein
 * Beratungstermin - eine halbe Stunde ist grosszuegig gerechnet.
 */
const WIEDERVORLAGE_MINUTEN = 30;

/**
 * Ein neuer Abo-Schluessel. 32 Byte aus der Krypto-Quelle, base64url - kein
 * signiertes Kuerzel, weil es sich so zurueckziehen laesst: neuer Schluessel,
 * alter Link tot. Ein signiertes Kuerzel bliebe bis zu seinem Ablauf gueltig.
 */
export function neuerFeedToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Legt bei Bedarf einen Schluessel an und gibt ihn zurueck. */
export async function feedTokenSichern(userId: string): Promise<string> {
  const konto = await prisma.user.findUnique({
    where: { id: userId },
    select: { feedToken: true },
  });
  if (konto?.feedToken) return konto.feedToken;

  const token = neuerFeedToken();
  await prisma.user.update({ where: { id: userId }, data: { feedToken: token } });
  return token;
}

/** Wirft den alten Schluessel weg. Jedes bestehende Abo geht damit tot. */
export async function feedTokenErneuern(userId: string): Promise<string> {
  const token = neuerFeedToken();
  await prisma.user.update({ where: { id: userId }, data: { feedToken: token } });
  return token;
}

/**
 * Was im Feed steht.
 *
 * Kundentermine, Wiedervorlagen mit Uhrzeit und eigene Eintraege - aber NICHT
 * das, was aus einem fremden Kalender hereinkam. Ein TimeTree-Termin, der
 * ueber den Feed zurueck nach TimeTree liefe, waere ein Echo: derselbe Termin
 * doppelt, und beim naechsten Abgleich dreifach.
 *
 * "Mit Uhrzeit" ist bei den Wiedervorlagen die ganze Auswahlregel (D15). Der
 * Regelfall ist die Frist auf den Tag - als UTC-Mitternacht gespeichert -, und
 * die gehoert in die Heute-Liste, nicht in einen Kalender: dort staenden sonst
 * hunderte Eintraege um 00:00, die niemand vereinbart hat.
 */
export async function feedEintraege(
  userId: string,
  jetzt = new Date()
): Promise<FeedEintrag[]> {
  const von = addDays(jetzt, -RUECKBLICK_TAGE);
  const bis = addDays(jetzt, VORLAUF_TAGE);

  const [kontakte, eigene] = await Promise.all([
    // Termin und Wiedervorlage in EINER Abfrage. Zwei getrennte waeren eine
    // Runde mehr zur Datenbank fuer dieselbe Tabelle; dass ein Kontakt beides
    // hat, ist der Normalfall und nicht die Ausnahme.
    prisma.contact.findMany({
      where: {
        ownerId: userId,
        outcome: { not: "VERLOREN" },
        OR: [
          { appointmentAt: { gte: von, lt: bis } },
          { nextStepAt: { gte: von, lt: bis } },
        ],
      },
      orderBy: { appointmentAt: "asc" },
      select: {
        id: true,
        name: true,
        appointmentAt: true,
        nextStepAt: true,
        nextStepType: true,
      },
    }),
    prisma.termin.findMany({
      where: { ownerId: userId, von: { lt: bis }, bis: { gt: von } },
      orderBy: { von: "asc" },
    }),
  ]);

  const eintraege: FeedEintrag[] = [];

  for (const kontakt of kontakte) {
    const termin = kontakt.appointmentAt;
    if (termin && termin >= von && termin < bis) {
      eintraege.push({
        id: `kontakt-${kontakt.id}`,
        titel: `Termin ${kontakt.name}`,
        // Der Ersatz nennt die Art, nicht den Menschen. Wer diesen Termin von
        // Hand in einen GETEILTEN TimeTree-Kalender kopiert, zeigt sonst den
        // Namen seines Kunden allen Mitgliedern dieses Kalenders.
        ersatzTitel: "Termin · Beratung",
        von: termin,
        bis: new Date(termin.getTime() + 60 * 60_000),
      });
    }

    // Die Wiedervorlage, und nur die mit Uhrzeit.
    //
    // Der Terminschritt bleibt draussen: bei einem vereinbarten Termin traegt
    // nextStepAt dieselbe Uhrzeit wie appointmentAt (app/(app)/pipeline/
    // actions.ts) - er staende sonst zweimal im Kalender, einmal als Termin
    // und einmal als Rueckmeldung.
    const rueckmeldung = kontakt.nextStepAt;
    if (
      rueckmeldung &&
      kontakt.nextStepType !== "TERMIN" &&
      hasTimeOfDay(rueckmeldung) &&
      rueckmeldung >= von &&
      rueckmeldung < bis
    ) {
      eintraege.push({
        // Stabil ueber den Kontakt und nicht ueber den Zeitpunkt: wer die
        // Rueckmeldung verschiebt, soll denselben Eintrag verschoben
        // wiederfinden und keinen zweiten danebenstehen haben.
        id: `wiedervorlage-${kontakt.id}`,
        titel: `Rückmeldung ${kontakt.name}`,
        ersatzTitel: "Rückmeldung · Anruf",
        von: rueckmeldung,
        bis: new Date(rueckmeldung.getTime() + WIEDERVORLAGE_MINUTEN * 60_000),
      });
    }
  }

  for (const termin of eigene) {
    // Eigene Eintraege sind eigene Worte - sie fallen nicht unter die
    // Namensregel. Der Blocker schon: er steht auch dann im Handy-Kalender,
    // wenn der neben jemand anderem auf dem Tisch liegt.
    const geheim = termin.art === "BLOCKER";
    eintraege.push({
      id: `termin-${termin.id}`,
      titel: geheim ? "Belegt" : termin.titel,
      ersatzTitel: geheim ? "Belegt" : termin.titel,
      von: termin.von,
      bis: termin.bis,
      ganztags: termin.ganztags,
      ort: geheim ? null : termin.ort,
    });
  }

  return eintraege.sort((a, b) => a.von.getTime() - b.von.getTime());
}
