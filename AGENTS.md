# AGENTS.md — Kadali website

Bilingual (Kannada-first) static site for Kadali (ಕದಳಿ ವನಿತಾ ಸಮಾಜ), a women's cultural
collective in Shivamogga, Karnataka. Astro + Tailwind CSS 4 (CSS-first `@theme`) +
TypeScript strict, edited by club members via Sveltia CMS at `/admin`, deployed to
kadali.org on Cloudflare Pages.

## Commands

```sh
npm run dev      # dev server
npm run build    # static build to dist/
npm run preview  # preview the build
```

- No lint or test setup. `npm run build` is the verification gate: it zod-validates
  every content entry and resolves all imports. Use it after any change.
- `npx astro check` (typecheck) needs `@astrojs/check`, which is not installed.

## Layout

- `src/content.config.ts` — zod schemas for all six collections (articles, events,
  announcements, galleries, people, site-settings). **Shared contract; the file's own
  comment says change only with an explicit decision.** Frontmatter field changes break
  existing content and the CMS config.
- `src/content/<collection>/` — Markdown/JSON entries. Images are paths under `public/`;
  CMS uploads land in `public/images/uploads/`.
- `src/i18n/ui.ts` — every UI string as `{ kn, en }` pairs. Keys mirror the zod enums
  (e.g. `ROLE_LABELS` mirrors the `people` role enum) — keep them in sync.
- `src/lib/` — dependency-free helpers (`events.ts` status/sort, `authors.ts`).
- `src/components/` — grouped by area (`articles/`, `events/`, `home/`, `gallery/`,
  `motifs/`, `pages/`). `BaseLayout.astro` is the single page shell (SEO, JSON-LD,
  fonts, language scripts).
- `src/styles/tokens.css` — authoritative `@theme` palette/type tokens; `global.css` —
  base rules + `.prose-kadali` article styling. Components read tokens, not raw hex.
- `public/admin/` — Sveltia CMS (`config.yml`); changes there affect the members'
  publishing flow (editorial workflow, image transforms).
- `docs/` — read `docs/architecture.md` before touching CMS auth, permissions, or
  deploy; also `publishing-guide.md`, `admin-guide.md`, `validation.md`.

## Bilingual i18n rules (core mechanism)

- Every page ships **both** language variants. Strings render as adjacent
  `<span data-kn lang="kn">…</span><span data-en>…</span>`; `global.css` shows only the
  active variant via `html[data-lang]`. Without JavaScript the Kannada default stands.
- A pre-paint inline script in `BaseLayout` sets `html[data-lang]` from localStorage
  key `kadali-lang` **before first paint** (no flash). `src/i18n/client.ts` keeps
  title/meta/placeholders in sync on toggle. The first-visit picker is
  `LanguageGate.astro` (native `<dialog>`).
- **Never use cookies** for language (or anything else) — the privacy policy promises
  no cookies; localStorage only.
- Content (articles, events, people, captions, tags) is **not translated** — it stays in
  its written language and just gets `lang="kn"` wrapping where embedded in chrome.
- Crawlers always see the Kannada variants; English mirrors ride on `<body>` data
  attributes. New UI strings belong in `src/i18n/ui.ts`, not inline in components.

## Design & UI conventions

- Palette/type come from `tokens.css` (`--color-leaf`, `--color-turmeric`, `--color-cream`,
  …). Body text must keep ≥ 4.5:1 contrast on cream. Images stay sharp-cornered
  (border-radius 0) by design; headings are leaf-green poster-bold.
- Fonts are variable, via `@fontsource-variable` (Work Sans, Fraunces, Newsreader,
  Noto Sans/Serif Kannada); `BaseLayout` preloads the Kannada sans (hero/headings).
  Kannada headings need `line-height: 1.3` room for conjuncts (see `global.css`).
- Motion is transform/opacity only, gated behind `html.js` classes so pages are fully
  visible without scripting, and neutralised under `prefers-reduced-motion`.

## Deploy & content pipeline gotchas

- Deploy: GitHub Actions `.github/workflows/deploy.yml` — push to `main` → `npm run
  build` → `wrangler pages deploy` to Cloudflare Pages. Production domain is set in
  `astro.config.mjs` (`site: 'https://kadali.org'`).
- CMS editorial workflow saves drafts on `cms/<collection>/<slug>` branches; Cloudflare
  branch controls exclude `cms/*` builds to protect the free 500-builds/month quota.
  Don't "fix" draft branches not building — that's intentional.
- CMS uploads are transformed in the browser to WebP ≤ 2048px q80; a 15 MB gate runs
  before conversion. Filenames are slugified.
- README says "Astro 5"; `package.json` is authoritative (currently astro ^7). Trust
  package.json.
- `public/_worker.js` is the launch-gate Worker (ceremony curtain, advanced mode):
  every request not excluded by `public/_routes.json` passes through it, statics go
  via `env.ASSETS`. It fails OPEN when the `LAUNCH_KV` binding is absent — that is the
  "not armed" state, do not "fix" it. Runbook: `docs/launch-gate.md`.
- Stray root files are source material, not site code: `article1.md`, `index (2).html`,
  `hero.png`, `board/` (committee photos with Kannada filenames). `.hallmark/` is
  gitignored design-tool state — never commit it. `dist/` and `.astro/` are generated.
