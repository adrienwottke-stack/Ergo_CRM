// Tagesgrenzen laufen über den Berliner Kalendertag, gespeichert als UTC-Mitternacht.
// So bleiben die Zähler unabhängig von Server-Zeitzone (Vercel = UTC) und Sommerzeit fair.

const berlinDayFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Berlin",
});

export function berlinToday(): string {
  return berlinDayFormat.format(new Date());
}

export function dayToUtcDate(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}

export function isValidDay(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(dayToUtcDate(value).getTime());
}

export function startOfWeek(day: string): Date {
  const date = dayToUtcDate(day);
  const weekday = date.getUTCDay(); // 0 = Sonntag
  const daysSinceMonday = (weekday + 6) % 7;
  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  return date;
}

export function startOfMonth(day: string): Date {
  const date = dayToUtcDate(day);
  date.setUTCDate(1);
  return date;
}

export const dayDisplayFormat = new Intl.DateTimeFormat("de-DE", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
});
