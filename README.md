# Kadali

Website for **Kadali**, a women's cultural collective in Karnataka.

**Stack:** [Astro](https://astro.build) 5 · Tailwind CSS 4 (CSS-first `@theme` tokens) · TypeScript strict · Sveltia CMS on GitHub · Cloudflare Pages.

## Commands

```sh
npm install
npm run dev      # local dev server
npm run build    # static build to dist/
npm run preview  # preview the production build
```

## Layout

- `src/content.config.ts` — zod schemas for all collections (articles, events, announcements, galleries, site-settings).
- `src/content/<collection>/` — Markdown/JSON content; uploads go to `public/images/uploads/`.
- `src/styles/tokens.css` — shared palette/type contract (`@theme`); `src/styles/global.css` — base + `.prose-kadali` article styling.
- `src/components/` — `BaseLayout`, `Header`, `Footer`, `Seo`, and `motifs/` (Arch, Beads, KasutiBorder).

**Fonts:** Fraunces, Newsreader, Work Sans (all variable) via `@fontsource-variable`; Kannada via `@fontsource-variable/noto-sans-kannada` + `@fontsource-variable/noto-serif-kannada` (both available — nothing omitted).

<!-- Seed content placeholders live in src/content — replace before launch. -->
