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
            manualChunks(id) {
              // Tách pdf.worker.js ra khỏi gói chính
              if (id.includes('pdfjs-dist/build/pdf.worker')) {
                return 'pdf.worker';
              }
            }
          },
          // Giữ lại các external Node.js cơ bản (fs, path)
          external: ['fs', 'path', 'stream', 'util'], 
        }
      },
      define: {
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          // FIX MỚI QUAN TRỌNG: Đổi từ 'pdf.mjs' sang 'pdf.js'
          'pdfjs-dist': 'pdfjs-dist/build/pdf.js', 
          // Thiết lập alias cho worker để đảm bảo tải đúng
          'pdfjs-dist/build/pdf.worker.mjs': 'pdfjs-dist/build/pdf.worker.mjs', 
          // Bổ sung alias cho mammoth để tránh lỗi tương tự
          'mammoth': 'mammoth/mammoth.browser.js'
        }
      }
    };
});
