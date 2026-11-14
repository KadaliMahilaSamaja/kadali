/**
 * Client-side language plumbing for the kn/en toggle.
 *
 * The pre-paint <script is:inline> in BaseLayout sets html[data-lang] (and
 * html[lang]) from localStorage BEFORE first paint, so there is never a
 * flash of the other language. Everything here only keeps the rest of the
 * document in sync after that: <title>, meta description, search
 * placeholders and the toggle buttons' labels.
 *
 * The preference lives in localStorage (never a cookie) to honour the
 * privacy policy's no-cookies promise.
 */

export const LANG_KEY = 'kadali-lang';

export type Locale = 'kn' | 'en';

/** The language the document is currently showing (set by the pre-paint script). */
export function activeLocale(): Locale {
  return document.documentElement.dataset.lang === 'en' ? 'en' : 'kn';
}

/** The visitor's saved choice, when there is one. */
export function storedLocale(): Locale | null {
  try {
    const value = localStorage.getItem(LANG_KEY);
    return value === 'kn' || value === 'en' ? value : null;
  } catch {
    // Private mode or storage blocked — the Kannada default simply stands.
    return null;
  }
}

/**
 * Switch the document to `locale`. `persist = false` only applies the
 * language (used at startup, where the pre-paint script already did the
 * storage work).
 */
export function applyLocale(locale: Locale, persist = true): void {
  const root = document.documentElement;
  root.dataset.lang = locale;
  root.lang = locale;
  if (persist) {
    try {
      localStorage.setItem(LANG_KEY, locale);
    } catch {
      // Same as above: preference just doesn't survive the session.
    }
  }

  // <title> and meta description: BaseLayout mirrors both variants onto
  // <body> data attributes (crawlers keep seeing the Kannada default).
  const { titleKn, titleEn, descKn, descEn } = document.body.dataset;
  const title = locale === 'en' ? titleEn : titleKn;
  if (title) document.title = title;
  const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  const desc = locale === 'en' ? descEn : descKn;
  if (meta && desc) meta.setAttribute('content', desc);

  // Search inputs carry an English placeholder via data-ph-en.
  for (const el of document.querySelectorAll<HTMLInputElement>('[data-ph-en]')) {
    const kn = el.dataset.phKn ?? el.getAttribute('placeholder') ?? '';
    el.placeholder = locale === 'en' ? (el.dataset.phEn ?? kn) : kn;
  }

  // The toggle pill shows the language you would switch TO.
  const toggleLabel =
    locale === 'kn' ? 'Switch to English' : 'ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಿ';
  for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-lang-toggle]')) {
    btn.setAttribute('aria-label', toggleLabel);
  }
}
