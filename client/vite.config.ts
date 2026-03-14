import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4001',
      '/login': 'http://localhost:4001',
    },
  },
  build: {
    outDir: '../dist-client',
    emptyOutDir: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
