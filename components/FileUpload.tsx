import React, { useState, useCallback, useEffect } from 'react';
import { UploadIcon, TrashIcon, PdfIcon, WordIcon, DocumentIcon, GripVerticalIcon } from './icons';

interface FileUploadProps {
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  setError: (error: string | null) => void;
}

const ACCEPTED_FILES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FileUpload: React.FC<FileUploadProps> = ({ files, setFiles, setError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Handle external file drag and drop (Upload)
  const handleDragEvents = useCallback((e: React.DragEvent, isEntering: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(isEntering);
  }, []);

  const handleFileValidation = useCallback((newFiles: File[]): [File[], string[]] => {
    const validFiles: File[] = [];
    const errors: string[] = [];
    newFiles.forEach(file => {
      if (!Object.keys(ACCEPTED_FILES).includes(file.type)) {
        errors.push(`Tệp "${file.name}" có định dạng không được hỗ trợ.`);
      } else {
        validFiles.push(file);
      }
    });
    return [validFiles, errors];
  }, []);
  
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files) {
      const newFiles = [...e.target.files];
      const [validFiles, validationErrors] = handleFileValidation(newFiles);
      if (validationErrors.length > 0) {
        setError(validationErrors.join(' '));
      }
      setFiles(prev => [...prev, ...validFiles]);
      e.target.value = ''; 
    }
  }, [setError, setFiles, handleFileValidation]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    handleDragEvents(e, false);
    // If we are reordering internally, ignore this drop handler
    if (draggedIndex !== null) return;

    setError(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = [...e.dataTransfer.files];
      const [validFiles, validationErrors] = handleFileValidation(newFiles);
      if (validationErrors.length > 0) {
        setError(validationErrors.join(' '));
      }
      setFiles(prev => [...prev, ...validFiles]);
    }
  }, [handleDragEvents, setError, setFiles, handleFileValidation, draggedIndex]);

  const handleRemoveFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, [setFiles]);

  // Handle internal Reordering
  const handleSortDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Transparent image to avoid ghosting if needed, or standard behavior
  };

  const handleSortDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleSortDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedIndex === null || draggedIndex === index) {
        setDraggedIndex(null);
        return;
    }

    const newFiles = [...files];
    const [draggedFile] = newFiles.splice(draggedIndex, 1);
    newFiles.splice(index, 0, draggedFile);
    
    setFiles(newFiles);
    setDraggedIndex(null);
  };

  const renderFilePreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      return (
        <img 
          src={URL.createObjectURL(file)} 
          alt={file.name} 
          className="h-full w-full object-cover rounded-md"
          onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
        />
      );
    }
    if (file.type === 'application/pdf') {
      return <div className="h-full w-full flex items-center justify-center bg-red-50 rounded-md"><PdfIcon /></div>;
    }
    if (file.type.includes('word') || file.type.includes('doc')) {
      return <div className="h-full w-full flex items-center justify-center bg-blue-50 rounded-md"><WordIcon /></div>;
    }
    return <div className="h-full w-full flex items-center justify-center bg-gray-50 rounded-md"><DocumentIcon /></div>;
  };

  return (
    <div>
      <label className="block font-medium text-gray-700 mb-1">
        Tài liệu tham khảo (tùy chọn)
      </label>
      
      {/* Drop Zone */}
      <div 
        className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md transition-colors ${isDragging ? 'border-indigo-500 bg-indigo-50' : ''}`}
        onDragEnter={(e) => handleDragEvents(e, true)}
        onDragLeave={(e) => handleDragEvents(e, false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <div className="space-y-1 text-center">
          <UploadIcon />
          <div className="flex text-gray-600 justify-center">
            <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
              <span>Tải lên một tệp</span>
              <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} accept={Object.keys(ACCEPTED_FILES).join(',')} />
            </label>
            <p className="pl-1">hoặc kéo và thả</p>
          </div>
          <p className="text-xs text-gray-500">
            Hỗ trợ tệp PNG, JPG, PDF, DOC, và DOCX.
          </p>
        </div>
      </div>
      
      {/* File Grid Display */}
      {files.length > 0 && (
        <div className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file, index) => (
              <div 
                key={`${file.name}-${file.size}-${file.lastModified}`}
                className={`relative group bg-white border rounded-lg p-2 shadow-sm hover:shadow-md transition-shadow cursor-move ${draggedIndex === index ? 'opacity-50 border-indigo-400' : 'border-gray-200'}`}
                draggable
                onDragStart={(e) => handleSortDragStart(e, index)}
                onDragOver={handleSortDragOver}
                onDrop={(e) => handleSortDrop(e, index)}
              >
                 {/* Drag Handle (Visual cue) */}
                 <div className="absolute top-1 left-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded p-0.5 shadow-sm">
                   <GripVerticalIcon />
                 </div>

                 {/* Aspect Ratio Container */}
                <div className="w-full aspect-[4/3] mb-2 relative">
                   {renderFilePreview(file)}
                </div>

                <div className="px-1">
                    <p className="text-xs font-medium text-gray-900 truncate" title={file.name}>
                        {file.name}
                    </p>
                    <p className="text-[10px] text-gray-500">
                        {formatFileSize(file.size)}
                    </p>
                </div>

                {/* Remove Button */}
                <button 
                    type="button" 
                    onClick={() => handleRemoveFile(index)} 
                    className="absolute top-1 right-1 z-10 bg-white/90 text-red-500 p-1 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                    aria-label={`Xóa tệp ${file.name}`}
                >
                    <TrashIcon />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;