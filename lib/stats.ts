import type { QuotaType } from "@/lib/generated/prisma/enums";
import { shiftDay } from "./dates";

// Serie: aufeinanderfolgende Tage mit mindestens einem Eintrag, endend heute
// oder gestern (heute zählt als "noch offen", bricht die Serie nicht).
export function streakDays(loggedDays: Set<string>, today: string): number {
  let cursor = loggedDays.has(today) ? today : shiftDay(today, -1);
  let streak = 0;
  while (loggedDays.has(cursor)) {
    streak += 1;
    cursor = shiftDay(cursor, -1);
  }
  return streak;
}

// Was das Schnellfenster in der Kopfzeile anzeigt
// (components/AktivitaetZaehlen.tsx).
//
// Der Typ steht hier und nicht neben der Server-Aktion, die ihn liefert: eine
// "use server"-Datei darf ausschliesslich asynchrone Funktionen exportieren.
export interface SchnellStand {
  /** Tagesstand je Art - nur die Arten, zu denen heute etwas vorliegt. */
  stand: Partial<Record<QuotaType, number>>;
  /** Punkte des Tages ueber alle Arten, nicht nur ueber die drei Zaehler. */
  punkte: number;
  serie: number;
}
