// Berlin timezone utilities (CEST = UTC+2 during summer, CET = UTC+1 during winter)
// Berlin is on Central European Summer Time (CEST, UTC+2) from late March to late October.

const BERLIN_OFFSET_HOURS = 2; // CEST: UTC+2

/**
 * Returns current time in Berlin as a Date object.
 */
export function berlinNow(): Date {
  return new Date(Date.now() + BERLIN_OFFSET_HOURS * 60 * 60 * 1000);
}

/**
 * Returns today's date string in Berlin timezone (YYYY-MM-DD).
 */
export function berlinDateStr(): string {
  return berlinNow().toISOString().split("T")[0];
}

/**
 * Converts a Berlin date string (YYYY-MM-DD) to a Date object at noon Berlin time
 * (to avoid midnight-boundary issues when converting to UTC).
 */
export function berlinDateFromStr(dateStr: string): Date {
  return new Date(dateStr + "T12:00:00+02:00");
}
