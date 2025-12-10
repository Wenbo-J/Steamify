import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/games': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/music': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/users': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/genres': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/playlist': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/recommends': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/analytics': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
})
