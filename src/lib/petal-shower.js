/**
 * ಪುಷ್ಪ ವರ್ಷ — the petal shower elders perform at every inauguration.
 *
 * Shared by the /launch ceremony (radial burst + full-viewport shower)
 * and by the opened site itself (a page that loads with ?celebrate=1
 * rains petals over the real content). Dependency-free by design: WAAPI,
 * inline SVG strings, colours read from the CSS tokens at call time.
 *
 * The companion CSS lives in global.css (`.petal` / `.drop`) because the
 * petals are created at runtime and carry no Astro scope attribute.
 */

const REDUCED =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Colours are read from the tokens once per shower — SVG presentation
   attributes do not understand var(), so the resolved values are baked
   into the art. */
function petalInk() {
  const styles = getComputedStyle(document.documentElement);
  const token = (name, fallback) => (styles.getPropertyValue(name) || fallback).trim();
  return {
    turmeric: token('--color-turmeric', '#E8862E'),
    sindoor: token('--color-sindoor', '#C03A2B'),
    leaf: token('--color-leaf', '#1D5F3C'),
    milk: token('--color-milk', '#FFFDF7'),
  };
}

function petalArt(i) {
  const ink = petalInk();
  const colors = [ink.turmeric, ink.sindoor, ink.leaf, ink.turmeric, ink.sindoor];
  const c = colors[i % colors.length];
  const kind = i % 4;
  if (kind === 0) {
    // a single marigold petal
    return (
      '<svg viewBox="0 0 14 22" aria-hidden="true"><ellipse cx="7" cy="11" rx="5.5" ry="10" fill="' +
      c +
      '"/></svg>'
    );
  }
  if (kind === 1) {
    // a ruffled marigold disc
    return (
      '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="' +
      c +
      '"/><circle cx="10" cy="10" r="4.6" fill="' +
      ink.milk +
      '" opacity="0.85"/><circle cx="10" cy="10" r="1.8" fill="' +
      c +
      '"/></svg>'
    );
  }
  if (kind === 2) {
    // the brochure's six-petal bloom
    let e = '';
    for (let a = 0; a < 6; a++) {
      e += '<ellipse cx="16" cy="8" rx="4.4" ry="6.4" transform="rotate(' + a * 60 + ' 16 16)"/>';
    }
    return (
      '<svg viewBox="0 0 32 32" fill="' +
      c +
      '" aria-hidden="true">' +
      e +
      '<circle cx="16" cy="16" r="5.6" fill="' +
      c +
      '"/><circle cx="16" cy="16" r="2.6" fill="' +
      ink.milk +
      '"/></svg>'
    );
  }
  // jasmine-white bloom, stroked so it reads on the cream ground
  let e2 = '';
  for (let a = 0; a < 6; a++) {
    e2 +=
      '<ellipse cx="16" cy="8" rx="4.4" ry="6.4" transform="rotate(' +
      a * 60 +
      ' 16 16)" fill="' +
      ink.milk +
      '" stroke="' +
      c +
      '" stroke-width="1.2"/>';
  }
  return (
    '<svg viewBox="0 0 32 32" aria-hidden="true">' +
    e2 +
    '<circle cx="16" cy="16" r="3.4" fill="' +
    c +
    '"/></svg>'
  );
}

const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';

/** A radial burst of petals erupting from the centre of the container. */
export function burstPetals(container) {
  if (!container || REDUCED || !container.animate) return;
  for (let i = 0; i < 26; i++) {
    const petal = document.createElement('span');
    petal.className = 'petal';
    petal.innerHTML = petalArt(i);
    const s = 9 + Math.random() * 11;
    petal.style.width = s + 'px';
    petal.style.height = s + 'px';
    petal.style.margin = -(s / 2) + 'px';
    const angle = (Math.PI * 2 * i) / 26 + Math.random() * 0.4;
    const radius = 110 + Math.random() * 120;
    const dx = Math.cos(angle) * radius;
    const dy = Math.sin(angle) * radius;
    const spin = Math.random() * 260 - 130;
    const anim = petal.animate(
      [
        { opacity: 1, transform: 'translate(0, 0) scale(1) rotate(0deg)' },
        {
          opacity: 0.9,
          transform:
            'translate(' + dx * 0.7 + 'px, ' + dy * 0.7 + 'px) scale(0.9) rotate(' + spin * 0.6 + 'deg)',
          offset: 0.6,
        },
        {
          opacity: 0,
          transform:
            'translate(' + dx + 'px, ' + (dy + 40) + 'px) scale(0.4) rotate(' + spin + 'deg)',
        },
      ],
      {
        duration: 720 + Math.random() * 380,
        delay: Math.random() * 140,
        easing: EASE_OUT,
        fill: 'both',
      },
    );
    anim.onfinish = () => petal.remove();
    container.appendChild(petal);
  }
}

function spawnDrop(container, vw, vh, delay, id) {
  const el = document.createElement('span');
  el.className = 'drop';
  const back = id % 3 === 0; // the far layer: smaller, slower, dimmer
  const s = back ? 9 + Math.random() * 5 : 15 + Math.random() * 11;
  el.style.width = s + 'px';
  el.style.height = s + 'px';
  el.innerHTML = petalArt(id);
  el.style.left = Math.random() * (vw + 40) - 20 + 'px';
  const drift = Math.random() * 120 - 60;
  const sway = 18 + Math.random() * 26;
  const dir = Math.random() < 0.5 ? -1 : 1;
  const spin = dir * (420 + Math.random() * 420);
  const dur = (back ? 4200 : 3200) + Math.random() * 1400;
  const restOpacity = back ? 0.5 : 0.95;
  const anim = el.animate(
    [
      { transform: 'translate3d(0, 0, 0) rotate(0deg)', opacity: 0, easing: 'ease-in' },
      { opacity: restOpacity, offset: 0.06, easing: 'ease-in-out' },
      {
        transform:
          'translate3d(' + (drift * 0.4 + sway) + 'px, ' + vh * 0.38 + 'px, 0) rotate(' + spin * 0.4 + 'deg)',
        offset: 0.4,
        easing: 'ease-in-out',
      },
      {
        transform:
          'translate3d(' + (drift * 0.8 - sway) + 'px, ' + vh * 0.72 + 'px, 0) rotate(' + spin * 0.75 + 'deg)',
        offset: 0.72,
        easing: 'ease-in-out',
      },
      { opacity: restOpacity - 0.1, offset: 0.9, easing: 'ease-in' },
      {
        transform: 'translate3d(' + drift + 'px, ' + (vh + 50) + 'px, 0) rotate(' + spin + 'deg)',
        opacity: 0,
      },
    ],
    { duration: dur, delay: delay, fill: 'both' },
  );
  anim.onfinish = () => el.remove();
  container.appendChild(el);
}

/** A full-viewport flower shower in three thinning waves (~10 s total). */
export function flowerShower(container) {
  if (!container || REDUCED || !container.animate) return;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // three waves, thinning as they go, like handfuls tossed one after another
  const waves = [
    { n: 30, at: 0 },
    { n: 22, at: 1700 },
    { n: 14, at: 3300 },
  ];
  let id = 0;
  waves.forEach((wave) => {
    for (let k = 0; k < wave.n; k++) {
      spawnDrop(container, vw, vh, wave.at + Math.random() * 1500, id++);
    }
  });
  window.setTimeout(() => {
    if (container) container.innerHTML = '';
  }, 11000);
}
