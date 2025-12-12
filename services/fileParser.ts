// Import đúng cho pdfjs-dist (legacy build)
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.js';

// mammoth dùng đúng bản browser
import * as mammoth from 'mammoth';

// Gán workerSrc cho PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// Kiểu dữ liệu cho file đã xử lý
export type ProcessedFile = {
  type: 'text' | 'file';
  content: string | File;
  name: string;
};

/**
 * Trích xuất nội dung văn bản từ tệp PDF.
 */
const getTextFromPdf = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();

  // Lấy tài liệu PDF
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let textContent = '';

  // Duyệt trang
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const text = await page.getTextContent();
    textContent += text.items
      .map(item => ('str' in item ? item.str : ''))
      .join(' ')
      + '\n';
  }
  return textContent;
};

/**
 * DOCX → text bằng mammoth
 */
const getTextFromDocx = async (file: File): Promise<string> => {
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

    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
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

// Default export để tránh TS lỗi
export default processFileContent;
