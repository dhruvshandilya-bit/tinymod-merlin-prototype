import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base only applies to the production build (GitHub Pages); dev stays at "/"
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/tinymod-merlin-prototype/' : '/',
  plugins: [react()],
  server: { port: 5196 },
}))
