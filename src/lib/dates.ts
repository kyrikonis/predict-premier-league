export function formatDateYYYYMMDD(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/** The next upcoming Saturday/Sunday relative to `reference` (always strictly in the future). */
export function getUpcomingWeekend(reference: Date = new Date()): { saturday: Date; sunday: Date } {
  const day = reference.getUTCDay(); // 0 = Sunday .. 6 = Saturday
  const daysUntilSaturday = (6 - day + 7) % 7 || 7;
  const saturday = addDays(reference, daysUntilSaturday);
  const sunday = addDays(saturday, 1);
  return { saturday, sunday };
}

/** The Friday before and the Monday after a given Saturday/Sunday pair, for widening a short weekend. */
export function getSurroundingWeekdays(saturday: Date, sunday: Date): { friday: Date; monday: Date } {
  return { friday: addDays(saturday, -1), monday: addDays(sunday, 1) };
}

function isSameUtcDate(a: Date, b: Date): boolean {
  return formatDateYYYYMMDD(a) === formatDateYYYYMMDD(b);
}

export function isOnDate(isoDateTime: string, day: Date): boolean {
  return isSameUtcDate(new Date(isoDateTime), day);
}
