/**
 * Shared event helpers — imported by the home page and the events pages.
 *
 * Kept dependency-free and structural on purpose: any object whose `data`
 * matches the events schema (CollectionEntry<'events'> satisfies this) works,
 * which makes the helpers trivially unit-testable and safe against
 * half-populated entries.
 */

/** The status an event displays as. */
export type EventStatus = 'upcoming' | 'completed' | 'cancelled';

/** The `status` field as declared in the events schema. */
export type DeclaredEventStatus = 'auto' | EventStatus;

export interface EventDataLike {
  startAt?: Date;
  endAt?: Date;
  status?: DeclaredEventStatus;
}

/** Minimal structural shape of a content entry with events-schema data. */
export interface EventEntryLike {
  data: EventDataLike;
}

export type SortDirection = 'asc' | 'desc';

function isFiniteDate(value: unknown): value is Date {
  return value instanceof Date && Number.isFinite(value.getTime());
}

/**
 * Resolve an event's display status.
 *
 * - 'upcoming' | 'completed' | 'cancelled' are explicit overrides and win
 *   over whatever the dates say (e.g. a past event pinned as upcoming).
 * - 'auto' derives from the event's end (or start, when no endAt) compared
 *   with `now`: still current or in the future ⇒ 'upcoming', else 'completed'.
 * - Missing or invalid dates are treated as already over, so a broken entry
 *   can never surface as upcoming.
 */
export function deriveStatus(
  event: EventEntryLike | null | undefined,
  now: Date = new Date(),
): EventStatus {
  const declared = event?.data?.status;
  if (
    declared === 'upcoming' ||
    declared === 'completed' ||
    declared === 'cancelled'
  ) {
    return declared;
  }

  const { startAt, endAt } = event?.data ?? {};
  const reference = isFiniteDate(endAt)
    ? endAt
    : isFiniteDate(startAt)
      ? startAt
      : undefined;
  if (!reference) return 'completed';

  return reference.getTime() >= now.getTime() ? 'upcoming' : 'completed';
}

/**
 * Sort events by startAt: 'asc' = soonest first, 'desc' = latest first.
 *
 * Returns a new array (never mutates the input). Entries without a valid
 * startAt keep their relative order and sort to the end in both directions,
 * so a malformed entry can never land at the top of an "upcoming" list.
 */
export function sortEvents<T extends EventEntryLike>(
  events: readonly (T | null | undefined)[],
  dir: SortDirection = 'asc',
): T[] {
  const dated: Array<{ entry: T; start: number }> = [];
  const undated: T[] = [];

  for (const entry of events) {
    if (!entry) continue;
    if (entry.data && isFiniteDate(entry.data.startAt)) {
      dated.push({ entry, start: entry.data.startAt.getTime() });
    } else {
      undated.push(entry);
    }
  }

  dated.sort((a, b) => (dir === 'asc' ? a.start - b.start : b.start - a.start));

  return [...dated.map(({ entry }) => entry), ...undated];
}
