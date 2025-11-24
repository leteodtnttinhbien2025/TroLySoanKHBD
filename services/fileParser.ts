import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import * as mammoth from 'mammoth';

/**
 * Set workerSrc để PDF.js load worker script từ CDN
 */
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

/**
 * Extract text content from a PDF file
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
 * Extract raw text from DOCX file
 * @param file DOCX file
 * @returns extracted text
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
 * Process a file: extract text if PDF/DOCX, else return file directly
 * @param file file to process
 * @returns ProcessedFile object
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

    // Fallback for other file types (images, .doc, etc.)
    return { type: 'file', content: file, name: file.name };
  } catch (error) {
    console.error(`Error processing file ${file.name}:`, error);
    return { type: 'file', content: file, name: file.name };
  }
};
