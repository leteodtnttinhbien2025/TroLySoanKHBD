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
          // FIX MỚI: Thêm pdfjs-dist vào external để Rollup không cố gắng đóng gói nó
          // khi nó được mong đợi là một thư viện được tải từ CDN hoặc môi trường ngoài.
          // Tuy nhiên, nếu bạn muốn đóng gói nó, cách giải quyết là dùng cấu hình alias:
          
          // Sử dụng external cho các module Node.js (như fs, path, stream)
          // Nếu lỗi cũ quay lại, hãy mở comment này:
          // external: ['fs', 'path', 'stream', 'util'], 
        }
      },
      define: {
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'), 
          // FIX BỔ SUNG: Đảm bảo Vite sử dụng phiên bản trình duyệt của pdfjs-dist
          // Điều này giúp Rollup giải quyết import chính xác hơn.
          // 'pdfjs-dist': 'pdfjs-dist/build/pdf', 
        }
      }
    };
});
