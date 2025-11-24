import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { LessonPlanData } from '../types';
import { generateLessonPlan } from '../services/geminiService';
import GeneratedPlan from './GeneratedPlan';
import FileUpload from './FileUpload';
import { SpinnerIcon, DocumentIcon } from './icons';

const SectionDivider: React.FC<{ title: string; subtitle: string; }> = ({ title, subtitle }) => (
  <div className="relative pt-8">
    <div className="absolute inset-0 flex items-center" aria-hidden="true">
      <div className="w-full border-t border-gray-200" />
    </div>
    <div className="relative flex justify-start">
       <span className="bg-white pr-3 text-lg font-medium text-gray-900">{title}</span>
    </div>
    <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
  </div>
);

const teachingMethods = [
  "Thuyết trình - Gợi mở - Vấn đáp",
  "Hoạt động nhóm",
  "Dạy học giải quyết vấn đề",
  "Dạy học theo dự án",
  "Dạy học khám phá",
  "Học tập qua trải nghiệm",
  "Lớp học đảo ngược (Flipped Classroom)",
  "Học tập hợp tác (Cooperative learning)",
  "Kỹ thuật các mảnh ghép (Jigsaw)",
  "Kỹ thuật khăn trải bàn",
  "Sơ đồ tư duy (Mind mapping)",
  "Bàn tay nặn bột",
  "Dạy học theo góc (Learning stations)",
  "Dạy học theo hợp đồng",
];


