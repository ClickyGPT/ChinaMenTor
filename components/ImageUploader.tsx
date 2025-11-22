import React, { useCallback, useRef, useState, useEffect } from 'react';

interface ImageUploaderProps {
  onImageUpload: (base64Image: string, fileName: string) => void;
  isLoading: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Reset preview when component unmounts or if loading finishes (optional)
  useEffect(() => {
    if (isLoading && preview) {
      // keep preview while loading
    }
  }, [isLoading, preview]);

  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const base64String = reader.result.split(',')[1];
          setPreview(reader.result);
          onImageUpload(base64String, file.name);
        }
      };
      reader.readAsDataURL(file);
    } else {
      alert("Please select a valid image file.");
    }
  };

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  }, [onImageUpload]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.add('border-blue-500', 'bg-blue-900/20');
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('border-blue-500', 'bg-blue-900/20');
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('border-blue-500', 'bg-blue-900/20');
    const file = event.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [onImageUpload]);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (preview) {
    return (
       <div className="relative w-full h-64 bg-gray-800 rounded-xl border-2 border-gray-700 overflow-hidden flex items-center justify-center group">
         <img src={preview} alt="Upload Preview" className="w-full h-full object-contain" />
         <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={clearImage}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full flex items-center gap-2"
            >
              <span className="material-symbols-outlined">delete</span>
              Change Image
            </button>
         </div>
       </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200
        ${isLoading ? 'border-blue-400 bg-blue-900/10 opacity-50 pointer-events-none' : 'border-gray-600 hover:border-blue-500 hover:bg-gray-800'}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={triggerFileInput}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      <div className="flex flex-col items-center text-center p-4">
        <div className="p-4 bg-gray-800 rounded-full mb-4">
          <span className="material-symbols-outlined text-4xl text-blue-400">cloud_upload</span>
        </div>
        <p className="text-lg font-semibold text-gray-200 mb-1">Click or drag image to upload</p>
        <p className="text-sm text-gray-400">Supports JPG, PNG, WebP</p>
      </div>
    </div>
  );
};

export default ImageUploader;
