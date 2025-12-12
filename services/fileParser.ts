import * as pdfjsLib from 'pdfjs-dist'; 
import * as mammoth from 'mammoth';

// Khởi tạo Worker cho PDF.js, quan trọng để tránh lỗi trong môi trường trình duyệt.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

// Định nghĩa kiểu dữ liệu cho tệp đã xử lý
export type ProcessedFile = {
  type: 'text' | 'file';
  content: string | File;
  name: string;
};

/**
 * Trích xuất nội dung văn bản từ tệp PDF.
 * @param file Tệp PDF đầu vào.
 * @returns Nội dung văn bản đã trích xuất.
 */
const getTextFromPdf = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  // Lấy tài liệu PDF
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let textContent = '';
  // Duyệt qua từng trang
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const text = await page.getTextContent();
    textContent += text.items.map(item => ('str' in item ? item.str : '')).join(' ') + '\n';
  }
  return textContent;
};

/**
 * Trích xuất nội dung văn bản từ tệp DOCX.
 * @param file Tệp DOCX đầu vào.
 * @returns Nội dung văn bản đã trích xuất.
 */
const getTextFromDocx = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  // mammoth.js xử lý arrayBuffer
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

/**
 * Xử lý tệp: trích xuất văn bản (PDF, DOCX) hoặc trả về tệp gốc.
 * (Named Export)
 * @param file Tệp đầu vào.
 * @returns Object ProcessedFile.
 */
export const processFileContent = async (file: File): Promise<ProcessedFile> => {
  try {
    if (file.type === 'application/pdf') {
      const text = await getTextFromPdf(file);
      return { type: 'text', content: text, name: file.name };
    }
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const text = await getTextFromDocx(file);
      return { type: 'text', content: text, name: file.name };
    }
    // Đối với các loại tệp khác (hình ảnh, audio, v.v.), trả về tệp gốc cho mô hình multimodal.
    return { type: 'file', content: file, name: file.name };
  } catch (error) {
    console.error(`Lỗi khi xử lý tệp ${file.name}:`, error);
    // Xử lý lỗi: nếu không đọc được, vẫn trả về tệp gốc
    return { type: 'file', content: file, name: file.name };
  }
};

// FIX CỐ ĐỊNH: Thêm default export để giải quyết lỗi TS2614
export default processFileContent;
