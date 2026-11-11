import { defineConfig } from 'vite'

// Builds the website embed as one classic script: dist/qrscape.js defines <qr-scape>.
export default defineConfig({
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    // three.js is bundled in: one ~550 KB file people load once from the script tag.
    chunkSizeWarningLimit: 700,
    lib: { entry: 'src/embed/qrscape.ts', formats: ['iife'], name: 'QRscape', fileName: () => 'qrscape.js' },
  },
})
