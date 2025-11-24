import { GoogleGenAI, Part } from "@google/genai";
import type { LessonPlanData } from '../types';
// FIX: Import hàm (value) là named export
import { processFileContent } from './fileParser'; 
// FIX: Import kiểu dữ liệu (type) một cách tường minh
import type { ProcessedFile } from "./fileParser";

// It's recommended to initialize GoogleGenAI only once.
// SỬA LỖI API KEY: Sử dụng GEMINI_API_KEY phù hợp với cấu hình Vite
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// Helper function to convert a file to a GenerativePart
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
    // FIX: Sử dụng processFileContent trực tiếp
    const processedFiles: ProcessedFile[] = await Promise.all(files.map(processFileContent));
    
    // Khai báo kiểu cho biến f
    textContents = processedFiles
      .filter((f): f is (ProcessedFile & { type: 'text' }) => f.type === 'text')
      .map(f => `--- NỘI DUNG TỪ TỆP: ${f.name} ---\n${f.content}\n--- KẾT THÚC NỘI DUNG TỪ TỆP: ${f.name} ---`)
      .join('\n\n');

    // Khai báo kiểu cho biến f
    filesForUpload = processedFiles
      .filter((f): f is (ProcessedFile & { type: 'file' }) => f.type === 'file')
      .map(f => f.content as File);
  }

  onStatusChange('AI đang soạn giáo án, vui lòng chờ...');

  // This block conditionally creates header info to avoid duplication in the final output.
  let headerInfoBlock = '';
  if (school || department || teacherName) {
      // Use a custom markdown block that the frontend can parse for special styling.
      headerInfoBlock += '```document_header\n';
      if (school) headerInfoBlock += `**Trường:** ${school}\n`;
      if (department) headerInfoBlock += `**Tổ:** ${department}\n`;
      if (teacherName) headerInfoBlock += `**Họ và tên giáo viên:** ${teacherName}\n`;
      headerInfoBlock += '```\n';
  } else {
      // If no info is provided, use standard placeholders.
      headerInfoBlock = `**Trường:** …………………\n**Tổ:** …………………\n**Họ và tên giáo viên:** …………………`;
  }

  // Append "tiết" to duration if it's a number to ensure consistency.
  const formattedDuration = /^\d+$/.test(duration.trim()) ? `${duration.trim()} tiết` : duration;
  
  const formattedTeachingMethods = teachingMethod && teachingMethod.length > 0
    ? teachingMethod.join(', ')
    : 'Tích hợp nhiều phương pháp';

  let cognitiveLevelInstruction = '';
  if (cognitiveLevel) {
    cognitiveLevelInstruction = `
**LƯU Ý VỀ MỨC ĐỘ NHẬN THỨC:** Mức độ nhận thức được yêu cầu là "${cognitiveLevel}". Bạn BẮT BUỘC phải thể hiện rõ mức độ này trong KHBD:
- **Phần "I. MỤC TIÊU":** Sử dụng các động từ hành động tương ứng với thang Bloom cho mức độ đã chọn. Ví dụ:
    - Nhận biết: trình bày, nêu, liệt kê...
    - Thông hiểu: giải thích, phân biệt, so sánh...
    - Vận dụng: áp dụng, giải quyết, thực hiện...
    - Vận dụng cao: phân tích, đánh giá, sáng tạo, thiết kế...
- **Phần "III. TIẾN TRÌNH DẠY HỌC":** Các nhiệm vụ, câu hỏi và sản phẩm trong các hoạt động phải có độ khó và phức tạp tương ứng với mức độ nhận thức đã chọn.
`;
  }

  const appendixInstruction = `
**LƯU Ý VỀ PHỤ LỤC:**
1.  Nếu trong mục "II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU", bạn có liệt kê các tài liệu như "Phiếu học tập", "Bài tập",... bạn BẮT BUỘC phải soạn thảo nội dung chi tiết cho các tài liệu đó và đưa vào mục "IV. PHỤ LỤC".
2.  Mỗi phụ lục phải được đánh số rõ ràng (ví dụ: PHỤ LỤC 1: PHIẾU HỌC TẬP SỐ 1).
3.  Trong các bảng "d) Tổ chức thực hiện" của các hoạt động, bạn phải ghi rõ thời điểm sử dụng các phụ lục này. Ví dụ: "GV phát cho mỗi nhóm một Phiếu học tập số 1 (xem Phụ lục 1)".
`;


  // A new, more structured prompt that separates extracted text from file attachments.
  const promptText = `
Bạn là một chuyên gia biên soạn Kế hoạch bài dạy (KHBD).
Nhiệm vụ của bạn là phân tích nội dung từ các tệp tài liệu được đính kèm và/hoặc nội dung văn bản được trích xuất dưới đây để soạn thảo một KHBD hoàn chỉnh, tuân thủ tuyệt đối cấu trúc của Phụ lục IV – Công văn 5512/BGDĐT-GDTrH.
Toàn bộ nội dung trong KHBD bạn tạo ra phải được lấy từ tài liệu tham khảo đã cung cấp. Không tự ý thêm, bớt hay thay đổi cấu trúc đã cho.

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

**B. CÁC TỆP ĐÍNH KÈM (Dành cho việc phân tích hình ảnh, biểu đồ hoặc các tệp không thể trích xuất văn bản):** ${filesForUpload.length > 0 ? filesForUpload.map(f => f.name).join(', ') : 'Không có.'}

---

📌 **YÊU CẦU NỘI DUNG**

Bạn phải biên soạn hoàn chỉnh Kế hoạch bài dạy theo đúng cấu trúc sau. Toàn bộ nội dung (mục tiêu, kiến thức, hoạt động) PHẢI được xây dựng dựa trên tài liệu đã cung cấp (ưu tiên mục A, sau đó tham khảo mục B cho các yếu tố phi văn bản).

**LƯU Ý QUAN TRỌNG VỀ PHƯƠNG PHÁP DẠY HỌC:** Khi xây dựng "III. TIẾN TRÌNH DẠY HỌC", đặc biệt là cột "Hoạt động của GV và HS" trong các bảng "d) Tổ chức thực hiện", bạn BẮT BUỘC phải thiết kế các bước và hoạt động sao cho thể hiện rõ việc áp dụng các phương pháp dạy học đã được liệt kê ở trên. Ví dụ, nếu chọn "Dạy học theo dự án", cần có các bước giao dự án, thực hiện, báo cáo sản phẩm. Nếu chọn "Hoạt động nhóm", phải mô tả rõ việc chia nhóm, giao nhiệm vụ cho nhóm.
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
(Trình bày đúng yêu cầu cần đạt của bài học theo chương trình, dựa trên tài liệu đính kèm.)

**2. Về năng lực**
**Năng lực chung:** (Liệt kê các năng lực chung được hình thành)
**Năng lực đặc thù môn học:** (Liệt kê các năng lực đặc thù được hình thành)

**3. Về phẩm chất**
(Ghi đúng hành vi – thái độ cần hình thành phù hợp bài học)

**II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU**
**1. Đối với giáo viên:**
(Liệt kê đầy đủ thiết bị, học liệu GV cần chuẩn bị)
**2. Đối với học sinh:**
(Liệt kê đầy đủ học liệu HS cần chuẩn bị)

**III. TIẾN TRÌNH DẠY HỌC**

**1. Hoạt động 1: Mở đầu (Khởi động)**
**a) Mục tiêu:**
**b) Nội dung:**
**c) Sản phẩm:**
**d) Tổ chức thực hiện:**
(Gợi ý câu trả lời, sản phẩm học tập, kết quả thảo luận, bài làm dự kiến của HS cho các nhiệm vụ.)
| Hoạt động của GV và HS | Dự kiến sản phẩm |
| :--- | :--- |
| **Chuyển giao nhiệm vụ:** | |
| **Thực hiện nhiệm vụ:** | |
| **Báo cáo, thảo luận:** | |
| **Kết luận, nhận định:** | |

**2. Hoạt động 2: Hình thành kiến thức mới**
*(Dựa vào nội dung tài liệu, chia thành các hoạt động nhỏ (2.1, 2.2,...) tương ứng với các đơn vị kiến thức và phân bổ theo từng tiết học.)*
**Hoạt động 2.1: [Tên nội dung kiến thức 1] (Tiết ...)**
**a) Mục tiêu:**
**b) Nội dung:**
**c) Sản phẩm:**
**d) Tổ chức thực hiện:**
(Gợi ý câu trả lời, sản phẩm học tập, kết quả thảo luận, bài làm dự kiến của HS cho các nhiệm vụ.)
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
(Gợi ý câu trả lời, sản phẩm học tập, kết quả thảo luận, bài làm dự kiến của HS cho các nhiệm vụ.)
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
(Gợi ý câu trả lời, sản phẩm học tập, kết quả thảo luận, bài làm dự kiến của HS cho các nhiệm vụ.)
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
(Gợi ý câu trả lời, sản phẩm học tập, kết quả thảo luận, bài làm dự kiến của HS cho các nhiệm vụ.)
| Hoạt động của GV và HS | Dự kiến sản phẩm |
| :--- | :--- |
| **Chuyển giao nhiệm vụ:** | |
| **Thực hiện nhiệm vụ:** | |
| **Báo cáo, thảo luận:** | |
| **Kết luận, nhận định:** | |

**IV. PHỤ LỤC** *(Nếu có)*
(Trình bày nội dung các phiếu học tập, bài tập, hoặc tài liệu tham khảo bổ sung có trong tài liệu đính kèm)

---

📌 **QUY ĐỊNH BẮT BUỘC**
1. Không thay đổi bất kỳ tên mục nào trong mẫu trên.
2. Mỗi hoạt động phải có đủ 4 phần: a, b, c, d.
3. Mục d luôn phải trình bày đúng dạng bảng 2 cột.
4. Ngôn ngữ rõ ràng, chuẩn giáo dục.
5. Không viết lời thoại của GV và HS, chỉ mô tả hoạt động.
6. **CHỈ THỊ QUAN TRỌNG NHẤT:** Bạn phải tuân thủ nghiêm ngặt và tuyệt đối mẫu kế hoạch này. Không được tự ý thay đổi, thêm, bớt hoặc diễn giải khác đi bất kỳ mục nào khi chưa có yêu cầu cụ thể từ người dùng. Mọi chỉnh sửa phải chính xác theo yêu cầu, không được sáng tạo ngoài lề.
7. Cột 'Dự kiến sản phẩm' trong các bảng tổ chức thực hiện phải chứa gợi ý câu trả lời, sản phẩm học tập, kết quả thảo luận, bài làm dự kiến của học sinh cho các nhiệm vụ được giao.
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
    // Propagate a more specific error message to the user for better diagnosis,
    // instead of showing a generic message or attempting to parse the error string.
    if (error instanceof Error && error.message) {
      throw new Error(`Không thể tạo kế hoạch bài dạy. Lỗi từ API: ${error.message}`);
    }
    // Fallback for non-standard errors.
    throw new Error("Không thể tạo kế hoạch bài dạy do một lỗi không xác định. Vui lòng kiểm tra console để biết thêm chi tiết.");
  }
};
