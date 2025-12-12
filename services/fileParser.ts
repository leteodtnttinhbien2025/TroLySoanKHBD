import pdfParse from "pdf-parse-browser";

export const getTextFromPdf = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);

  const data = await pdfParse(uint8);

  return data.text || "";
};
