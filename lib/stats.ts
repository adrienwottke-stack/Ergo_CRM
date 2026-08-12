import { berlinDayOf, mondayOf, shiftDay } from "./dates";

// Wochensummen (Berliner Kalenderwochen), Index 0 = älteste, letzter = aktuelle Woche.
export function weeklyTotals(
  dates: Date[],
  thisMonday: string,
  weeksShown: number
): number[] {
  const totals = new Array<number>(weeksShown).fill(0);
  const indexByMonday = new Map<string, number>();
  for (let i = 0; i < weeksShown; i++) {
    indexByMonday.set(shiftDay(thisMonday, -7 * (weeksShown - 1 - i)), i);
  }
  for (const date of dates) {
    const index = indexByMonday.get(mondayOf(berlinDayOf(date)));
    if (index !== undefined) totals[index] += 1;
  }
  return totals;
}

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
