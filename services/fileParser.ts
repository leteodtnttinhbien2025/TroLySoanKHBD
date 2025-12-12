/**
 * Trích xuất PDF bằng pdfjs-dist (dynamic import để tránh lỗi Vite/Vercel)
 */
const getTextFromPdf = async (file: File): Promise<string> => {
  const pdfjsLib = await import('pdfjs-dist/build/pdf');
  const pdfWorker = await import('pdfjs-dist/legacy/build/pdf.worker.js');

  // pdf.worker cần dùng default export
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker.default;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let textContent = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const text = await page.getTextContent();

    textContent += text.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ') + '\n';
  }

  return textContent;
};
