import { GoogleGenAI, Part } from "@google/genai";
import type { LessonPlanData } from '../types';
// FIX 1: Import hàm processFileContent dưới dạng default import
import processFileContent from './fileParser'; 
// FIX 2: Import kiểu dữ liệu ProcessedFile dưới dạng named import
import { ProcessedFile } from './fileParser'; 

// Khởi tạo GoogleGenAI với API key đã định nghĩa
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! }); 

// Hàm hỗ trợ chuyển đổi tệp thành định dạng GenerativePart (Base64)
const fileToGenerativePart = async (file: File): Promise<Part> => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};


export const generateLessonPlan = async function* (
  data: LessonPlanData,
  files: File[],
  onStatusChange: (status: string) => void
): AsyncGenerator<string> {
  const { topic, subject, grade, duration, textbook, school, department, teacherName, teachingMethod, cognitiveLevel } = data;

  let textContents = '';
  let filesForUpload: File[] = [];

  if (files.length > 0) {
    onStatusChange('Đang phân tích tài liệu đính kèm...');
    // FIX 3 (TS2345): Sử dụng ProcessedFile[] làm kiểu dữ liệu rõ ràng
    const processedFiles: ProcessedFile[] = await Promise.all(files.map(processFileContent));
    
    // Lọc nội dung văn bản (text)
    textContents = processedFiles
      .filter((f): f is (ProcessedFile & { type: 'text' }) => f.type === 'text')
      .map(f => `--- NỘI DUNG TỪ TỆP: ${f.name} ---\n${f.content}\n--- KẾT THÚC NỘI DUNG TỪ TỆP: ${f.name} ---`)
      .join('\n\n');

    // Lọc các tệp còn lại (file) để upload lên API
    filesForUpload = processedFiles
      .filter((f): f is (ProcessedFile & { type: 'file' }) => f.type === 'file')
      .map(f => f.content as File);
  }

  onStatusChange('AI đang soạn giáo án, vui lòng chờ...');

  // --- LOGIC XÂY DỰNG PROMPT (giữ nguyên để tập trung vào logic build/ts) ---
  let headerInfoBlock = '';
  if (school || department || teacherName) {
      headerInfoBlock += '```document_header\n';
      if (school) headerInfoBlock += `**Trường:** ${school}\n`;
      if (department) headerInfoBlock += `**Tổ:** ${department}\n`;
      if (teacherName) headerInfoBlock += `**Họ và tên giáo viên:** ${teacherName}\n`;
      headerInfoBlock += '```\n';
  } else {
      headerInfoBlock = `**Trường:** …………………\n**Tổ:** …………………\n**Họ và tên giáo viên:** …………………`;
  }

  const formattedDuration = /^\d+$/.test(duration.trim()) ? `${duration.trim()} tiết` : duration;
  const formattedTeachingMethods = teachingMethod && teachingMethod.length > 0 ? teachingMethod.join(', ') : 'Tích hợp nhiều phương pháp';

  let cognitiveLevelInstruction = '';
  if (cognitiveLevel) {
    cognitiveLevelInstruction = `
**LƯU Ý VỀ MỨC ĐỘ NHẬN THỨC:** Mức độ nhận thức được yêu cầu là "${cognitiveLevel}". Bạn BẮT BUỘC phải thể hiện rõ mức độ này trong KHBD:
- **Phần "I. MỤC TIÊU":** Sử dụng các động từ hành động tương ứng với thang Bloom cho mức độ đã chọn.
- **Phần "III. TIẾN TRÌNH DẠY HỌC":** Các nhiệm vụ, câu hỏi và sản phẩm phải có độ khó và phức tạp tương ứng với mức độ nhận thức đã chọn.
`;
  }

  const appendixInstruction = `
**LƯU Ý VỀ PHỤ LỤC:**
1. Nếu bạn liệt kê các tài liệu như "Phiếu học tập" trong mục "II. THIẾT BỊ DẠY HỌC", bạn BẮT BUỘC phải soạn thảo nội dung chi tiết cho các tài liệu đó và đưa vào mục "IV. PHỤ LỤC".
2. Mỗi phụ lục phải được đánh số rõ ràng (ví dụ: PHỤ LỤC 1: PHIẾU HỌC TẬP SỐ 1).
`;

  const promptText = `
Bạn là một chuyên gia biên soạn Kế hoạch bài dạy (KHBD).
Nhiệm vụ của bạn là phân tích nội dung từ các tệp tài liệu được đính kèm và/hoặc nội dung văn bản được trích xuất dưới đây để soạn thảo một KHBD hoàn chỉnh, tuân thủ tuyệt đối cấu trúc của Phụ lục IV – Công văn 5512/BGDĐT-GDTrH.
Toàn bộ nội dung trong KHBD bạn tạo ra phải được lấy từ tài liệu tham khảo đã cung cấp.

---

**THÔNG TIN BÀI DẠY:**
- **Tên bài dạy:** ${topic}
- **Môn học:** ${subject}; **Lớp:** ${grade}
- **Thời lượng:** ${formattedDuration}
- **Sách giáo khoa sử dụng:** ${textbook || 'Không chỉ định'}
- **Các phương pháp dạy học được sử dụng:** ${formattedTeachingMethods}
- **Mức độ nhận thức cần đạt:** ${cognitiveLevel || 'Theo chương trình chuẩn'}

---

**TÀI LIỆU THAM KHẢO:**

${textContents ? `**A. NỘI DUNG VĂN BẢN ĐÃ ĐƯỢC TRÍCH XUẤT TỪ TỆP:**\n${textContents}` : '**A. NỘI DUNG VĂN BẢN:** Không có nội dung văn bản được trích xuất.'}

**B. CÁC TỆP ĐÍNH KÈM (Dành cho phân tích multimodal):** ${filesForUpload.length > 0 ? filesForUpload.map(f => f.name).join(', ') : 'Không có.'}

---

📌 **YÊU CẦU NỘI DUNG**

Bạn phải biên soạn hoàn chỉnh Kế hoạch bài dạy theo đúng cấu trúc sau. 
**LƯU Ý QUAN TRỌNG VỀ PHƯƠNG PHÁP DẠY HỌC:** Khi xây dựng "III. TIẾN TRÌNH DẠY HỌC", bạn BẮT BUỘC phải thiết kế các bước và hoạt động sao cho thể hiện rõ việc áp dụng các phương pháp dạy học đã được liệt kê.
${cognitiveLevelInstruction}
${appendixInstruction}

---

**KHUNG KẾ HOẠCH BÀI DẠY (PHỤ LỤC IV – CV 5512)**
${headerInfoBlock}

**TÊN BÀI DẠY:** ${topic.toUpperCase()}
**Môn học:** ${subject}; **Lớp:** ${grade}
**Thời gian thực hiện:** ${formattedDuration}

**I. MỤC TIÊU**
**1. Về kiến thức**
**2. Về năng lực**
**Năng lực chung:** **Năng lực đặc thù môn học:** **3. Về phẩm chất**

**II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU**
**1. Đối với giáo viên:**
**2. Đối với học sinh:**

**III. TIẾN TRÌNH DẠY HỌC**

**1. Hoạt động 1: Mở đầu (Khởi động)**
**a) Mục tiêu:**
**b) Nội dung:**
**c) Sản phẩm:**
**d) Tổ chức thực hiện:**
| Hoạt động của GV và HS | Dự kiến sản phẩm |
| :--- | :--- |
| **Chuyển giao nhiệm vụ:** | |
| **Thực hiện nhiệm vụ:** | |
| **Báo cáo, thảo luận:** | |
| **Kết luận, nhận định:** | |

**2. Hoạt động 2: Hình thành kiến thức mới**
**Hoạt động 2.1: [Tên nội dung kiến thức 1] (Tiết ...)**
**a) Mục tiêu:**
**b) Nội dung:**
**c) Sản phẩm:**
**d) Tổ chức thực hiện:**
| Hoạt động của GV và HS | Dự kiến sản phẩm |
| :--- | :--- |
| **Chuyển giao nhiệm vụ:** | |
| **Thực hiện nhiệm vụ:** | |
| **Báo cáo, thảo luận:** | |
| **Kết luận, nhận định:** | |

**3. Hoạt động 3: Luyện tập**
**a) Mục tiêu:**
**b) Nội dung:**
**c) Sản phẩm:**
**d) Tổ chức thực hiện:**
| Hoạt động của GV và HS | Dự kiến sản phẩm |
| :--- | :--- |
| **Chuyển giao nhiệm vụ:** | |
| **Thực hiện nhiệm vụ:** | |
| **Báo cáo, thảo luận:** | |
| **Kết luận, nhận định:** | |

**4. Hoạt động 4: Vận dụng**
**a) Mục tiêu:**
**b) Nội dung:**
**c) Sản phẩm:**
**d) Tổ chức thực hiện:**
| Hoạt động của GV và HS | Dự kiến sản phẩm |
| :--- | :--- |
| **Chuyển giao nhiệm vụ:** | |
| **Thực hiện nhiệm vụ:** | |
| **Báo cáo, thảo luận:** | |
| **Kết luận, nhận định:** | |

**5. Hoạt động 5: Mở rộng (Tổng kết)**
**a) Mục tiêu:**
**b) Nội dung:**
**c) Sản phẩm:**
**d) Tổ chức thực hiện:**
| Hoạt động của GV và HS | Dự kiến sản phẩm |
| :--- | :--- |
| **Chuyển giao nhiệm vụ:** | |
| **Thực hiện nhiệm vụ:** | |
| **Báo cáo, thảo luận:** | |
| **Kết luận, nhận định:** | |

**IV. PHỤ LỤC** *(Nếu có)*

---
`;

  const model = 'gemini-2.5-flash';

  try {
    const fileParts = await Promise.all(filesForUpload.map(fileToGenerativePart));
    const allParts: Part[] = [{ text: promptText }, ...fileParts];
    
    const responseStream = await ai.models.generateContentStream({ model, contents: [{ parts: allParts }] });
    
    for await (const chunk of responseStream) {
      yield chunk.text;
    }

  } catch (error: unknown) {
    console.error("Lỗi khi gọi Gemini API:", error);
    if (error instanceof Error && error.message) {
      throw new Error(`Không thể tạo kế hoạch bài dạy. Lỗi từ API: ${error.message}`);
    }
    throw new Error("Không thể tạo kế hoạch bài dạy do một lỗi không xác định.");
  }
};
