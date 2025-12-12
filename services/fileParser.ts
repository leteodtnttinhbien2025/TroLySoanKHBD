const getTextFromPdf = async (file: File): Promise<string> => {
  // Import đúng bản PDF.js hỗ trợ bundler
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');
  const pdfWorker = await import('pdfjs-dist/legacy/build/pdf.worker.js');

  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker.default;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let textContent = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const text = await page.getTextContent();

    textContent += text.items
      .map(item => ('str' in item ? item.str : ''))
      .join(' ') + '\n';
  }

  return textContent;
};
