import {resolve} from 'node:path'
import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        fireTraining: resolve(__dirname, 'fire-training.html'),
        panorama: resolve(__dirname, 'panorama.html'),
      },
    },
  },
  server: {
    proxy: {
      '/api/sanity': {
        target: 'https://z6ortijb.api.sanity.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/sanity/, ''),
      },
      '/api/vendure': {
        target: 'https://api.defendfreedomindustries.com',
        changeOrigin: true,
        rewrite: () => '/shop-api',
      },
    },
  },
})
