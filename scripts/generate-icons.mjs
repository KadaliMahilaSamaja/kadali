/**
 * Rasterize the PWA icons from public/favicon.svg — the single source of
 * truth for the bud-and-dots mark (green disc + cream dots, 32×32).
 *
 * Outputs into public/icons/:
 *   icon-192.png            "any" — disc on transparent, as in the favicon
 *   icon-512.png            "any" — same, larger
 *   icon-maskable-512.png   "maskable" — full-bleed green tile; every mask
 *                           (circle, squircle, rounded square) crops cleanly
 *                           and the dots stay inside the 80% safe zone
 *   apple-touch-icon.png    180×180 for iOS — cream background, because iOS
 *                           blacks out transparent pixels
 *
 * Run: npm run icons   (after `npm install`, which brings in sharp)
 */

import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'icons');

const favicon = await readFile(join(root, 'public', 'favicon.svg'), 'utf8');

// Everything between the <svg> tag and </svg> — the mark itself, without the
// viewBox that ties it to 32 units.
const mark = favicon.slice(favicon.indexOf('>') + 1, favicon.lastIndexOf('</svg>'));

const GREEN = '#1D5F3C';
const CREAM = '#F9EAD3';

function svg({ tile, scale = 1 }) {
  // `tile`: background filling the whole canvas, or null for transparency.
  // `scale`: zoom on the mark; maskable crops up to 50% of the edge in, so
  // the full-bleed tile version blows the disc past the safe zone on purpose.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  ${tile ? `<rect width="32" height="32" fill="${tile}"/>` : ''}
  <g transform="translate(16 16) scale(${scale}) translate(-16 -16)">${mark}</g>
</svg>`;
}

async function render(name, size, body) {
  // sharp rasterizes SVGs at 72 dpi, i.e. 1 px per unit — give it enough
  // density to land exactly on `size`, then pin the output dimensions.
  const density = Math.ceil((72 * size) / 32);
  const png = await sharp(Buffer.from(body), { density })
    .resize(size, size)
    .png()
    .toBuffer();
  await writeFile(join(outDir, name), png);
  console.log(`✓ public/icons/${name} (${size}×${size})`);
}

await mkdir(outDir, { recursive: true });

// "any" icons: the disc exactly as the favicon draws it (r 14 of 16).
await render('icon-192.png', 192, svg({}));
await render('icon-512.png', 512, svg({}));

// Maskable: solid green canvas, dots re-centered. The disc is sacrificed —
// the tile IS the disc, scaled 1.25 so the visible safe circle stays green.
// Dots at their favicon positions sit ~7.3 units from centre, well inside
// the 12.8-unit safe radius.
await render('icon-maskable-512.png', 512, svg({ tile: GREEN, scale: 1.25 }));

// Apple touch icon: cream card behind the disc, no transparency.
await render('apple-touch-icon.png', 180, svg({ tile: CREAM }));
