import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  server: {
      proxy: {
          '/CourseBackend': {
              target: 'http://localhost:8080',
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/CourseBackend/, ''),
          },
      },
      host: true,            // 0.0.0.0
      port: 5173,
      hmr: {
          host: 'localhost',   // or your Windows host IP
          port: 5173
      },
      watch: {
          usePolling: true,
      }
  },
    plugins: [
        react(),
        tailwindcss(),
    ],
})
