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
              if (id.includes('pdfjs-dist/build/pdf.worker')) {
                return 'pdf.worker';
              }
            }
          },
          // FIX CŨ: Giữ lại các external Node.js cơ bản (fs, path)
          external: ['fs', 'path', 'stream', 'util'], 
        }
      },
      define: {
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          // FIX MỚI QUAN TRỌNG: Thiết lập alias để chỉ định tệp chính xác
          // Đây là cách giải quyết Rollup không tìm thấy tệp.
          // Chúng ta chỉ định dùng tệp 'pdf.mjs'
          'pdfjs-dist': 'pdfjs-dist/build/pdf.mjs', 
          // Cần thiết nếu Rollup/Vite không tự động tìm thấy worker.mjs
          'pdfjs-dist/build/pdf.worker.mjs': 'pdfjs-dist/build/pdf.worker.mjs' 
        }
      }
    };
});
