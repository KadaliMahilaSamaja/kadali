/**
 * Date formatting for the home components — Kannada output, IST pinned.
 *
 * Everything renders in IST (Asia/Kolkata) so build output is identical no
 * matter which machine or timezone builds the site. Kannada month names and
 * day-period words are fixed tables rather than Intl output so we never
 * depend on ICU data.
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

/** "13 ಡಿಸೆಂಬರ್ 2026" (Kannada month, IST). */
export function formatDate(date: Date): string {
  return `${dayFmt.format(date)} ${knMonth(date)} ${yearFmt.format(date)}`;
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

/** Day-period word by clock hour: morning, noon, evening, night. */
function knPeriod(hour: number): string {
  if (hour >= 5 && hour < 12) return 'ಬೆಳಿಗ್ಗೆ';
  if (hour >= 12 && hour < 17) return 'ಮಧ್ಯಾಹ್ನ';
  if (hour >= 17 && hour < 20) return 'ಸಂಜೆ';
  return 'ರಾತ್ರಿ';
}

/**
 * "ಮಧ್ಯಾಹ್ನ 4:00 – ಸಂಜೆ 6:30" — the period word is dropped from the second
 * time when both ends share it. Hour numerals are 12-hour, IST.
 */
export function timeRangeIST(start: Date, end?: Date): string {
  const from = knClock(start);
  if (!end) return from;

  const to = knClock(end);
  if (knPeriod(istHour(start)) === knPeriod(istHour(end))) {
    // Same period: strip the leading word from the second time.
    return `${from} – ${to.replace(/^\S+\s+/, '')}`;
  }
  return `${from} – ${to}`;
}

/** "ಸಂಜೆ 4:00" — period word + 12-hour clock, from Intl's IST parts. */
function knClock(date: Date): string {
  const parts = clockFmt.formatToParts(date);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
  return `${knPeriod(istHour(date))} ${hour % 12 || 12}:${minute}`;
}

/** The IST clock hour (0–23), derived from Intl parts, not build-machine time. */
function istHour(date: Date): number {
  const parts = clockFmt.formatToParts(date);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const dayPeriod = parts.find((p) => p.type === 'dayPeriod')?.value ?? '';
  return dayPeriod.toUpperCase() === 'PM' ? (hour % 12) + 12 : hour % 12;
}
