export function formatDateYYYYMMDD(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function utcDayOfWeek(isoDateTime: string): number {
  return new Date(isoDateTime).getUTCDay(); // 0 = Sunday .. 6 = Saturday
}

export function isSaturdayOrSunday(isoDateTime: string): boolean {
  const day = utcDayOfWeek(isoDateTime);
  return day === 6 || day === 0;
}

export function isFridayOrMonday(isoDateTime: string): boolean {
  const day = utcDayOfWeek(isoDateTime);
  return day === 5 || day === 1;
}
