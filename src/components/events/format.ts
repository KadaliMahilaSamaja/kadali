/**
 * IST date/time formatting for events. All Kadali events happen in
 * Karnataka, so every value is rendered in Asia/Kolkata (+05:30) regardless
 * of the offset the seed frontmatter used.
 *
 * Month names and day-period words are fixed tables rather than Intl output
 * so we never depend on the build machine's ICU data for `kn`.
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

const IST_DAY = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  day: 'numeric',
});

const IST_MONTH = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Kolkata',
  month: 'numeric',
});

const IST_YEAR = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
});

const IST_TIME = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

/** Day number, Kannada month name, and year for the date block. */
export interface IstInstant {
  day: string;
  monthKn: string;
  year: string;
}

export function istInstant(date: Date): IstInstant {
  return {
    day: IST_DAY.format(date),
    monthKn: KN_MONTHS[Number(IST_MONTH.format(date)) - 1] ?? '',
    year: IST_YEAR.format(date),
  };
}

/** Day-period word by clock hour: morning, noon, evening, night. */
function knPeriod(hour: number): string {
  if (hour >= 5 && hour < 12) return 'ಬೆಳಿಗ್ಗೆ';
  if (hour >= 12 && hour < 17) return 'ಮಧ್ಯಾಹ್ನ';
  if (hour >= 17 && hour < 20) return 'ಸಂಜೆ';
  return 'ರಾತ್ರಿ';
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
  return `${knPeriod(istHour(date))} ${hour % 12 || 12}:${minute}`;
}

/**
 * Time range with the shared period word folded,
 * e.g. "ಮಧ್ಯಾಹ್ನ 4:00 – ಸಂಜೆ 6:30". A single time renders as "ಸಂಜೆ 4:00".
 */
export function istTimeRange(start: Date, end?: Date): string {
  const from = knClock(start);
  if (!end) return from;

  const to = knClock(end);
  if (knPeriod(istHour(start)) === knPeriod(istHour(end))) {
    // Same period: strip the leading word from the second time.
    return `${from} – ${to.replace(/^\S+\s+/, '')}`;
  }
  return `${from} – ${to}`;
}

/** ISO 8601 instant pinned to the +05:30 offset for JSON-LD startDate/endDate. */
export function istIso(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
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
