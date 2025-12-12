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
              // Tách pdf.worker.js ra khỏi gói chính để tải bất đồng bộ
              if (id.includes('pdfjs-dist/build/pdf.worker')) {
                return 'pdf.worker';
              }
            }
          },
          // FIX LỖI Rollup: Loại trừ các module Node.js để tránh lỗi trong môi trường trình duyệt
          external: ['fs', 'path', 'stream', 'util'], 
        }
      },
      define: {
        // FIX LỖI ENVIRONMENT: Chỉ định nghĩa GEMINI_API_KEY chính xác
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'), 
        }
      }
    };
});
