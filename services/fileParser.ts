import * as mammoth from 'mammoth';

/**
 * Dynamic import PDF.js legacy build to avoid Vite Rollup build issues
 */
const getPdfJs = async () => {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf'); // dùng legacy build
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.js';
  return pdfjsLib;
};

/**
 * Extracts text content from a given PDF file.
 * @param file The PDF file to process.
 * @returns A promise that resolves to the extracted text.
 */
const getTextFromPdf = async (file: File): Promise<string> => {
  const pdfjsLib = await getPdfJs();
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

    if (
      file.type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const text = await getTextFromDocx(file);
      return { type: 'text', content: text, name: file.name };
    }

    // Fallback for unsupported types
    return { type: 'file', content: file, name: file.name };
  } catch (error) {
    console.error(`Lỗi khi xử lý tệp ${file.name}:`, error);
    return { type: 'file', content: file, name: file.name };
  }
};
