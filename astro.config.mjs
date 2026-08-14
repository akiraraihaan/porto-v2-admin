// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'server',

  server: {
    port: 4322
  },

  preview: {
    port: 4322
  },

  security: {
    checkOrigin: false
  },

  integrations: [react()],

  adapter: cloudflare(),

  vite: {
    plugins: [tailwindcss()]
  }
});