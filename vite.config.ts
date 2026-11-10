import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative base so the built game works from any path (GitHub Pages, itch.io, etc.).
  base: './',
  server: {
    host: true,
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
