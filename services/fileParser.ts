// services/fileParser.ts
import * as mammoth from 'mammoth';

// Hàm dynamic import pdfjs
const getPdfJs = async () => {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf');
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.js';
  return pdfjsLib;
};

/**
 * Extract text content from a PDF file
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
 * Extract raw text from a DOCX file
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
 * Process a file: extract text if PDF/DOCX, else return file.
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
    console.error(`Error processing file ${file.name}:`, error);
    return { type: 'file', content: file, name: file.name };
  }
};
