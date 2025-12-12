import pdfParse from "pdf-parse-browser";
import * as mammoth from "mammoth";

export type ProcessedFile = {
  type: "text" | "file";
  content: string | File;
  name: string;
};

const getTextFromPdf = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const uint8 = new Uint8Array(buffer);

  const data = await pdfParse(uint8);
  return data.text || "";
};

const getTextFromDocx = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

export const processFileContent = async (file: File): Promise<ProcessedFile> => {
  try {
    if (file.type === "application/pdf") {
      const text = await getTextFromPdf(file);
      return { type: "text", content: text, name: file.name };
    }

    if (
      file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const text = await getTextFromDocx(file);
      return { type: "text", content: text, name: file.name };
    }

    return { type: "file", content: file, name: file.name };
  } catch (error) {
    console.error(`Lỗi khi xử lý tệp ${file.name}:`, error);
    return { type: "file", content: file, name: file.name };
  }
};

export default processFileContent;
