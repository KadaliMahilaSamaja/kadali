/**
 * Bilingual (kn/en) date and time formatting — the single source that
 * replaced the four duplicated Kannada month tables (events format.ts,
 * home dates.ts, ArticleDate, GalleryGroup).
 *
 * Two pinned timezones:
 * - IST (Asia/Kolkata, +05:30) for event instants, which carry clock times;
 *   every Kadali event happens in Karnataka regardless of the offset the
 *   seed frontmatter used.
 * - UTC for date-only frontmatter fields (pubDate, gallery date), so the
 *   rendered day is stable no matter which machine or timezone builds.
 *
 * Month names and day-period words are fixed tables rather than Intl output
 * so we never depend on the build machine's ICU data for `kn`.
 */

import type { Bi } from './ui';

export const MONTHS: readonly Bi[] = [
  { kn: 'ಜನವರಿ', en: 'January' },
  { kn: 'ಫೆಬ್ರವರಿ', en: 'February' },
  { kn: 'ಮಾರ್ಚ್', en: 'March' },
  { kn: 'ಏಪ್ರಿಲ್', en: 'April' },
  { kn: 'ಮೇ', en: 'May' },
  { kn: 'ಜೂನ್', en: 'June' },
  { kn: 'ಜುಲೈ', en: 'July' },
  { kn: 'ಆಗಸ್ಟ್', en: 'August' },
  { kn: 'ಸೆಪ್ಟೆಂಬರ್', en: 'September' },
  { kn: 'ಅಕ್ಟೋಬರ್', en: 'October' },
  { kn: 'ನವೆಂಬರ್', en: 'November' },
  { kn: 'ಡಿಸೆಂಬರ್', en: 'December' },
];

const IST = 'Asia/Kolkata';

const IST_DAY = new Intl.DateTimeFormat('en-IN', { timeZone: IST, day: 'numeric' });
const IST_MONTH = new Intl.DateTimeFormat('en-US', { timeZone: IST, month: 'numeric' });
const IST_YEAR = new Intl.DateTimeFormat('en-IN', { timeZone: IST, year: 'numeric' });
const IST_TIME = new Intl.DateTimeFormat('en-IN', {
  timeZone: IST,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

const UTC_DAY = new Intl.DateTimeFormat('en-IN', { timeZone: 'UTC', day: 'numeric' });
const UTC_MONTH = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'numeric' });
const UTC_YEAR = new Intl.DateTimeFormat('en-IN', { timeZone: 'UTC', year: 'numeric' });

/** Parts of an instant, rendered for both languages. */
export interface InstantBi {
  day: string;
  month: Bi;
  year: string;
}

/** IST instant for events (which carry clock times). */
export function istInstant(date: Date): InstantBi {
  return {
    day: IST_DAY.format(date),
    month: MONTHS[Number(IST_MONTH.format(date)) - 1] ?? { kn: '', en: '' },
    year: IST_YEAR.format(date),
  };
}

/** Date-only instant in UTC — for pubDate-style frontmatter fields. */
export function utcInstant(date: Date): InstantBi {
  return {
    day: UTC_DAY.format(date),
    month: MONTHS[Number(UTC_MONTH.format(date)) - 1] ?? { kn: '', en: '' },
    year: UTC_YEAR.format(date),
  };
}

/** "13 ನವೆಂಬರ್ 2026" / "13 November 2026" (date-only fields, UTC). */
export function formatDate(date: Date): Bi {
  const { day, month, year } = utcInstant(date);
  return { kn: `${day} ${month.kn} ${year}`, en: `${day} ${month.en} ${year}` };
}

/** "13" — the big day number for date blocks (UTC, date-only fields). */
export function dayOfMonth(date: Date): string {
  return UTC_DAY.format(date);
}

/** "2026" — year for date blocks (UTC, date-only fields). */
export function yearOf(date: Date): string {
  return UTC_YEAR.format(date);
}

/** Day-period words by IST clock hour: morning, noon, evening, night. */
const PERIODS = {
  morning: { kn: 'ಬೆಳಿಗ್ಗೆ', en: 'morning' },
  noon: { kn: 'ಮಧ್ಯಾಹ್ನ', en: 'afternoon' },
  evening: { kn: 'ಸಂಜೆ', en: 'evening' },
  night: { kn: 'ರಾತ್ರಿ', en: 'night' },
} as const satisfies Record<string, Bi>;

type Period = keyof typeof PERIODS;

function periodOf(hour: number): Period {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'noon';
  if (hour >= 17 && hour < 20) return 'evening';
  return 'night';
}

/** The IST clock hour (0–23), derived from Intl parts, not build-machine time. */
function istHour(date: Date): number {
  const parts = IST_TIME.formatToParts(date);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const dayPeriod = parts.find((p) => p.type === 'dayPeriod')?.value ?? '';
  return dayPeriod.toUpperCase() === 'PM' ? (hour % 12) + 12 : hour % 12;
}

/** "ಸಂಜೆ 4:00" — period word + 12-hour clock, from Intl's IST parts. */
function knClock(date: Date): string {
  const parts = IST_TIME.formatToParts(date);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
  return `${PERIODS[periodOf(istHour(date))].kn} ${hour % 12 || 12}:${minute}`;
}

/** "4:00 pm" — lowercase am/pm clock, from the same IST parts. */
function enClock(date: Date): string {
  const parts = IST_TIME.formatToParts(date);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
  const period = parts.find((p) => p.type === 'dayPeriod')?.value ?? '';
  const suffix = period.toUpperCase() === 'PM' ? 'pm' : 'am';
  return `${hour % 12 || 12}:${minute} ${suffix}`;
}

/**
 * Time range in both languages, with the shared marker folded:
 * kn "ಮಧ್ಯಾಹ್ನ 4:00 – ಸಂಜೆ 6:30" (period word dropped from the second time
 * when both ends share it); en "4:00 pm – 6:30 pm" (am/pm folded the same
 * way). A single time renders as "ಸಂಜೆ 4:00" / "4:00 pm".
 */
export function istTimeRange(start: Date, end?: Date): Bi {
  const fromKn = knClock(start);
  const fromEn = enClock(start);
  if (!end) return { kn: fromKn, en: fromEn };

  const toKn = knClock(end);
  const toEn = enClock(end);
  const same = periodOf(istHour(start)) === periodOf(istHour(end));
  return {
    kn: same ? `${fromKn} – ${toKn.replace(/^\S+\s+/, '')}` : `${fromKn} – ${toKn}`,
    en: same ? `${fromEn.replace(/ (am|pm)$/i, '')} – ${toEn}` : `${fromEn} – ${toEn}`,
  };
}

/** ISO 8601 instant pinned to the +05:30 offset for JSON-LD startDate/endDate. */
export function istIso(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  const hour = get('hour') === '24' ? '00' : get('hour');
  return `${get('year')}-${get('month')}-${get('day')}T${hour}:${get('minute')}:${get('second')}+05:30`;
}
