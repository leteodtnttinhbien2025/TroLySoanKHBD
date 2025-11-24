import * as pdfjsLib from 'pdfjs-dist';
import * as mammoth from 'mammoth';

// It is crucial to set the workerSrc to ensure PDF.js can load its worker script.
// This path should point to the worker file hosted on a CDN.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

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
    textContent += text.items.map(item => ('str' in item ? item.str : '')).join(' ') + '\n';
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

// Export Type as Named Export
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
    // If parsing fails for any reason, fall back to returning the file object
    return { type: 'file', content: file, name: file.name };
  }
};

// FIX CỐ ĐỊNH: Thêm default export cho hàm
export default processFileContent;
