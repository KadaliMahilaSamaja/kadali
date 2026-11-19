// Safari 15.1 compat pass (iPadOS 15 devices in the club's audience).
// Tailwind v4 already ships its own fallbacks for its color-mix() uses
// (@supports guards) and its --tw-* property defaults (a plain custom
// property block targeting older WebKit) — both of which work on Safari 15.1
// *once cascade layers stop discarding them*. @layer support landed in
// Safari 15.4, so on 15.1 the browser drops every @layer block — the entire
// stylesheet — which is what mangled the site on those iPads.
//
// This config therefore does exactly two things:
//   1. Flattens cascade layers into unlayered CSS in layer-precedence order
//      (@csstools/postcss-cascade-layers), so the whole Tailwind bundle —
//      theme variables, base rules, utilities, and Tailwind's own @property
//      fallback block — reaches Safari 15.1 intact.
//   2. Adds static rgba() fallbacks ahead of the hand-written
//      color-mix(in srgb, var(--color-*), …) uses in component CSS, which
//      Tailwind does not guard. srgb only: Tailwind's guarded oklab mixes
//      and the desktop-only oklab scrollbar tints are left untouched.
// Graceful degradation remains for :has(), text-wrap: balance and
// backdrop-filter niceties — they cost polish, not layout.
import cascadeLayers from '@csstools/postcss-cascade-layers';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// The palette is the shared contract in src/styles/tokens.css — read the
// --color-* values from there rather than duplicating hexes in this file.
const tokensPath = fileURLToPath(new URL('./src/styles/tokens.css', import.meta.url));
const colorTokens = new Map();
for (const m of readFileSync(tokensPath, 'utf8').matchAll(
  /--color-([\w-]+):\s*(#[0-9a-fA-F]{6})\b/g,
)) {
  colorTokens.set(m[1], m[2]);
}

// Parse `#rrggbb` to [r, g, b] (0–255).
function parseHex(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

// Resolve an operand (token var, hex literal, or transparent) to
// { rgb, alpha }, or null when unsupported — unsupported shapes leave the
// declaration alone rather than emitting a wrong fallback.
function resolveOperand(operand) {
  const token = operand.trim().match(/^var\(--color-([\w-]+)\)$/);
  if (token && colorTokens.has(token[1])) {
    return { rgb: parseHex(colorTokens.get(token[1])), alpha: 1 };
  }
  if (/^#[0-9a-fA-F]{6}$/.test(operand.trim())) {
    return { rgb: parseHex(operand.trim()), alpha: 1 };
  }
  if (operand.trim() === 'transparent') {
    return { rgb: [0, 0, 0], alpha: 0 };
  }
  return null;
}

// Static fallbacks for color-mix(in srgb, A P%, B). B may carry its own
// percent (syntax allows `A P1%, B P2%`); weights renormalise to 1.
const colorMixRe =
  /color-mix\(in srgb,\s*([^,()]+(?:var\([\w-]+\))?(?:\s+[\d.]+%)?)\s*,\s*([^)]+)\)/g;

const srgbColorMixFallbacks = {
  postcssPlugin: 'kadali-srgb-color-mix-fallbacks',
  Declaration(decl) {
    if (!decl.value.includes('color-mix(in srgb')) return;
    let rewritten = decl.value;
    let fallbacks = 0;
    rewritten = rewritten.replace(colorMixRe, (match, a, b) => {
      const splitWeight = (operand) => {
        const m = operand.trim().match(/^(.*?)(?:\s+([\d.]+%))?$/s);
        const [color, weight] = [m[1], m[2] ? parseFloat(m[2]) / 100 : null];
        return { color, weight };
      };
      const aPart = splitWeight(a);
      const bPart = splitWeight(b);
      const A = resolveOperand(aPart.color);
      const B = resolveOperand(bPart.color);
      if (!A || !B) return match;
      const wA =
        aPart.weight ?? (bPart.weight !== null ? 1 - bPart.weight : 0.5);
      const wB = 1 - wA;
      const alpha = A.alpha * wA + B.alpha * wB;
      // color-mix interpolates in premultiplied alpha and unpremultiplies,
      // so `X 15%, transparent` keeps X's channels and only sets alpha —
      // NOT a darkened X (the naive r*wA reads far too dark on the page).
      const rgb = [0, 1, 2].map((i) => {
        const mixed =
          A.rgb[i] * A.alpha * wA + B.rgb[i] * B.alpha * wB;
        return alpha > 0 ? Math.round(mixed / alpha) : 0;
      });
      fallbacks += 1;
      return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha.toFixed(3)})`;
    });
    if (fallbacks > 0 && rewritten !== decl.value) {
      // The fallback goes BEFORE the color-mix declaration: modern browsers
      // keep color-mix (later declaration wins), Safari 15.1 uses the rgba.
      const fallback = decl.clone({ value: rewritten });
      fallback.raws.before = decl.raws.before ?? '\n  ';
      decl.parent.insertBefore(decl, fallback);
    }
  },
};

export default {
  plugins: [cascadeLayers(), srgbColorMixFallbacks],
};
