import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 开发时把 /api 代理到后端，避免跨域；生产可由后端托管 dist 或用 VITE_API_BASE 指定
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
