import * as pdfjsLib from 'pdfjs-dist/build/pdf'; // 🔹 Sửa import cho Vite & Rollup
import * as mammoth from 'mammoth';

// Dùng worker từ CDN để PDF.js load worker script
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';

/**
 * Extract text content from a PDF file.
 * @param file PDF file
 * @returns extracted text
 */
const getTextFromPdf = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let textContent = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const text = await page.getTextContent();
    textContent += text.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ') + '\n';
  }

  return textContent;
};

/**
 * Extract raw text content from a DOCX file.
 * @param file DOCX file
 * @returns extracted text
 */
const getTextFromDocx = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

export type ProcessedFile = {
  type: 'text' | 'file';
  content: string | File;
  name: string;
};

/**
 * Process a file:
 * - Extract text if PDF/DOCX
 * - Otherwise return file object
 */
export const processFileContent = async (
  file: File
): Promise<ProcessedFile> => {
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

    // Fallback for unsupported files
    return { type: 'file', content: file, name: file.name };
  } catch (error) {
    console.error(`Lỗi khi xử lý tệp ${file.name}:`, error);
    return { type: 'file', content: file, name: file.name };
  }
};
