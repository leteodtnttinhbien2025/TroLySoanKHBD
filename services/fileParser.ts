const getTextFromPdf = async (file: File): Promise<string> => {
  // Import ES module chuẩn cho PDF.js v4.x
  const pdfjsLib = await import('pdfjs-dist');
  const worker = await import('pdfjs-dist/build/pdf.worker?worker');

  pdfjsLib.GlobalWorkerOptions.workerSrc = worker.default;

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
