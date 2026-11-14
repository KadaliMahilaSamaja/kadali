/**
 * Central bilingual UI strings for Kadali — Kannada (kn) first, English (en)
 * second. Every entry is a { kn, en } pair that components render as adjacent
 * `<span data-kn lang="kn">…</span><span data-en>…</span>` elements; the
 * pre-paint script in BaseLayout sets html[data-lang] and the rules in
 * global.css show only the active variant.
 *
 * Content written in Kannada (articles, events, people, captions, tags) stays
 * in its written language — it is NOT translated here; it only gets wrapped
 * in `lang="kn"` so fonts and screen readers treat it right in either mode.
 *
 * Keys mirror the zod enums in src/content.config.ts exactly.
 */

export type Locale = 'kn' | 'en';

export interface Bi {
  kn: string;
  en: string;
}

/** Committee roles, mirroring the `people` schema enum. */
export type Role =
  | 'president'
  | 'vice_president'
  | 'secretary'
  | 'joint_secretary'
  | 'treasurer'
  | 'director'
  | 'member';

export const ROLE_ORDER: Role[] = [
  'president',
  'vice_president',
  'secretary',
  'joint_secretary',
  'treasurer',
  'director',
  'member',
];

export const ROLE_LABELS: Record<Role, Bi> = {
  president: { kn: 'ಅಧ್ಯಕ್ಷರು', en: 'President' },
  vice_president: { kn: 'ಉಪಾಧ್ಯಕ್ಷರು', en: 'Vice-president' },
  secretary: { kn: 'ಕಾರ್ಯದರ್ಶಿ', en: 'Secretary' },
  joint_secretary: { kn: 'ಸಹಕಾರ್ಯದರ್ಶಿ', en: 'Joint secretary' },
  treasurer: { kn: 'ಖಜಾಂಚಿ', en: 'Treasurer' },
  director: { kn: 'ನಿರ್ದೇಶಕರು', en: 'Director' },
  member: { kn: 'ಸದಸ್ಯೆ', en: 'Member' },
};

