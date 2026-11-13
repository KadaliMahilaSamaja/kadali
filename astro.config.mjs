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
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
