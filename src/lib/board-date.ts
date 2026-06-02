const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

type DateInput = string | Date | null | undefined;

function isDateOnly(value: string): boolean {
  return DATE_ONLY_RE.test(value);
}

/**
 * Parses board date inputs preserving day-only values across time zones.
 * For YYYY-MM-DD values, stores at 12:00 UTC so calendar day stays stable.
 */
export function parseBoardDateInput(value: DateInput): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;

  if (isDateOnly(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

/**
 * Converts a stored Date/ISO string into an <input type="date" /> value.
 */
export function toDateInputValue(value: DateInput): string {
  const parsed = parseBoardDateInput(value);
  if (!parsed) return '';

  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
  const day = String(parsed.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats board dates as calendar dates, ignoring viewer local timezone drift.
 */
export function formatBoardCalendarDate(
  value: DateInput,
  locale: string,
  options: Intl.DateTimeFormatOptions
): string | null {
  const parsed = parseBoardDateInput(value);
  if (!parsed) return null;
  return parsed.toLocaleDateString(locale, { ...options, timeZone: 'UTC' });
}
