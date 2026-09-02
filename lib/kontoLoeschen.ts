// Ein Konto endgueltig entfernen - die einzige Stelle, an der das passiert.
//
// Vorher stand der Vorgang als Server-Action in app/(app)/team/actions.ts und
// war damit an die Systemverwaltung gebunden. Seit auch eine Fuehrungskraft
// Leute aus ihrer eigenen Struktur entfernen darf (app/(app)/mannschaft/
// actions.ts), gibt es zwei Wege hierher - und genau einen Vorgang.
//
// Der heikle Teil ist der Baum: "User.path" ist ein materialisierter Pfad. Wer
// eine Fuehrungskraft einfach loescht, laesst ihre Leute mit einem Pfad
// zurueck, der auf ein Konto zeigt, das es nicht mehr gibt - und ab da findet
// keine Sichtbarkeitsabfrage sie mehr. Deshalb ruecken die Direkten ZUERST
// eine Ebene hoch, mitsamt ihren eigenen Aesten.

import { prisma } from "@/lib/prisma";
import { umhaengen } from "@/lib/struktur";

export type LoeschFehler = "unbekannt" | null;

export async function kontoLoeschen(userId: string): Promise<LoeschFehler> {
  const konto = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, leaderId: true },
  });
  if (!konto) return "unbekannt";

  // Erst umhaengen, dann loeschen. Bricht etwas dazwischen ab, steht der Baum
  // trotzdem richtig - nur das Konto ist noch da.
  const direkte = await prisma.user.findMany({
    where: { leaderId: userId },
    select: { id: true },
  });
  for (const kind of direkte) {
    await umhaengen(kind.id, konto.leaderId);
  }

  await prisma.$transaction([
    // Die Zustimmungen zur Auftragsverarbeitung sind unveraenderlich - ein
    // Trigger blockt UPDATE und DELETE auch gegen den Eigentuemer der Tabelle.
    // Dieser eine Weg meldet sich ausdruecklich dabei an, sonst liesse sich
    // kein Konto mehr loeschen, sobald es einmal zugestimmt hat.
    //
    // set_config(..., true) gilt nur fuer DIESE Transaktion. Darum steht es
    // als erstes Element IM Feld und nicht davor: ausserhalb der Transaktion
    // waere die Einstellung ueber den Pooler wertlos.
    prisma.$queryRaw`SELECT set_config('app.avv_loeschen_erlaubt', 'ja', true)`,
    // Die privaten Kontakte gehen mit. Sie haetten sonst keinen Eigentuemer
    // mehr und waeren in keiner Ansicht je wieder sichtbar - Daten, die nur
    // noch Platz belegen.
    prisma.contact.deleteMany({ where: { ownerId: userId } }),
    // Das Ranglistenprofil mitsamt seinen Zaehlern. Ohne das bliebe ein Name
    // in der Rangliste stehen, hinter dem kein Konto mehr steckt.
    prisma.person.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);

  return null;
}

/**
 * Austragen: der Normalfall, wenn jemand aufhoert. Das Konto bleibt im Baum,
 * damit die Historie stimmt - wer sechs Monate lang Termine gemacht hat, soll
 * nicht rueckwirkend nie existiert haben. Es zaehlt nur in keiner laufenden
 * Auswertung mehr mit und kann sich nicht mehr anmelden.
 */
export async function kontoAustragen(
  userId: string,
  wieder: boolean
): Promise<LoeschFehler> {
  const { count } = await prisma.user.updateMany({
    where: { id: userId },
    data: { deactivatedAt: wieder ? null : new Date() },
  });
  if (count === 0) return "unbekannt";

  // Sitzungen sind signierte Cookies ohne Gegenstueck in der Datenbank - sie
  // laufen von selbst ab. Was sofort greift: Push-Meldungen hoeren auf.
  if (!wieder) {
    await prisma.pushAbo.deleteMany({ where: { userId } });
  }
  return null;
}
