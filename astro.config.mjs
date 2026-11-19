// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Production domain (kadali.org).
  site: 'https://kadali.org',
  output: 'static',
  compressHTML: true,
  integrations: [
    sitemap({
      // The ceremony control page is internal — never in the sitemap.
      filter: (page) => {
        const path = new URL(page).pathname;
        return path !== '/launch' && !path.startsWith('/launch/');
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    build: {
      // Safari 15 floor (iPadOS 15 devices in the club's audience): esbuild
      // transpiles JS syntax; lightningcss minifies CSS against the same
      // floor (vendor prefixes only — feature transforms happen in
      // postcss.config.mjs, which lightningcss does not do for @layer,
      // @property or var()-operand color-mix()).
      target: ['safari15'],
      cssMinify: 'lightningcss',
      cssTarget: ['safari15'],
    },
  },
});
