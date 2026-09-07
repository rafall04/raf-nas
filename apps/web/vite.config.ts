import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev: web di :5173, proxy /api -> API NestJS di localhost:4000 (mirip reverse proxy produksi).
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
    },
  },
});
