import { viteSingleFile } from 'vite-plugin-singlefile';
import { defineConfig } from 'vite';

/** Builds the whole game (code, styles, fonts) into one HTML file that works from file://. */
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  build: {
    outDir: 'dist-single',
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
  },
});
