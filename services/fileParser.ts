import pdfParse from "pdf-parse-browser";
import * as mammoth from "mammoth";

export type ProcessedFile = {
  type: "text" | "file";
  content: string | File;
  name: string;
};

const getTextFromPdf = async (file: File): Promise<string> => {
  try {
    const buffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(buffer);

    const data = await pdfParse(uint8);
    return data.text || "";
  } catch (error) {
    console.error("Lỗi đọc PDF:", error);
    return "";
  }
};

const getTextFromDocx = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value || "";
  } catch (error) {
    console.error("Lỗi đọc DOCX:", error);
    return "";
  }
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

    // Không nằm trong PDF / DOCX → để nguyên file
    return { type: "file", content: file, name: file.name };
  } catch (error) {
    console.error(`Lỗi khi xử lý tệp ${file.name}:`, error);
    return { type: "file", content: file, name: file.name };
  }
};

export default processFileContent;
