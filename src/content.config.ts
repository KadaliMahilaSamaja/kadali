import { defineCollection, reference, z } from 'astro:content';
import { file, glob } from 'astro/loaders';

/**
 * Kadali content schema — shared contract. Later pages/CMS work depends on
 * these shapes exactly; change only with an explicit decision from Main.
 * All collections are zod-validated at build time.
 */

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(200), // short excerpt used in lists & meta
    cover: z.string(), // path under public/, e.g. /images/uploads/cover.svg
    coverAlt: z.string(),
    author: z.string(),
    authorPhoto: z.string().optional(),
    authorRole: z.string().optional(),
    authorBio: z.string().optional(),
    category: z.enum([
      'culture',
      'literature',
      'seva',
      'spirituality',
      'community',
    ]),
    pubDate: z.coerce.date(),
    // Optional link to the event this story belongs to (stored as the
    // event's id, e.g. 'monsoon-mela'). The event page lists matching
    // stories under "Stories from this event".
    event: reference('events').optional(),
    // Optional free-form short labels (e.g. 'kasuti'). Rendered as chips
    // and filterable on the articles index via ?tag=.
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

const events = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
  schema: z.object({
    title: z.string(),
    poster: z.string(), // path under public/
    summary: z.string(),
    venue: z.string(),
    mapUrl: z.string().url().optional(),
    contact: z.string().optional(),
    startAt: z.coerce.date(),
    endAt: z.coerce.date().optional(),
    // 'auto' derives at build time: (endAt ?? startAt) < now ⇒ 'completed'.
    status: z.enum(['auto', 'upcoming', 'completed', 'cancelled']).default('auto'),
    featured: z.boolean().default(false),
  }),
});

const announcements = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/announcements' }),
  schema: z.object({
    title: z.string(),
    image: z.string().optional(), // path under public/
    pubDate: z.coerce.date(),
    expiryDate: z.coerce.date().optional(),
    featured: z.boolean().default(false),
  }),
});

const galleries = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/galleries' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    event: z.string().optional(), // free-text link to an event title
    photos: z.array(
      z.object({
        image: z.string(), // path under public/
        caption: z.string().optional(),
      }),
    ),
  }),
});

// Managing-committee members, shown role-grouped on the About page.
// Frontmatter only — the markdown body is unused.
const people = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/people' }),
  schema: z.object({
    name: z.string(),
    nameKn: z.string().optional(), // Kannada rendering, shown under the name
    role: z.enum([
      'president',
      'vice_president',
      'secretary',
      'joint_secretary',
      'treasurer',
      'director',
      'member',
    ]),
    photo: z.string(), // path under public/, e.g. /images/uploads/photo.svg
    order: z.number().default(99), // display order within the role group
    bio: z.string().optional(), // 1-2 lines: tenure in Kadali + what she handles
  }),
});

const settings = defineCollection({
  loader: file('src/content/settings/site.json'),
  schema: z.object({
    heroHeading: z.string(),
    heroDescription: z.string(),
    featuredArticle: reference('articles').optional(),
    featuredEvent: reference('events').optional(),
    banner: z.string().optional(), // path under public/
    bannerExpiry: z.coerce.date().optional(),
    featuredGallery: reference('galleries').optional(),
  }),
});

export const collections = {
  articles,
  events,
  announcements,
  galleries,
  people,
  'site-settings': settings,
};
