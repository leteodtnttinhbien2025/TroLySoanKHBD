import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },

    plugins: [react()],

    build: {
      rollupOptions: {
        output: {
          // ⭐ Tách riêng PDF worker để tránh xung đột bundler
          manualChunks(id) {
            if (id.includes('pdf.worker') || id.includes('pdfjs-dist')) {
              return 'pdfjs';
            }
          }
        },

        // ❌ Không external pdfjs-dist → sẽ gây lỗi import trong browser
        // Chỉ external Node APIs (nếu có library sử dụng)
        external: ['fs', 'path', 'stream', 'util'],
      },

      // PDF.js khá nặng, nên dùng tanspileOnly để tăng tốc
      target: 'esnext'
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),

        // ⭐ MAMMOTH (browser version)
        'mammoth': 'mammoth/mammoth.browser.js',

        // ❌ KHÔNG dùng alias pdfjs-dist nữa (đã chuyển sang dynamic import)
        // Điều này tránh build error trên Rollup/Vercel
      }
    },

    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    }
  };
});
