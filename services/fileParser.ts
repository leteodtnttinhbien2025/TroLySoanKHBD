export const getTextFromPdf = async (file: File): Promise<string> => {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.js");
  const pdfWorker = await import("pdfjs-dist/legacy/build/pdf.worker.js");

  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let text = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    text += content.items
      .map((i: any) => ("str" in i ? i.str : ""))
      .join(" ") + "\n";
  }

  return text;
};
