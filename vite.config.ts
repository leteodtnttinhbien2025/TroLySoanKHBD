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
      // Cấu hình Build để xử lý pdfjs-dist worker
      build: { 
        rollupOptions: {
          output: {
            manualChunks(id) {
              // Tách pdf.worker.js ra khỏi gói chính
              if (id.includes('pdfjs-dist/build/pdf.worker')) {
                return 'pdf.worker';
              }
            }
          }
        }
      },
      define: {
        // Chỉ giữ lại biến GEMINI_API_KEY duy nhất
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          // Khắc phục lỗi alias nếu có
          '@': path.resolve(__dirname, '.'), 
        }
      }
    };
});
