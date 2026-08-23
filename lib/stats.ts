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
