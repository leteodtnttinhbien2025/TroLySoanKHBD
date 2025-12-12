const getTextFromPdf = async (file: File): Promise<string> => {
  // Import ES module chính xác từ pdfjs-dist
  const pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');
  const worker = await import('pdfjs-dist/build/pdf.worker.mjs?worker');

  pdfjsLib.GlobalWorkerOptions.workerSrc = worker.default;

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  let text = '';

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    text +=
      content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ') + '\n';
  }

  return text;
};
