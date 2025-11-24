// Chỉ định chính xác tệp module chính (.mjs)
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs'; 
// Import tệp worker module
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs';
import * as mammoth from 'mammoth';

// Sử dụng biến worker đã được Vite xử lý, thay vì URL CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Extracts text content from a given PDF file.
 * @param file The PDF file to process.
 * @returns A promise that resolves to the extracted text.
 */
const getTextFromPdf = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  // The type casting is necessary because the library's types might not be perfectly aligned.
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let textContent = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const text = await page.getTextContent();
    // The 'str' property exists on TextItem objects.
    textContent += text.items.map((item: any) => ('str' in item ? item.str : '')).join(' ') + '\n';
  }
  return textContent;
};

/**
 * Extracts raw text content from a given DOCX file.
 * @param file The DOCX file to process.
 * @returns A promise that resolves to the extracted text.
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
 * Processes a file to extract text if it's a supported format (PDF, DOCX),
 * otherwise returns the file object for direct upload.
 * @param file The file to process.
 * @returns A promise that resolves to a ProcessedFile object.
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
    // For other file types (images, .doc), return the file for multimodal processing.
    return { type: 'file', content: file, name: file.name };
  } catch (error) {
    console.error(`Lỗi khi xử lý tệp ${file.name}:`, error);
    // If parsing fails for any reason, fall back to sending the file directly.
    // This provides a robust fallback mechanism.
    return { type: 'file', content: file, name: file.name };
  }
};
