// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://coreflow-pilates-x7k2.vercel.app',
  output: 'server',
  adapter: vercel(),
  // Origin check misfires behind Vercel's proxy (internal URL != public host).
  // Forms are protected by honeypot + timing + rate limits; webhook is signature-verified.
  security: { checkOrigin: false },
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/admin') &&
        !page.includes('/api/') &&
        !page.includes('/checkout/') &&
        !page.includes('/login') &&
        !page.includes('/auth/'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
