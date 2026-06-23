export interface ArgentinaDateParts {
  day: number;
  month: number; // 0-indexed
  year: number;
}

/**
 * Robustly extracts the current day, month, and year in America/Argentina/Buenos_Aires.
 * Uses formatToParts() to prevent ambiguity of string formats.
 */
export function getArgentinaDateParts(): ArgentinaDateParts {
  const d = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });
  const parts = formatter.formatToParts(d);
  
  let day = 1;
  let month = 0;
  let year = 2026;
  
  for (const part of parts) {
    if (part.type === 'day') {
      day = parseInt(part.value, 10);
    } else if (part.type === 'month') {
      month = parseInt(part.value, 10) - 1; // 1-12 to 0-11
    } else if (part.type === 'year') {
      year = parseInt(part.value, 10);
    }
  }
  
  return { day, month, year };
}

/**
 * Gets a Date object representing the current Argentina date relative to system local time.
 */
export function getCurrentArgentinaDate(): Date {
  const { day, month, year } = getArgentinaDateParts();
  const d = new Date();
  d.setFullYear(year, month, day);
  return d;
}

/**
 * Parses an event_date string ("YYYY-MM-DD") safely avoiding timezone shifting.
 */
export function parseEventDate(eventDateStr: string): { day: number; month: number; year: number | null } {
  const parts = eventDateStr.split('-');
  if (parts.length >= 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed
    const day = parseInt(parts[2], 10);
    return { day: isNaN(day) ? 1 : day, month: isNaN(month) ? 0 : month, year: isNaN(year) ? null : year };
  }
  
  const date = new Date(eventDateStr);
  return {
    day: date.getUTCDate(),
    month: date.getUTCMonth(),
    year: date.getUTCFullYear()
  };
}

/**
 * Checks if the event_date matches today's day and month in Argentina timezone.
 */
export function isEventToday(eventDateStr: string | null): boolean {
  if (!eventDateStr) return false;
  const { day, month } = parseEventDate(eventDateStr);
  const today = getCurrentArgentinaDate();
  return today.getDate() === day && today.getMonth() === month;
}

/**
 * Calculates years elapsed since event_date and returns a formatted label.
 * Uses unicode escapes: \u00ed for "í", \u00f1 for "ñ".
 */
export function getEphemerisLabel(eventDateStr: string | null): string {
  if (!eventDateStr) return 'Un día como hoy';
  const { year } = parseEventDate(eventDateStr);
  if (year !== null && !isNaN(year)) {
    const today = getCurrentArgentinaDate();
    const currentYear = today.getFullYear();
    const yearsElapsed = currentYear - year;
    if (yearsElapsed > 0) {
      return `Hoy se cumplen ${yearsElapsed} años`;
    }
  }
  return 'Un día como hoy';
}

/**
 * Formats event_date into a Spanish long form historical date.
 */
export function formatHistoricalDate(eventDateStr: string | null): string {
  if (!eventDateStr) return '';
  const { day, month, year } = parseEventDate(eventDateStr);
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  const monthName = months[month] || '';
  if (year !== null && !isNaN(year)) {
    return `${day} de ${monthName} de ${year}`;
  }
  return `${day} de ${monthName}`;
}
