import * as mammoth from 'mammoth';

// Khai báo biến để lưu trữ module pdfjs-dist sau khi import động
let pdfjsLib: any = null;

/**
 * Dynamic import pdfjs-dist để Vite + Rollup không complain khi build
 */
const loadPdfJs = async () => {
  if (!pdfjsLib) {
    // SỬA: Thay đổi đường dẫn import thành 'pdf.mjs' để Rollup/Vite phân giải đúng
    pdfjsLib = await import('pdfjs-dist/build/pdf.mjs'); // dynamic import

    // KHẮC PHỤC LỖI WORKER: Import động tệp Worker module thay vì dùng CDN
    const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.mjs');
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker.default;

    // Lưu ý: Đã loại bỏ dòng cấu hình Worker cũ trỏ đến CDN (https://cdnjs...)
  }
  return pdfjsLib;
};

/**
 * Lấy text từ PDF
 */
const getTextFromPdf = async (file: File): Promise<string> => {
  const pdfjs = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  // Loại bỏ type casting 'any' nếu dự án của bạn là TypeScript hiện đại
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise; 
  let textContent = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const text = await page.getTextContent();
    textContent +=
      text.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ') + '\n';
  }

  return textContent;
};

/**
 * Lấy text từ DOCX
 */
const getTextFromDocx = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

/**
 * Processed file type
 */
export type ProcessedFile = {
  type: 'text' | 'file';
  content: string | File;
  name: string;
};

/**
 * Xử lý file: PDF/DOCX extract text, các file khác giữ nguyên
 */
export const processFileContent = async (file: File): Promise<ProcessedFile> => {
  try {
    if (file.type === 'application/pdf') {
      const text = await getTextFromPdf(file);
      return { type: 'text', content: text, name: file.name };
    }

    if (
      file.type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const text = await getTextFromDocx(file);
      return { type: 'text', content: text, name: file.name };
    }

    return { type: 'file', content: file, name: file.name };
  } catch (error) {
    console.error(`Error processing file ${file.name}:`, error);
    return { type: 'file', content: file, name: file.name };
  }
};