export const ui = {
  /* ——— Global chrome ——— */
  skip: { kn: 'ಮುಖ್ಯ ವಿಷಯಕ್ಕೆ ಹೋಗಿ', en: 'Skip to main content' },
  menu: { kn: 'ಮೆನು', en: 'Menu' },
  join: { kn: 'ಸೇರಿ', en: 'Join' },
  /** The header pill shows the language you would switch TO. */
  langToggle: { kn: 'English', en: 'ಕನ್ನಡ' },

  nav: {
    home: { kn: 'ಮುಖಪುಟ', en: 'Home' },
    about: { kn: 'ನಮ್ಮ ಬಗ್ಗೆ', en: 'About us' },
    articles: { kn: 'ಬರಹಗಳು', en: 'Writings' },
    events: { kn: 'ಕಾರ್ಯಕ್ರಮಗಳು', en: 'Events' },
    gallery: { kn: 'ಚಿತ್ರಶಾಲೆ', en: 'Gallery' },
    contact: { kn: 'ಸಂಪರ್ಕ', en: 'Contact' },
  },

  /* ——— Footer ——— */
  footer: {
    blurb: {
      kn: 'ಅಕ್ಕಮಹಾದೇವಿಯ ಹೆಜ್ಜನೆಯಲ್ಲಿ ನಡೆಯುವ, ಶಿವಮೊಗ್ಗದ ಮಹಿಳೆಯರ ಒಡನಾಡು. ವಚನ ವೃತ್ತ, ಕಸುತಿ ಹೆಣಿಗೆ, ಸೇವೆ.',
      en: 'A women’s fellowship in Shivamogga, walking in Akkamahadevi’s footsteps. Vachana circles, kasuti embroidery, service.',
    },
    quickLinks: { kn: 'ತ್ವರಿತ ಸಂಪರ್ಕ', en: 'Quick links' },
    contact: { kn: 'ಸಂಪರ್ಕ', en: 'Contact' },
    address: {
      kn: 'ಚೌಕಿ ಮಠ, ಶಿವಮೊಗ್ಗ, ಕರ್ನಾಟಕ',
      en: 'Chowki Matha, Shivamogga, Karnataka',
    },
    instagram: { kn: 'ಇನ್‌ಸ್ಟಾಗ್ರಾಮ್', en: 'Instagram' },
    youtube: { kn: 'ಯೂಟ್ಯೂಬ್', en: 'YouTube' },
    whatsapp: { kn: 'ವಾಟ್ಸ್‌ಆಪ್', en: 'WhatsApp' },
    copyright: {
      kn: 'ಕದಳಿ ವನಿತಾ ಸಮಾಜ. ಕರ್ನಾಟಕದಲ್ಲಿ ಪ್ರೀತಿಯಿಂದ ಕಟ್ಟಿದ್ದು.',
      en: 'Kadali Vanita Samaja. Built with love in Karnataka.',
    },
  },

  /* ——— Default <title>/<description> halves (Seo.astro) ——— */
  seo: {
    siteTitle: { kn: 'ಕದಳಿ ವನಿತಾ ಸಮಾಜ, ಶಿವಮೊಗ್ಗ', en: 'Kadali Vanita Samaja, Shivamogga' },
    description: {
      kn: 'ಅಕ್ಕಮಹಾದೇವಿಯ ವಚನಗಳ ನೆನಪಲ್ಲಿ ಬೆಳೆಯುವ, ಶಿವಮೊಗ್ಗದ ಮಹಿಳೆಯರ ಒಡನಾಡು. ವಚನ ವೃತ್ತ, ಕಸುತಿ ಹೆಣಿಗೆ, ಸೇವೆ.',
      en: 'A women’s fellowship in Shivamogga, growing in the memory of Akkamahadevi’s vachanas. Vachana circles, kasuti embroidery, service.',
    },
  },

  /* ——— Homepage ——— */
  home: {
    noticeAria: { kn: 'ಪ್ರಮುಖ ಸೂಚನೆ', en: 'Important notice' },
    noticeLabel: { kn: 'ಸೂಚನೆ:', en: 'Notice:' },
    details: { kn: 'ವಿವರಗಳು', en: 'Details' },
    heroFallbackHeading: {
      kn: 'ಭಕ್ತಿ ಬೇರು. ಸಂಸ್ಕೃತಿ ಉಸಿರು. ಮಹಿಳೆಯರ ಒಗ್ಗಟ್ಟು.',
      en: 'Rooted in devotion. Alive with culture. Strong in women’s unity.',
    },
    heroFallbackDescription: {
      kn: 'ಅಕ್ಕ ಮಹಾದೇವಿಯ ಆತ್ಮಸಾಕ್ಷಿ ಮತ್ತು ವಚನಗಳ ಬೆಳಕಿನಲ್ಲಿ — ಭಕ್ತಿ, ಕಲೆ, ಸೇವೆ ಹಾಗೂ ಸಾಹಿತ್ಯವನ್ನು ಬೆಸೆಯುವ ನಮ್ಮ ಸಮುದಾಯ.',
      en: 'In the light of Akka Mahadevi’s self-inquiry and her vachanas — a community weaving devotion, art, service and literature.',
    },
    eventsEyebrow: { kn: 'ಒಟ್ಟಾಗಿ ಆಚರಿಸೋಣ', en: 'Celebrating together' },
    eventsHeading: { kn: 'ಮುಂಬರುವ ಕಾರ್ಯಕ್ರಮಗಳು', en: 'Upcoming events' },
    eventsLede: {
      kn: 'ಒಟ್ಟಾಗಿ ಸೇರುವ ಕ್ಷಣಗಳೇ ಸಮುದಾಯವನ್ನು ಕಟ್ಟುತ್ತವೆ. ಮುಂದಿನ ಕಾರ್ಯಕ್ರಮದಲ್ಲಿ ನಮ್ಮೊಂದಿಗೆ ಸೇರಿ.',
      en: 'Moments of togetherness are what build a community. Join us at the next gathering.',
    },
    allEvents: { kn: 'ಎಲ್ಲಾ ಕಾರ್ಯಕ್ರಮಗಳು', en: 'All events' },
    eventDetails: { kn: 'ಕಾರ್ಯಕ್ರಮದ ವಿವರ', en: 'Event details' },
    swipe: { kn: 'ಸರಿಸಿ ನೋಡಿ', en: 'Swipe to see' },
    galleryEyebrow: { kn: 'ನಮ್ಮ ಸಂಭ್ರಮ', en: 'Our celebrations' },
    galleryHeading: { kn: 'ಚಿತ್ರಶಾಲೆಯ ಆಯ್ದ ಕ್ಷಣಗಳು', en: 'Chosen moments from the gallery' },
    galleryLede: {
      kn: 'ಕದಳಿ ವನಿತಾ ಸಮಾಜದ ಹಬ್ಬಗಳು, ಕಸುತಿ ಹೆಣಿಗೆ, ಸಾಮೂಹಿಕ ಆಚರಣೆಗಳ ಛಾಯಾಚಿತ್ರಗಳು.',
      en: 'Photographs of Kadali Vanita Samaja’s festivals, kasuti embroidery and communal observances.',
    },
    fullGallery: { kn: 'ಸಂಪೂರ್ಣ ಚಿತ್ರಶಾಲೆ', en: 'Full gallery' },
    writingsEyebrow: { kn: 'ಕದಳಿಯ ಬರಹಗಳು', en: 'From Kadali’s pen' },
    writingsHeading: { kn: 'ನಮ್ಮ ಕಥೆಗಳು, ನಮ್ಮ ಮಾತು', en: 'Our stories, our voice' },
    writingsLede: {
      kn: 'ವಚನದ ಚಿಂತನೆಗಳಿಂದ ಸದಸ್ಸೆಯರ ನೆನಪುಗಳವರೆಗೆ — ನಮ್ಮದೇ ಧ್ವನಿಯಲ್ಲಿ ಹೇಳುವ ಕಥೆಗಳು.',
      en: 'From vachana reflections to members’ memories — stories told in our own voice.',
    },
    allArticles: { kn: 'ಎಲ್ಲಾ ಬರಹಗಳು', en: 'All writings' },
    by: { kn: 'ಲೇಖಕಿ:', en: 'By' },
    readFullArticle: { kn: 'ಪೂರ್ಣ ಲೇಖನ ಓದಿ', en: 'Read the full article' },
    swipeRead: { kn: 'ಸರಿಸಿ ಓದಿ', en: 'Swipe to read' },
    committeeEyebrow: { kn: 'ನಮ್ಮ ಜನ', en: 'Our people' },
    committeeHeading: { kn: 'ಒಟ್ಟಾಗಿ ಮುನ್ನಡೆಸುವ ಕೈಗಳು', en: 'Hands that lead together' },
    committeeLede: {
      kn: 'ಕದಳಿ ವನಿತಾ ಸಮಾಜದ ಹಿಂದೆ ಇರುವ ಸೇವಾ ಮನಸ್ಸುಗಳು, ಸಮರ್ಪಣೆ ಮತ್ತು ಒಗ್ಗಟ್ಟಿನ ಪರಿಚಯ.',
      en: 'The service-minded women behind Kadali Vanita Samaja — an introduction to their dedication and togetherness.',
    },
    fullCommittee: { kn: 'ಸಂಪೂರ್ಣ ಸಮಿತಿ', en: 'Full committee' },
    swipeMeet: { kn: 'ಸರಿಸಿ ಪರಿಚಯ ಪಡೆಯಿರಿ', en: 'Swipe to meet them' },
    joinEyebrow: { kn: 'ನಿಮ್ಮನ್ನು ಸ್ವಾಗತಿಸುತ್ತೇವೆ', en: 'We welcome you' },
    joinHeading: { kn: 'ಬನ್ನಿ, ನಮ್ಮೊಂದಿಗೆ ಬೆಸೆಯಿರಿ', en: 'Come, weave yourself with us' },
    joinLede: {
      kn: 'ನಮ್ಮ ಕಾರ್ಯಕ್ರಮಗಳ ಬಗ್ಗೆ ತಿಳಿಯಲು, ಸದಸ್ಯರಾಗಲು ಅಥವಾ ನಿಮ್ಮ ಬರಹಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಲು ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ.',
      en: 'To learn about our events, become a member, or share your writings, get in touch with us.',
    },
    contactUs: { kn: 'ಸಂಪರ್ಕಿಸಿ', en: 'Contact us' },
    sendEmail: { kn: 'ಇಮೇಲ್ ಕಳುಹಿಸಿ', en: 'Email us' },
  },

  /* ——— Hero (home) ——— */
  hero: {
    kicker: { kn: 'ಕದಳಿ ವನಿತಾ ಸಮಾಜ · ಶಿವಮೊಗ್ಗ', en: 'Kadali Vanita Samaja · Shivamogga' },
    knowKadali: { kn: 'ಕದಳಿಯನ್ನು ಅರಿಯಿರಿ', en: 'Discover Kadali' },
    readWritings: { kn: 'ನಮ್ಮ ಬರಹಗಳನ್ನು ಓದಿ', en: 'Read our writings' },
    note: {
      kn: 'ಮಹಿಳೆಯರ ಧ್ವನಿ · ನಮ್ಮ ಪರಂಪರೆ · ನಾಳೆಯ ಪೀಳಿಗೆ',
      en: 'Women’s voices · Our heritage · Tomorrow’s generation',
    },
    artCaption: { kn: 'ಅಕ್ಕಮಹಾದೇವಿ · ವಚನ ಪರಂಪರೆ', en: 'Akkamahadevi · The vachana tradition' },
    scrollCue: { kn: 'ಮುಂದೆ ಸಾಗಿ', en: 'Scroll on' },
  },

  /* ——— Aim (home pillars) ——— */
  aim: {
    eyebrow: { kn: 'ನಮ್ಮ ಸಮಾಜ', en: 'Our society' },
    heading1: { kn: 'ಒಂದು ಮನಸ್ಸು.', en: 'One mind.' },
    heading2: { kn: 'ಅನೇಕ ಹೃದಯಗಳು.', en: 'Many hearts.' },
    intro1: {
      kn: 'ಕದಳಿ ವನಿತಾ ಸಮಾಜವು ಭಕ್ತಿ, ಸಂಸ್ಕೃತಿ, ಸಾಹಿತ್ಯ ಮತ್ತು ಸಮಾಜಸೇವೆಯ ಮೂಲಕ ಮಹಿಳೆಯರನ್ನು ಒಂದೆಡೆ ಸೇರಿಸುವ',
      en: 'Kadali Vanita Samaja brings women together through devotion, culture, literature and social service —',
    },
    intro2: { kn: 'ಒಂದು ಜೀವಂತ ವೇದಿಕೆ.', en: 'a living platform.', strong: true },
    intro3: {
      kn: 'ನಮ್ಮ ಪರಂಪರೆಯನ್ನು ಗೌರವಿಸುತ್ತಾ, ಮುಂದಿನ ಪೀಳಿಗೆಗೆ ಅದನ್ನು ಪ್ರೀತಿಯಿಂದ ತಲುಪಿಸುವುದು ನಮ್ಮ ಪಯಣ.',
      en: 'Honouring our heritage and carrying it lovingly to the next generation is our journey.',
    },
    joinHands: { kn: 'ನಮ್ಮೊಂದಿಗೆ ಕೈಜೋಡಿಸಿ', en: 'Join hands with us' },
    pillars: [
      {
        icon: 'spirit',
        title: { kn: 'ಭಕ್ತಿ', en: 'Devotion' },
        body: {
          kn: 'ಆಧ್ಯಾತ್ಮ, ವಚನಗಳು ಮತ್ತು ಒಳಗಿನ ಅರಿವಿನ ಪಯಣ.',
          en: 'Spirituality, vachanas and the journey of inner knowing.',
        },
      },
      {
        icon: 'lamp',
        title: { kn: 'ಸಂಸ್ಕೃತಿ', en: 'Culture' },
        body: {
          kn: 'ಹಬ್ಬ, ಕಲೆ, ಸಂಪ್ರದಾಯ ಮತ್ತು ಜೀವಂತ ಆಚರಣೆಗಳು.',
          en: 'Festivals, art, tradition and living observances.',
        },
      },
      {
        icon: 'people',
        title: { kn: 'ಸಮಾಜ ಸೇವೆ', en: 'Service' },
        body: {
          kn: 'ಪರಸ್ಪರ ಬೆಂಬಲ, ಕಾಳಜಿ ಮತ್ತು ಸಮುದಾಯದ ಬೆಳವಣಿಗೆ.',
          en: 'Mutual support, care and the growth of community.',
        },
      },
      {
        icon: 'book',
        title: { kn: 'ಸಾಹಿತ್ಯ', en: 'Literature' },
        body: {
          kn: 'ವಚನ, ಬರಹ, ನೆನಪುಗಳು ಮತ್ತು ಮಹಿಳೆಯರ ಧ್ವನಿ.',
          en: 'Vachanas, writings, memories and women’s voices.',
        },
      },
    ] as const satisfies ReadonlyArray<{ icon: 'spirit' | 'lamp' | 'people' | 'book'; title: Bi; body: Bi }>,
  },

  /* ——— Articles ——— */
  articles: {
    pageHeading: { kn: 'ಬರಹಗಳು', en: 'Writings' },
    pageLede: {
      kn: 'ಸಮಾಜದ ವೃತ್ತದಿಂದ ಹೊರಹೊಮ್ಮುವ ಬರಹಗಳು, ನೆನಪುಗಳು ಹಾಗೂ ಕಥೆಗಳು.',
      en: 'Writings, memories and stories emerging from the society’s circle.',
    },
    featured: { kn: 'ವಿಶೇಷ ಲೇಖನ', en: 'Featured article' },
    readArticle: { kn: 'ಲೇಖನ ಓದಿ', en: 'Read the article' },
    search: { kn: 'ಬರಹಗಳನ್ನು ಹುಡುಕಿ…', en: 'Search writings…' },
    filterCategory: { kn: 'ವರ್ಗದ ಪ್ರಕಾರ ಬರಹ ಶೋಧಿಸಿ', en: 'Filter writings by category' },
    filterTag: { kn: 'ಟ್ಯಾಗ್ ಪ್ರಕಾರ ಬರಹ ಶೋಧಿಸಿ', en: 'Filter writings by tag' },
    all: { kn: 'ಎಲ್ಲಾ', en: 'All' },
    tagsAria: { kn: 'ಟ್ಯಾಗ್‌ಗಳು', en: 'Tags' },
    authorFilter: { kn: 'ಲೇಖಕಿ ಶೋಧ:', en: 'Author filter:' },
    authorBadge: { kn: 'ಲೇಖಕಿ', en: 'Author' },
    clearFilter: { kn: 'ಶೋಧನೆ ತೆಗೆಯಿರಿ (ಎಲ್ಲಾ ಬರಹಗಳು)', en: 'Clear filter (all writings)' },
    empty: {
      kn: 'ಹೊಂದಾಣಿಕೆಯ ಬರಹಗಳಿಲ್ಲ. ಬೇರೆ ಪದ ಹುಡುಕಿ ಅಥವಾ ಬೇರೆ ವರ್ಗ ಆಯ್ದುಕೊಳ್ಳಿ.',
      en: 'No matching writings. Try another word or pick a different category.',
    },
    breadcrumbHome: { kn: 'ಮುಖಪುಟ', en: 'Home' },
    breadcrumbArticles: { kn: 'ಬರಹಗಳು', en: 'Writings' },
    eventChip: { kn: 'ಕಾರ್ಯಕ್ರಮ', en: 'Event' },
    related: { kn: 'ಸಂಬಂಧಿತ ಬರಹಗಳು', en: 'Related writings' },
    share: { kn: 'ಹಂಚಿಕೆ', en: 'Share' },
    whatsapp: { kn: 'ವಾಟ್ಸ್‌ಆಪ್', en: 'WhatsApp' },
    facebook: { kn: 'ಫೇಸ್‌ಬುಕ್', en: 'Facebook' },
    x: { kn: 'ಎಕ್ಸ್ (ಟ್ವಿಟರ್)', en: 'X (Twitter)' },
    copyLink: { kn: 'ಕೊಂಡಿ ಕಾಪಿ ಮಾಡಿ', en: 'Copy link' },
    copied: { kn: 'ಕೊಂಡಿ ಕಾಪಿ ಆಯಿತು', en: 'Link copied' },
    copyFailed: {
      kn: 'ಕಾಪಿ ಆಗಲಿಲ್ಲ — ವಿಳಾಸ ಪಟ್ಟಿಯ ಕೊಂಡಿಯನ್ನು ಹಂಚಿಕೊಳ್ಳಿ',
      en: 'Couldn’t copy — share the address-bar link instead',
    },
    allByAuthorPrefix: { kn: '', en: 'All writings by ' },
    allByAuthorSuffix: { kn: 'ಅವರ ಎಲ್ಲಾ ಬರಹಗಳನ್ನು ನೋಡಿ', en: '' },
    viewerTitle: { kn: 'ಚಿತ್ರ ವೀಕ್ಷಣೆ', en: 'Image view' },
    viewerBranded: { kn: 'ಕದಳಿ ವನಿತಾ ಸಮಾಜ · ಚಿತ್ರ ವೀಕ್ಷಣೆ', en: 'Kadali Vanita Samaja · Image view' },
    clickToZoom: { kn: 'ದೊಡ್ಡದಾಗಿ ನೋಡಲು ಕ್ಲಿಕ್ ಮಾಡಿ', en: 'Click to view larger' },
  },

  /* ——— Events ——— */
  events: {
    pageHeading: { kn: 'ಕಾರ್ಯಕ್ರಮಗಳು', en: 'Events' },
    pageLede: {
      kn: 'ಸಮಾಜ ಸೇರುತ್ತಿರುವ ಎಲ್ಲಾ ಸಂದರ್ಭಗಳು — ಬನ್ನಿ, ನಮ್ಮೊಂದಿಗೆ ಆಚರಿಸಿ.',
      en: 'Every occasion where the society gathers — come celebrate with us.',
    },
    tabsAria: { kn: 'ಕಾರ್ಯಕ್ರಮ ಗುಂಪುಗಳು', en: 'Event groups' },
    tabUpcoming: { kn: 'ಮುಂಬರುವ', en: 'Upcoming' },
    tabPast: { kn: 'ನಡೆದ', en: 'Past' },
    upcomingHeading: { kn: 'ಮುಂಬರುವ ಕಾರ್ಯಕ್ರಮಗಳು', en: 'Upcoming events' },
    upcomingEmpty: {
      kn: 'ಈಗ ಕ್ಯಾಲೆಂಡರಿನಲ್ಲಿ ಏನೂ ಇಲ್ಲ — ಶೀಘ್ರದಲ್ಲೇ ಇನ್ನೊಮ್ಮೆ ನೋಡಿ.',
      en: 'Nothing on the calendar right now — check back again soon.',
    },
    pastHeading: { kn: 'ನಡೆದ ಕಾರ್ಯಕ್ರಮಗಳು', en: 'Past events' },
    pastEmpty: { kn: 'ಇದುವರೆಗೆ ದಾಖಲಾದ ಕಾರ್ಯಕ್ರಮಗಳಿಲ್ಲ.', en: 'No recorded events yet.' },
    featured: { kn: 'ವಿಶೇಷ ಕಾರ್ಯಕ್ರಮ', en: 'Featured event' },
    venue: { kn: 'ಸ್ಥಳ:', en: 'Venue:' },
    contact: { kn: 'ಸಂಪರ್ಕ:', en: 'Contact:' },
    viewDetails: { kn: 'ವಿವರಗಳನ್ನು ನೋಡಿ', en: 'View details' },
    viewOnMap: { kn: 'ನಕ್ಷೆಯಲ್ಲಿ ನೋಡಿ', en: 'View on map' },
    cancelled: { kn: 'ರದ್ದುಗೊಂಡಿದೆ', en: 'Cancelled' },
    cancelledShort: { kn: 'ರದ್ದು', en: 'cancelled' },
    stories: { kn: 'ಈ ಕಾರ್ಯಕ್ರಮದ ಕಥನಗಳು', en: 'Stories from this event' },
    otherUpcoming: { kn: 'ಇತರ ಮುಂಬರುವ ಕಾರ್ಯಕ್ರಮಗಳು', en: 'Other upcoming events' },
    posterSuffix: { kn: 'ಪೋಸ್ಟರ್', en: 'poster' },
  },

  /* ——— Gallery ——— */
  gallery: {
    eyebrow: { kn: 'ಸಮುದಾಯದ ಕ್ಷಣಗಳು · ಛಾಯಾಚಿತ್ರ ಸಂಗ್ರಹ', en: 'Community moments · A photo collection' },
    pageHeading: { kn: 'ಚಿತ್ರಶಾಲೆ', en: 'Gallery' },
    pageLede: {
      kn: 'ಸದಸ್ಸೆಯರು ಸೆರೆಹಿಡಿದ ಚೌಕಟ್ಟುಗಳು — ಅಂಗಡಿ ಮತ್ತು ಕಥೆಗಾರ್ತಿಯರು, ಬಾಳೆ ಎಲೆಯ ಉದ್ದನೆಯ ಊಟ, ನಡುವಣ ಶಾಂತ ಕ್ಷಣಗಳು. ದೊಡ್ಡದಾಗಿ ನೋಡಲು ಛಾಯಾಚಿತ್ರವೊಂದನ್ನು ಆಯ್ದುಕೊಳ್ಳಿ.',
      en: 'Frames caught by members — the shop and the storytellers, a long banana-leaf feast, quiet pauses in between. Choose a photograph to view it large.',
    },
    empty: {
      kn: 'ಇನ್ನೂ ಛಾಯಾಚಿತ್ರಗಳಿಲ್ಲ — ಮುಂದಿನ ಸಭೆಯ ಬಳಿಕ ಇನ್ನೊಮ್ಮೆ ನೋಡಿ.',
      en: 'No photographs yet — check back after the next gathering.',
    },
    eventLabel: { kn: 'ಕಾರ್ಯಕ್ರಮ:', en: 'Event:' },
    photoFallback: { kn: 'ಛಾಯಾಚಿತ್ರ', en: 'Photograph' },
    photoAltFallback: { kn: 'ಕದಳಿ ಚಿತ್ರಶಾಲೆಯ ಛಾಯಾಚಿತ್ರ', en: 'A photograph from the Kadali gallery' },
  },

  /* ——— Contact ——— */
  contact: {
    eyebrow: { kn: 'ಕದಳಿ ವನಿತಾ ಸಮಾಜ', en: 'Kadali Vanita Samaja' },
    title: { kn: 'ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ', en: 'Contact us' },
    lede: {
      kn: 'ಒಂದು ಸಂದೇಶ ಸಾಕು — ಇಮೇಲ್ ಬರೆಯಿರಿ ಅಥವಾ ಶಿವಮೊಗ್ಗದ ಚೌಕಿ ಮಠಕ್ಕೆ ಬನ್ನಿ. ದಿನದ ಕೆಲಸಗಳ ನಡುವೆ ಉತ್ತರಿಸುತ್ತೇವೆ.',
      en: 'A message is enough — write an email or come to Chowki Matha in Shivamogga. We reply between the day’s chores.',
    },
    ways: { kn: 'ಸಂಪರ್ಕದ ದಾರಿಗಳು', en: 'Ways to reach us' },
    email: { kn: 'ಇಮೇಲ್', en: 'Email' },
    emailLede: {
      kn: 'ಸದಸ್ಯತ್ವ, ಕಾರ್ಯಕ್ರಮಗಳು, ಬರಹಗಳ ಹಂಚಿಕೆ — ಬರೆದು ಇಟ್ಟರೆ ಸಾಕು.',
      en: 'Membership, events, sharing writings — a note is enough.',
    },
    writeEmail: { kn: 'ಇಮೇಲ್ ಬರೆಯಿರಿ', en: 'Write an email' },
    visit: { kn: 'ಭೇಟಿ', en: 'Visit' },
    addressLines: [
      { kn: 'ಕದಳಿ ವನಿತಾ ಸಮಾಜ', en: 'Kadali Vanita Samaja' },
      { kn: 'ಚೌಕಿ ಮಠ', en: 'Chowki Matha' },
      { kn: 'ಶಿವಮೊಗ್ಗ, ಕರ್ನಾಟಕ', en: 'Shivamogga, Karnataka' },
    ] as const satisfies readonly Bi[],
    visitLede: {
      kn: 'ಸಭೆಗಳು ಶಿವಮೊಗ್ಗದ ಚೌಕಿ ಮಠದ ಸುತ್ತ ನಡೆಯುತ್ತವೆ; ಮೊದಲು ಸಂದೇಶ ಕಳಿಸಿದರೆ ಸರಿಯಾದ ಸಮಯ ಹೇಳಿಕೊಡುತ್ತೇವೆ.',
      en: 'Meetings happen around Chowki Matha in Shivamogga; message us first and we’ll confirm a good time.',
    },
    viewMap: { kn: 'ನಕ್ಷೆಯಲ್ಲಿ ನೋಡಿ', en: 'View on map' },
    noFormTitle: { kn: 'ಅರ್ಜಿ ಇಲ್ಲ — ಬೇಕಾಗಿಲ್ಲ', en: 'No forms — none needed' },
    noFormLede: {
      kn: 'ಈ ಜಾಲತಾಣದಲ್ಲಿ ಯಾವುದೇ ಫಾರ್ಮ್ ಇಲ್ಲ, ದತ್ತಾಂಶ ಸಂಗ್ರಹವಿಲ್ಲ. ಇಮೇಲ್ ಕೊಂಡಿ ನಿಮ್ಮದೇ ಮೇಲ್ ಅಪ್ಲಿಕೇಶನ್ ತೆರೆಯುತ್ತದೆ — ನಿಮ್ಮ ಸಂದೇಶ ನೇರವಾಗಿ ಸಮಾಜಕ್ಕೆ ಬರುತ್ತದೆ, ಬೇರೆ ಯಾವುದೇ ಸರ್ವರ್‌ಗೆ ಹೋಗುವುದಿಲ್ಲ.',
      en: 'There is no form on this website and no data collection. The email link opens your own mail app — your message goes straight to the society, to no other server.',
    },
  },

  /* ——— 404 ——— */
  notFound: {
    heading: { kn: 'ಈ ಪುಟ ಎಲ್ಲೋ ತಪ್ಪಿಹೋಗಿದೆ', en: 'This page wandered off somewhere' },
    lede: {
      kn: 'ನೀವು ಹುಡುಕುತ್ತಿರುವ ಪುಟ ಇಲ್ಲ ಅಥವಾ ಸ್ಥಳಾಂತರಗೊಂಡಿದೆ. ಬದಲಿಗೆ ಈ ದಾರಿಗಳನ್ನು ಪ್ರಯತ್ನಿಸಿ.',
      en: 'The page you are looking for is missing or has moved. Try these paths instead.',
    },
  },
} as const;

/** Committing-author role strings for the articles' author bios. */
export const AUTHOR_ROLES = {
  founder: { kn: 'ಸಂಸ್ಥಾಪಕರು · ಹಿರಿಯ ಮಾರ್ಗದರ್ಶಕರು', en: 'Founder · Senior guide' },
  fallback: { kn: 'ಲೇಖಕಿ', en: 'Author' },
  memberAuthor: { kn: 'ಸದಸ್ಯೆ ಹಾಗೂ ಲೇಖಕಿ', en: 'Member and writer' },
  memberBioFallback: {
    kn: 'ಕದಳಿ ವನಿತಾ ಸಮಾಜದ ಸಕ್ರಿಯ ಸದಸ್ಯೆ ಹಾಗೂ ಲೇಖಕಿ.',
    en: 'An active member of Kadali Vanita Samaja and a writer.',
  },
  writerFallback: { kn: 'ಕದಳಿ ವನಿತಾ ಸಮಾಜದ ಬರಹಗಾರ್ತಿ.', en: 'A writer with Kadali Vanita Samaja.' },
} as const satisfies Record<string, Bi>;
