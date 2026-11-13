# Kadali home page → warm "cultural brochure" redesign

## Context
You shared a reference brochure (peach panels, deep-green frame, orange mandala/floral motifs, white outline florals, badge chips) and asked for the home page to look like it. Decisions you confirmed: **whole site** recolor, **bold sans headings**, **green chrome bands** (header / join / footer). The codebase is ideal for this: Tailwind v4 `@theme` tokens in one file drive every component (115 `rani` usages across 31 files), and there's an existing `currentColor` motif system (`KasutiBorder`, `Arch`, `Beads`) to extend.

## Design direction
New palette (all in `src/styles/tokens.css`), brochure-sampled, contrast-checked ≥4.5:1 on the peach ground:

| Token | Was | Becomes |
|---|---|---|
| `--color-leaf` (renamed from `rani`) | `#8e1f3b` maroon | `#1d5f3c` deep green — headings, primary text accents |
| `--color-turmeric` | `#d9972b` | `#e8862e` brochure orange — badges, motifs, primary CTA |
| `--color-cream` | `#fbf6ed` | `#f9ead3` warm peach page ground |
| `--color-jasmine` | `#f3eada` | `#f2ddb9` deeper peach alternate bands |
| `--color-stone` | `#6b5d52` | `#55645a` muted green-grey text |
| `--color-ink` | `#221410` | `#20281f` green-tinted near-black body text |
| `--color-milk` (new) | — | `#fffdf7` warm white — floral motifs, text on green |
| `--color-sindoor` | keep | unchanged (sparingly) |

Type: `--font-display` re-points to the sans stack (`Work Sans` + `Noto Sans Kannada`); base heading weight 700; `--font-body`/prose stays serif. Global headings turn green; cream overrides on dark bands.

## Implementation

**1. Tokens + global styles**
- `src/styles/tokens.css`: re-value palette, rename `--color-rani` → `--color-leaf`, add `--color-milk`, re-point `--font-display` to sans, retint `--drop-shadow-devi`.
- `src/styles/global.css`: heading color `var(--color-leaf)` + weight 700 in base layer; `h1:lang(kn)…h6:lang(kn)` → `var(--font-kn)` (sans Kannada); focus ring → leaf; prose links → leaf; add a `.badge` component class (orange chip, ink text, uppercase tracking — the brochure "50% OFF" pill).
- Mechanical rename `rani`→`leaf` across `src/**` (sed + grep verify zero remaining). Update the tokens/global hallmark comments.

**2. New motifs** in `src/components/motifs/` (same `Props { class }` + `currentColor` pattern as `KasutiBorder.astro`):
- `Mandala.astro` — layered petal mandala (rotated petal groups, dot ring) like the brochure's big orange medallion.
- `Bloom.astro` — small solid 6-petal flower (scattered accents / pillar icons).
- `FlowerLine.astro` — white outline blossom (the background florals; used as `text-milk/60` etc.).

**3. Chrome (green frame)**
- `Header.astro`: `bg-leaf` bar, cream wordmark + orange logo mark, nav cream with turmeric/current states, drawer on green. 
- `Footer.astro`: `bg-leaf` mast, turmeric `KasutiBorder` on top, cream text/links.
- `JoinBand.astro`: `bg-leaf`, cream text (explicit heading override), turmeric button, white `FlowerLine` scatter + faint `Mandala`.
- `BaseLayout.astro`: drop Fraunces import + preload (unused after sans switch); body stays token-driven.

**4. Home page** (`src/pages/index.astro` + `src/components/home/`)
- Band rhythm: Hero cream → Aim jasmine → Events cream → Articles jasmine → Committee cream → Join green.
- `Hero.astro`: peach panel — orange badge chip `ಕದಲಿ ಮಹಿಳಾ ಸಂಘ • ಉಡುಪಿ` above the green heading, white floral scatter + corner `Mandala` (turmeric), turmeric primary CTA / green outline secondary, Kasuti frieze bottom in green, Akkamahadevi painting kept (retint shadow). Arch motifs replaced by florals here.
- `Aim.astro`: small `Bloom` icon above each pillar title, white florals in corners.
- `EventCard.astro` / inline events section: jasmine cards on cream, date block green, time in orange.
- `RecentArticles.astro`: cream cards on jasmine; category label becomes a small orange badge chip.
- `CommitteePreview.astro`: jasmine cards on cream, role labels green; arched frames kept.

**5. Shared assets**
- `public/favicon.svg` + `public/images/og-default.svg`: maroon hexes → leaf green. Content placeholder SVGs under `public/images/uploads/` left as-is (awaiting real photos).

Inner pages (`PageHero.astro`, listings, article prose) recolor automatically via tokens; add cream heading overrides wherever a heading sits on a now-green band (e.g. PageHero if it's on green).

## Verification
1. `npm run build` — catches rename misses/type errors.
2. `grep -ri rani src/` → zero hits.
3. Dev server + browser screenshots (desktop 1440 & mobile 390) of home, about, articles, events — compare against the brochure: peach panels, green frame, orange accents, white florals; then fix visual nits.
4. Contrast spot-checks (stone/cream, ink/turmeric, cream/leaf) with a quick WCAG calc before finalizing hex values.

Motion (`reveal`, `hero-rise`, rails) and content/CMS structures stay untouched.