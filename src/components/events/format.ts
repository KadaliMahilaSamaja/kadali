/**
 * IST date/time formatting for events. All Kadali events happen in
 * Karnataka, so every value is rendered in Asia/Kolkata (+05:30) regardless
 * of the offset the seed frontmatter used.
 */

const KN_MONTH = new Intl.DateTimeFormat('kn', {
  timeZone: 'Asia/Kolkata',
  month: 'long',
});

const IST_DAY = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  day: 'numeric',
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
    monthKn: KN_MONTH.format(date),
    year: IST_YEAR.format(date),
  };
}

/**
 * Time range with shared meridiem folded, e.g. "4:00 – 6:30 pm IST".
 * A single time renders as "4:00 pm IST".
 */
export function istTimeRange(start: Date, end?: Date): string {
  const startLabel = IST_TIME.format(start).toLowerCase();
  if (!end) return `${startLabel} IST`;
  const endLabel = IST_TIME.format(end).toLowerCase();
  const startMeridiem = startLabel.slice(-2);
  const endMeridiem = endLabel.slice(-2);
  if (startMeridiem === endMeridiem) {
    return `${startLabel.slice(0, -(startMeridiem.length + 1))} – ${endLabel} IST`;
  }
  return `${startLabel} – ${endLabel} IST`;
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
