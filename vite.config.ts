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
              // Tách pdf.worker.js ra khỏi gói chính
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
          
          // FIX CUỐI CÙNG: Thử lại với '.mjs' sử dụng đường dẫn tuyệt đối.
          // Đây là tệp ES module chính trong các phiên bản mới của pdfjs-dist.
          'pdfjs-dist': path.resolve(rootDir, 'node_modules/pdfjs-dist/build/pdf.mjs'),
          
          // Alias cho mammoth.browser.js
          'mammoth': 'mammoth/mammoth.browser.js',
          
          // Alias cho worker
          'pdfjs-dist/build/pdf.worker.mjs': 'pdfjs-dist/build/pdf.worker.mjs'
        }
      }
    };
});
