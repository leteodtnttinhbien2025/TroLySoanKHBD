import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

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
              if (id.includes('pdf.worker')) {
                return 'pdf.worker';
              }
            }
          },
          external: ['fs', 'path', 'stream', 'util'], 
        }
      },
      define: {
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),

          // ⭐ Alias PDFJS LEGACY (đúng cho pdfjs-dist 3.x–4.x)
          'pdfjs-dist/build/pdf': 'pdfjs-dist/legacy/build/pdf',
          'pdfjs-dist/build/pdf.worker.js': 'pdfjs-dist/legacy/build/pdf.worker.js',

          // Alias Mammoth
          'mammoth': 'mammoth/mammoth.browser.js'
        }
      }
    };
});
