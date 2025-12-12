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
                        // Không cần xử lý pdf.worker nữa vì dùng pdf-parse-browser
                        return undefined;
                    }
                },
                // Không còn external pdfjs-dist
                external: [
                    'fs', 'path', 'stream', 'util'
                ]
            }
        },
        define: {
            'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),

                // Mammoth browser bundle
                'mammoth': 'mammoth/mammoth.browser.js'
            }
        }
    };
});
