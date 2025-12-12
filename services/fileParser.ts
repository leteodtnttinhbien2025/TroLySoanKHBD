// Kiểu dữ liệu cho file đã xử lý
export type ProcessedFile = {
  type: 'text' | 'file';
  content: string | File;
  name: string;
};

/**
 * Trích xuất nội dung văn bản từ tệp PDF bằng dynamic import (fix Vercel/Vite).
 */
const getTextFromPdf = async (file: File): Promise<string> => {
  // Import PDF.js chỉ khi chạy trên trình duyệt
  const pdfjsLib = await import('pdfjs-dist/build/pdf');
  const pdfWorker = await import('pdfjs-dist/build/pdf.worker.mjs');

  // Gán workerSrc cho PDF.js
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let textContent = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const text = await page.getTextContent();

    textContent +=
      text.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ') + '\n';
  }

  return textContent;
};

/**
 * DOCX → text bằng mammoth (bản browser)
 */
const getTextFromDocx = async (file: File): Promise<string> => {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

/**
 * Hàm xử lý file nhập vào
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

    // File không hỗ trợ → trả về file gốc
    return { type: 'file', content: file, name: file.name };
  } catch (error) {
    console.error(`Lỗi khi xử lý tệp ${file.name}:`, error);
    return { type: 'file', content: file, name: file.name };
  }
};

// Default export để tránh lỗi TS
export default processFileContent;
