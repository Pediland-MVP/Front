import logger from '@/app/utils/logger';
import { useState, useCallback } from 'react';
import { UseFormSetValue, UseFormGetValues, Path, FieldValues } from 'react-hook-form';

export interface UploadedFile {
  url: string;
  name: string;
  memeType: string;
}

interface FileWithPreview extends File {
  preview: string;
}

export type FileOrUploadedFile = FileWithPreview | UploadedFile;

interface UseFileUploadProps<TFieldValues extends FieldValues> {
  setValue: UseFormSetValue<TFieldValues>;
  getValues: UseFormGetValues<TFieldValues>;
  fieldName: Path<TFieldValues>;
  uploadUrl: string;
  uploadMethod?: 'POST' | 'PUT';
  fileFieldName?: string;
}

interface UseFileUploadReturn {
  files: FileOrUploadedFile[];
  addFiles: (newFiles: FileList) => Promise<void>;
  removeFile: (index: number) => void;
  setDefaultFiles: (defaultFiles: UploadedFile[]) => void;
}

export const useFileUpload = <TFieldValues extends FieldValues>({
  setValue,
  getValues,
  fieldName,
  uploadUrl,
  uploadMethod = 'POST',
  fileFieldName = 'file',
}: UseFileUploadProps<TFieldValues>): UseFileUploadReturn => {
  const [files, setFiles] = useState<FileOrUploadedFile[]>([]);

  const uploadFile = useCallback(async (file: File): Promise<UploadedFile> => {
    const formData = new FormData();
    formData.append(fileFieldName, file);

    const response = await fetch(uploadUrl, {
      method: uploadMethod,
      body: formData,
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data: UploadedFile = await response.json();
    return data;
  }, [uploadUrl, uploadMethod, fileFieldName]);

  const addFiles = useCallback(async (newFiles: FileList) => {
    const fileArray = Array.from(newFiles);
    const newFilesWithPreview: FileWithPreview[] = fileArray.map((file) => Object.assign(file, {
      preview: URL.createObjectURL(file)
    }));

    setFiles((prevFiles) => [...prevFiles, ...newFilesWithPreview]);

    const uploadedFiles = await Promise.all(fileArray.map(uploadFile));
    const currentValue = getValues(fieldName) || [];
    logger.log(fieldName, [...currentValue, ...uploadedFiles])
    setValue(fieldName, [...currentValue, ...uploadedFiles] as any);
  }, [uploadFile, setValue, getValues, fieldName]);

  const removeFile = useCallback((index: number) => {
    setFiles((prevFiles) => {
      const newFiles = [...prevFiles];
      const removedFile = newFiles.splice(index, 1)[0];
      if ('preview' in removedFile) {
        URL.revokeObjectURL(removedFile.preview);
      }
      return newFiles;
    });

    const currentValue = getValues(fieldName) || [];
    setValue(fieldName, (currentValue as any[]).filter((_, i) => i !== index) as any);
  }, [setValue, getValues, fieldName]);

  const setDefaultFiles = useCallback((defaultFiles: UploadedFile[]) => {
    setFiles(defaultFiles);
    setValue(fieldName, defaultFiles as any);
  }, [setValue, fieldName]);

  return { files, addFiles, removeFile, setDefaultFiles };
};

