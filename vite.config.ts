import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // three.js alone is ~530 KB minified; it is lazy-loaded, so that one chunk is allowed to be big.
  build: { chunkSizeWarningLimit: 600 },
})
