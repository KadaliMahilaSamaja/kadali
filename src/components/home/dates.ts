/**
 * Date formatting for the home components.
 *
 * Everything renders in IST (Asia/Kolkata) so build output is identical no
 * matter which machine or timezone builds the site. Kannada month names are
 * a fixed table rather than Intl output so we never depend on ICU data.
 */

const KN_MONTHS = [
  'ಜನವರಿ',
  'ಫೆಬ್ರವರಿ',
  'ಮಾರ್ಚ್',
  'ಏಪ್ರಿಲ್',
  'ಮೇ',
  'ಜೂನ್',
  'ಜುಲೈ',
  'ಆಗಸ್ಟ್',
  'ಸೆಪ್ಟೆಂಬರ್',
  'ಅಕ್ಟೋಬರ್',
  'ನವೆಂಬರ್',
  'ಡಿಸೆಂಬರ್',
] as const;

const TZ = 'Asia/Kolkata';

const fullDateFmt = new Intl.DateTimeFormat('en-IN', {
  timeZone: TZ,
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const dayFmt = new Intl.DateTimeFormat('en-IN', { timeZone: TZ, day: 'numeric' });
const monthIdxFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ,
  month: 'numeric',
});
const yearFmt = new Intl.DateTimeFormat('en-IN', { timeZone: TZ, year: 'numeric' });
const clockFmt = new Intl.DateTimeFormat('en-IN', {
  timeZone: TZ,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

/** "13 December 2026" (en-IN, IST). */
export function formatDate(date: Date): string {
  return fullDateFmt.format(date);
}

/** "13" — the big day number for date blocks. */
export function dayOfMonth(date: Date): string {
  return dayFmt.format(date);
}

/** Kannada month name, e.g. "ಡಿಸೆಂಬರ್". */
export function knMonth(date: Date): string {
  const index = Number(monthIdxFmt.format(date));
  return KN_MONTHS[index - 1] ?? '';
}

/** "2026". */
export function yearOf(date: Date): string {
  return yearFmt.format(date);
}

/** "4:00 – 6:30 pm IST" — meridiem deduped when both ends share it. */
export function timeRangeIST(start: Date, end?: Date): string {
  const from = clockFmt.format(start);
  if (!end) return `${from} IST`;

  const to = clockFmt.format(end);
  const meridiem = (t: string) => t.replace(/\s+/g, ' ').slice(-2).toLowerCase();
  if (meridiem(from) === meridiem(to)) {
    const bare = from.replace(/\s*(am|pm)\s*$/i, '');
    return `${bare} – ${to} IST`;
  }
  return `${from} – ${to} IST`;
}
