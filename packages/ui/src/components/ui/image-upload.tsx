'use client';

import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';

interface PersianImageUploaderProps {
  url: string;
  fieldName: string;
  onUploadComplete?: (url: string) => void;
  defaultImageUrl?: string;
}

const ImageUploader: React.FC<PersianImageUploaderProps> = ({
  onUploadComplete,
  url,
  fieldName,
  defaultImageUrl,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(defaultImageUrl || null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(defaultImageUrl || null);

  const onDrop = (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
    },
    multiple: false,
  });

  useEffect(() => {
    if (file) {
      uploadFile();
    }
  }, [file]);

  const uploadFile = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append(fieldName, file);

    try {
      const response = await axios.post(url, formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1),
          );
          setProgress(percentCompleted);
        },
        withCredentials: true,
      });

      setUploadedUrl(response.data.url);
      if (onUploadComplete) {
        onUploadComplete(response.data.url);
      }
      toast.success('تصویر شما با موفقیت آپلود شد.');
    } catch (error) {
      console.error('خطا در آپلود فایل:', error);
      toast.error('متأسفانه در آپلود تصویر مشکلی پیش آمد. لطفاً دوباره تلاش کنید.');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    setProgress(0);
    setUploadedUrl(null);
    if (onUploadComplete) {
      onUploadComplete('');
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-4 text-center ${
          isDragActive ? 'border-primary' : 'border-gray-300'
        }`}
      >
        <input {...getInputProps()} />
        {preview ? (
          <div className="relative">
            <Image
              src={preview}
              alt="پیش‌نمایش"
              width={300}
              height={300}
              className="mx-auto rounded-lg object-cover"
            />
            <button
              className="absolute top-2 right-2 rounded-full bg-red-500 p-1 text-white transition-colors hover:bg-red-600"
              onClick={(e) => {
                e.stopPropagation();
                removeFile();
              }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div>
            <Upload className="text-muted-foreground mx-auto h-12 w-12" />
            <p className="mt-3 text-sm text-gray-600">
              {isDragActive
                ? 'فایل را اینجا رها کنید.'
                : 'اینجا کلیک کنید و یا فایل را به اینجا بکشید.'}
            </p>
          </div>
        )}
      </div>

      {uploading && (
        <div className="mt-4">
          <Progress value={progress} className="w-full" />
          <p className="mt-2 text-center text-sm">در حال آپلود... {progress}%</p>
        </div>
      )}

      {uploadedUrl && (
        <div className="mt-4 text-center">
          <p className="font-semibold text-green-600">فایل با موفقیت آپلود شد!</p>
          <a
            href={uploadedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            مشاهده فایل آپلود شده
          </a>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
