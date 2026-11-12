/**
 * Article category labels — bilingual (Kannada + English).
 * Keys mirror the zod enum in src/content.config.ts exactly.
 */
import type { CollectionEntry } from 'astro:content';

export type ArticleCategory = CollectionEntry<'articles'>['data']['category'];

export const CATEGORY_LABELS: Record<ArticleCategory, { kn: string; en: string }> = {
  culture: { kn: 'ಸಂಸ್ಕೃತಿ', en: 'Culture' },
  literature: { kn: 'ಸಾಹಿತ್ಯ', en: 'Literature' },
  seva: { kn: 'ಸೇವೆ', en: 'Seva' },
  spirituality: { kn: 'ಆಧ್ಯಾತ್ಮಿಕತೆ', en: 'Spirituality' },
  community: { kn: 'ಸಮುದಾಯ', en: 'Community' },
};

/** Display order for filter navigation. */
export const CATEGORY_ORDER: ArticleCategory[] = [
  'culture',
  'literature',
  'seva',
  'spirituality',
  'community',
];
