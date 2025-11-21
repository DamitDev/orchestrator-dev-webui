import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.PORT || '5173'),
    strictPort: true,
    host: true,
    proxy: {
      '/api': {
        target: process.env.VITE_ORCHESTRATOR_API_URL || 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/ws': {
        target: process.env.VITE_ORCHESTRATOR_WS_URL || 'ws://localhost:8080',
        ws: true,
        changeOrigin: true
      }
    }
  }
})


