'use client'

import { useFileUploadProvider } from '@/components/index';
import { useState, useCallback } from 'react';
import axios from 'axios';

interface UploadProgressData {
  fileId: string;
  progress: number;
}

interface UploadResponse {
  mimeType: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  size: number;
  key: string;
  id: number;
  createDate: string;
  updateDate: string;
}

interface UseFileUploadOptions {
  url: string;
  onSuccess?: (response: UploadResponse & { fileId: string }) => void;
  onError?: (error: Error, fileId: string) => void;
  headers?: Record<string, string>;
}

interface UseFileUploadResult {
  uploadFile: (data: { file: File; fileId: string }) => Promise<void>;
  progress: UploadProgressData | null;
  isUploading: boolean;
  error: Error | null;
  reset: () => void;
}

export function useFileUpload({
  url,
  onSuccess,
  onError,
  headers = {}
}: UseFileUploadOptions): UseFileUploadResult {
  const [progress, setProgress] = useState<UploadProgressData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { setFiles } = useFileUploadProvider();

  if (!url) {
    throw new Error('URL is required');
  }

  const reset = useCallback(() => {
    setProgress(null);
    setIsUploading(false);
    setError(null);
  }, []);

  const uploadFile = useCallback(
    async ({ file, fileId }: { file: File; fileId: string }) => {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await axios.post(url, formData, {
          headers: {
            ...headers,
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true, // Include credentials for cross-origin requests
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setProgress({ fileId, progress: percentCompleted });
              
              setFiles(files => {
                const fileIndex = files.findIndex(f => f.id === fileId);
                if (fileIndex !== -1) {
                  const updatedFiles = [...files];
                  updatedFiles[fileIndex] = { ...updatedFiles[fileIndex], progress: percentCompleted };
                  return updatedFiles;
                }
                return files;
              });
            }
          },
        });

        const responseData: UploadResponse = response.data;

        // Set final progress
        setFiles(files => {
          const fileIndex = files.findIndex(f => f.id === fileId);
          if (fileIndex !== -1) {
            const updatedFiles = [...files];
            updatedFiles[fileIndex] = { ...updatedFiles[fileIndex], progress: 100, data: responseData };
            return updatedFiles;
          }
          return files;
        });

        // Call success callback with combined response
        onSuccess?.({ ...responseData, fileId });
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Upload failed');
        setError(error);
        onError?.(error, fileId);
      } finally {
        setIsUploading(false);
      }
    },
    [url, headers, onSuccess, onError, setFiles]
  );

  return {
    uploadFile,
    progress,
    isUploading,
    error,
    reset
  };
}

