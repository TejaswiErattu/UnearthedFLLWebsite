// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // proxied to your Express server on 8787
      '/api': 'http://localhost:8787',
    }
  }
})
