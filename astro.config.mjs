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
  },
});
