// Die einzige Stelle, an der entschieden wird, wessen Daten jemand sehen darf.
//
// Vor dieser Datei stand die Zugriffsgrenze als `ownerId: user.id` in jeder
// einzelnen Abfrage. Sobald es mehr als eine Grenze gibt (Struktur, Freigaben,
// Berichts-Links), leckt genau dort etwas. Deshalb baut ab jetzt kein Aufruf
// seinen ownerId-Filter mehr selbst, sondern holt ihn hier.
//
// Siehe docs/struktur-plan.md, Abschnitt 3.1.

import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/lib/generated/prisma/enums";

/**
 * EIGENE   – nur die eigenen Daten.
 * DIREKTE  – man selbst plus die direkt unterstellten Berater.
 * STRUKTUR – man selbst plus alles darunter, ueber alle Ebenen.
 */
export type Umfang = "EIGENE" | "DIREKTE" | "STRUKTUR";

export type Betrachter = { id: string; role: UserRole };

export type Sichtbarkeit = {
  /** Die Konten, deren Daten sichtbar sind. Enthaelt immer den Betrachter. */
  beraterIds: string[];
  /** Filter fuer Contact. Auch verschachtelbar: `contact: { is: sicht.kontakte }`. */
  kontakte: { ownerId: { in: string[] } };
  /** Filter fuer alles, was ueber einen Kontakt haengt: Deal, Activity, StageEvent. */
  ueberKontakt: { contact: { is: { ownerId: { in: string[] } } } };
};

/**
 * Loest den Umfang in eine Liste von Konten auf.
 *
 * Der Struktur-Baum (`leaderId` / `path`) kommt erst in Bauabschnitt 1. Bis
 * dahin gilt die Uebergangsregel: ein ADMIN sieht bei STRUKTUR weiterhin alle
 * Konten – das ist genau das bisherige Verhalten der Trichter-Team-Ansicht –,
 * alle anderen sehen nur sich selbst. Sobald der Baum steht, wird nur diese
 * Funktion angefasst, kein einziger Aufrufer.
 */
export async function beraterIds(
  betrachter: Betrachter,
  umfang: Umfang
): Promise<string[]> {
  if (umfang === "EIGENE") return [betrachter.id];
  if (betrachter.role !== "ADMIN") return [betrachter.id];

  const konten = await prisma.user.findMany({ select: { id: true } });
  return konten.map((konto) => konto.id);
}

/**
 * Liefert fertige Prisma-Filter statt roher IDs, damit an den Aufrufstellen
 * kein `ownerId` mehr von Hand geschrieben wird.
 *
 * Nebeneffekt, der so gewollt ist: Kontakte ohne Eigentuemer (`ownerId = null`,
 * Altdaten oder geloeschte Konten) fallen durch das `in` heraus und tauchen in
 * keiner Auswertung mehr auf.
 */
export async function sichtbarkeit(
  betrachter: Betrachter,
  umfang: Umfang
): Promise<Sichtbarkeit> {
  const ids = await beraterIds(betrachter, umfang);
  return {
    beraterIds: ids,
    kontakte: { ownerId: { in: ids } },
    ueberKontakt: { contact: { is: { ownerId: { in: ids } } } },
  };
}

/**
 * Kurzform fuer den haeufigsten Fall: "nur meine eigenen Daten". Spart den
 * `await` auf eine Datenbankabfrage, die es fuer EIGENE gar nicht braucht.
 */
export function eigene(betrachterId: string): Sichtbarkeit {
  const ids = [betrachterId];
  return {
    beraterIds: ids,
    kontakte: { ownerId: { in: ids } },
    ueberKontakt: { contact: { is: { ownerId: { in: ids } } } },
  };
}
