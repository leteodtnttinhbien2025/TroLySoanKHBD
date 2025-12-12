import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Định nghĩa thư mục gốc của dự án
const rootDir = path.resolve(__dirname);

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
          // Giữ lại các external Node.js cơ bản
          external: ['fs', 'path', 'stream', 'util'], 
        }
      },
      define: {
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          // FIX CUỐI CÙNG: Sử dụng đường dẫn tuyệt đối cho Alias. 
          // Nếu tệp pdf.js vẫn không được tìm thấy, bạn cần kiểm tra chính xác 
          // tệp nào tồn tại trong thư mục node_modules/pdfjs-dist/build/
          'pdfjs-dist': path.resolve(rootDir, 'node_modules/pdfjs-dist/build/pdf.js'),
          
          // Alias cho mammoth.browser.js (tương đối là đủ)
          'mammoth': 'mammoth/mammoth.browser.js',
          
          // Alias cho worker
          'pdfjs-dist/build/pdf.worker.mjs': 'pdfjs-dist/build/pdf.worker.mjs'
        }
      }
    };
});
