import type { CollectionEntry } from 'astro:content';

/**
 * Display order for article lists (homepage rail, event story lists).
 * Articles with an `order` pin lead, smaller numbers first — the same
 * pattern the committee and web-committee collections use; the CMS can
 * reorder them without a code change. Unpinned articles follow
 * newest-first, so a fresh post never jumps the committee's picks.
 */
export function sortArticlesForDisplay(
  articles: CollectionEntry<'articles'>[],
): CollectionEntry<'articles'>[] {
  const rank = (a: CollectionEntry<'articles'>) =>
    a.data.order ?? Number.POSITIVE_INFINITY;
  return [...articles].sort((a, b) => {
    const byRank = rank(a) - rank(b);
    return byRank !== 0 ? byRank : +b.data.pubDate - +a.data.pubDate;
  });
}
