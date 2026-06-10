import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
