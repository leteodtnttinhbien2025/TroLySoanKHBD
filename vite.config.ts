import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  return {
    server: {
      port: 3000,
      host: "0.0.0.0"
    },
    plugins: [react()],
    define: {
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),

        // ⭐ Alias legacy PDFJS - bắt buộc cho bundler
        "pdfjs-dist/build/pdf": "pdfjs-dist/legacy/build/pdf",
        "pdfjs-dist/build/pdf.worker.js": "pdfjs-dist/legacy/build/pdf.worker.js",

        // Mammoth
        "mammoth": "mammoth/mammoth.browser.js"
      }
    }
  };
});