const LessonPlanForm: React.FC = () => {
  const [formData, setFormData] = useState<LessonPlanData>({
    topic: '',
    subject: '',
    grade: '',
    duration: '',
    textbook: '',
    school: '',
    department: '',
    teacherName: '',
    teachingMethod: [],
    cognitiveLevel: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [generatedPlan, setGeneratedPlan] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isMethodDropdownOpen, setMethodDropdownOpen] = useState(false);
  const methodDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (methodDropdownRef.current && !methodDropdownRef.current.contains(event.target as Node)) {
        setMethodDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  }, []);

  const handleTeachingMethodChange = useCallback((method: string) => {
    setFormData(prevData => {
      const currentMethods = prevData.teachingMethod || [];
      const newMethods = currentMethods.includes(method)
        ? currentMethods.filter(m => m !== method)
        : [...currentMethods, method];
      return { ...prevData, teachingMethod: newMethods };
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setGeneratedPlan('');
    setError(null);
    setLoadingMessage('Đang khởi tạo...'); // Initial loading message
    try {
      const stream = generateLessonPlan(formData, files, setLoadingMessage);
      for await (const chunk of stream) {
        setGeneratedPlan(prevPlan => prevPlan + chunk);
      }
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleReset = useCallback(() => {
    setFormData({
      topic: '',
      subject: '',
      grade: '',
      duration: '',
      textbook: '',
      school: '',
      department: '',
      teacherName: '',
      teachingMethod: [],
      cognitiveLevel: '',
    });
    setFiles([]);
    setGeneratedPlan('');
    setError(null);
  }, []);

  const isTextbookRequired = files.length === 0;
  const inputStyles = "w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150 ease-in-out disabled:bg-gray-50";

  return (
    <div className="bg-white shadow-xl rounded-lg p-8">
       <div className="mb-8 text-center">
         <h2 className="text-2xl font-bold text-gray-900">
          1. Nhập thông tin Kế hoạch bài dạy
        </h2>
        <p className="mt-2 text-gray-600">Điền thông tin bắt buộc ở các trường có dấu <span className="text-red-600 font-bold">*</span></p>
       </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset disabled={isLoading} className="space-y-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
              Bài/Chủ đề <span className="text-red-600">*</span>
              </label>
              <input
              type="text"
              id="topic"
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              className={inputStyles}
              placeholder="Ví dụ: Quang hợp ở thực vật"
              required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Môn học <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className={inputStyles}
                  placeholder="Ví dụ: Sinh học"
                  required
                />
              </div>
              <div>
                <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">
                  Lớp <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="grade"
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  className={inputStyles}
                  placeholder="Ví dụ: Lớp 11"
                  required
                />
              </div>
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                  Thời gian thực hiện <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className={inputStyles}
                  placeholder="Ví dụ: 2 tiết"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="textbook" className="block text-sm font-medium text-gray-700 mb-1">
              Bộ sách giáo khoa sử dụng {isTextbookRequired && <span className="text-red-600">*</span>}
              </label>
              <select
              id="textbook"
              name="textbook"
              value={formData.textbook}
              onChange={handleChange}
              className={inputStyles}
              required={isTextbookRequired}
              >
              <option value="">-- Chọn bộ sách --</option>
              <option value="Kết nối tri thức với cuộc sống">Kết nối tri thức với cuộc sống</option>
              <option value="Chân trời sáng tạo">Chân trời sáng tạo</option>
              <option value="Cánh diều">Cánh diều</option>
              <option value="Sách giáo khoa khác (nêu trong tài liệu)">Sách giáo khoa khác (nêu trong tài liệu)</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {isTextbookRequired 
                  ? "Bắt buộc nếu không có tài liệu tham khảo đính kèm."
                  : "Không bắt buộc khi đã có tài liệu tham khảo."
                }
              </p>
            </div>
          </div>
          
          <FileUpload files={files} setFiles={setFiles} setError={setError} />

          <div className="space-y-6">
            <SectionDivider 
              title="Tùy chọn nâng cao" 
              subtitle="Lựa chọn phương pháp và mức độ nhận thức để AI tạo ra kế hoạch bài dạy phù hợp hơn."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div ref={methodDropdownRef}>
                  <label htmlFor="teachingMethod" className="block text-sm font-medium text-gray-700 mb-1">
                    Phương pháp dạy học (chọn một hoặc nhiều)
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      className={`${inputStyles} text-left flex justify-between items-center`}
                      onClick={() => setMethodDropdownOpen(prev => !prev)}
                      aria-haspopup="listbox"
                      aria-expanded={isMethodDropdownOpen}
                    >
                      <span className="truncate">
                        {formData.teachingMethod && formData.teachingMethod.length > 0
                          ? `${formData.teachingMethod.length} phương pháp đã chọn`
                          : "Chọn phương pháp dạy học..."}
                      </span>
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {isMethodDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                        {teachingMethods.map(method => (
                          <div
                            key={method}
                            className="text-gray-900 cursor-default select-none relative py-2 pl-3 pr-9 hover:bg-indigo-50"
                          >
                            <label className="flex items-center space-x-3 cursor-pointer">
                              <input
                                type="checkbox"
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                checked={formData.teachingMethod?.includes(method)}
                                onChange={() => handleTeachingMethodChange(method)}
                              />
                              <span className="font-normal block truncate">{method}</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label htmlFor="cognitiveLevel" className="block text-sm font-medium text-gray-700 mb-1">
                    Mức độ nhận thức (Thang Bloom)
                  </label>
                  <select
                    id="cognitiveLevel"
                    name="cognitiveLevel"
                    value={formData.cognitiveLevel}
                    onChange={handleChange}
                    className={inputStyles}
                  >
                    <option value="">Mặc định</option>
                    <option value="Nhận biết">Nhận biết</option>
                    <option value="Thông hiểu">Thông hiểu</option>
                    <option value="Vận dụng">Vận dụng</option>
                    <option value="Vận dụng cao">Vận dụng cao</option>
                  </select>
                </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <SectionDivider 
              title="Thông tin bổ sung"
              subtitle="Bổ sung thông tin trường, tổ, và tên giáo viên để hiển thị trên đầu kế hoạch bài dạy."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-1">
                  Trường
                </label>
                <input
                  type="text"
                  id="school"
                  name="school"
                  value={formData.school}
                  onChange={handleChange}
                  className={inputStyles}
                  placeholder="Ví dụ: THPT Chuyên KHTN"
                />
              </div>
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                  Tổ chuyên môn
                </label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className={inputStyles}
                  placeholder="Ví dụ: Tổ Hóa học"
                />
              </div>
            </div>
            <div>
              <label htmlFor="teacherName" className="block text-sm font-medium text-gray-700 mb-1">
                Họ và tên giáo viên
              </label>
              <input
                type="text"
                id="teacherName"
                name="teacherName"
                value={formData.teacherName}
                onChange={handleChange}
                className={inputStyles}
                placeholder="Ví dụ: Nguyễn Văn A"
              />
            </div>
          </div>

          <div className="flex justify-end items-center pt-6 border-t border-gray-200 gap-4">
            <button
              type="button"
              onClick={handleReset}
              disabled={isLoading}
              className="px-6 py-2 border border-gray-300 text-gray-700 font-semibold rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Nhập lại
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <SpinnerIcon className="mr-2" />
                  <span>Đang tạo...</span>
                </>
              ) : (
                'Tạo kế hoạch'
              )}
            </button>
          </div>
        </fieldset>
      </form>

      {error && (
        <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md" role="alert">
          <p><strong>Lỗi:</strong> {error}</p>
        </div>
      )}

      <div className="mt-12">
         <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
                2. Kế hoạch bài dạy chi tiết
            </h2>
         </div>
        {isLoading && !generatedPlan ? (
          <div className="flex flex-col justify-center items-center p-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <SpinnerIcon className="text-indigo-600 h-8 w-8" />
            <p className="mt-4 text-gray-600">{loadingMessage}</p>
          </div>
        ) : generatedPlan ? (
          <GeneratedPlan planContent={generatedPlan} />
        ) : (
          <div className="text-center p-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <DocumentIcon />
            <p className="mt-4 text-gray-500">Kế hoạch bài dạy sẽ được hiển thị ở đây sau khi bạn điền thông tin và nhấn "Tạo kế hoạch".</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonPlanForm;