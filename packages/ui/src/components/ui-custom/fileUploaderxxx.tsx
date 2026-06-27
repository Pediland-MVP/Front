'use client';
import React, { useCallback, useState, useRef, createContext, useContext } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, FileIcon, MusicIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import CircularProgress from '@/components/ui/circularProgress';

// Create a wrapper type instead of extending File
export interface FileWithMetadata {
  file?: File;
  url?: string;
  id: string;
  progress: number;
  data?: any;
  type: any;
}

interface UploadProgressData {
  fileId: string;
  progress: number;
}

interface FileUploaderProps {
  multiple?: boolean;
  uploadHandler: (data: { file: File; fileId: string }) => void;
  defaultFiles?: FileWithMetadata[] | null;
  acceptedFileTypes?: string[];
  type: string;
}

// Update FilePreview to use the new type
const FilePreview: React.FC<{
  fileData: FileWithMetadata;
  progress: number;
  defaultFile: FileWithMetadata | null;
}> = ({ fileData, progress, defaultFile }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const t = useTranslations();

  const filetypeFromurl = fileData.url?.split('.').pop();
  const file = fileData.file;

  const isImage = fileData.type || file?.type.startsWith('image/');
  const isVideo = fileData.type || file?.type.startsWith('video/');
  const isAudio = fileData.type || file?.type.startsWith('audio/');
  const isPDF = fileData.type || file?.type === 'application/pdf';
  const renderPreview = () => {
    if (isImage) {
      return (
        <img
          src={file ? URL.createObjectURL(file) : fileData.url}
          alt={file?.name}
          className="h-24 w-24 rounded object-cover"
        />
      );
    }

    if (isVideo) {
      return (
        <video
          src={file ? URL.createObjectURL(file) : fileData.url}
          className="h-24 w-24 rounded object-cover"
          controls
        />
      );
    }

    if (isAudio) {
      return (
        <div className="bg-muted flex h-24 w-24 flex-col items-center justify-center rounded">
          <MusicIcon className="text-primary h-12 w-12" />
          <audio
            ref={audioRef}
            src={file ? URL.createObjectURL(file) : fileData.url}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
        </div>
      );
    }

    if (isPDF) {
      return (
        <div className="bg-muted flex h-24 w-24 flex-col items-center justify-center rounded">
          <FileIcon className="text-primary h-12 w-12" />
          <span className="w-[15ch] truncate text-xs font-thin">{file?.name}</span>
        </div>
      );
    }

    return (
      <div className="bg-muted flex h-24 w-24 flex-col items-center justify-center rounded">
        <FileIcon className="text-primary h-12 w-12" />
        <span className="w-[15ch] truncate text-xs font-thin">{file?.name}</span>
      </div>
    );
  };

  return (
    <div className="relative h-24 w-24">
      {renderPreview()}
      {progress < 100 && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50">
          <CircularProgress value={progress} size={48} strokeWidth={4} />
        </div>
      )}
      {progress === 100 && (
        <div className="absolute inset-0 flex items-center justify-center rounded bg-green-500/50">
          <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  );
};

const FileUploader: React.FC<FileUploaderProps> = ({
  multiple = false,
  uploadHandler,
  defaultFiles = [],
  acceptedFileTypes = [],
  type,
}) => {
  const { files, setFiles, removeFile } = useFileUploadProvider();
  const t = useTranslations();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.map((file) => ({
        file, // Keep the original File object intact
        id: Math.random().toString(36).substr(2, 9),
        progress: 0,
        type,
      }));

      const updatedFiles = multiple ? [...files, ...newFiles] : newFiles;
      setFiles(updatedFiles);

      newFiles.forEach((fileData) => {
        uploadHandler({ file: fileData.file, fileId: fileData.id });
      });
    },
    [files, multiple, uploadHandler],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
    accept: acceptedFileTypes.length
      ? acceptedFileTypes.reduce((acc, curr) => ({ ...acc, [curr]: [] }), {})
      : undefined,
  });

  return (
    <Card
      {...getRootProps()}
      className={`cursor-pointer border-dashed p-4 ${
        isDragActive ? 'border-primary' : 'border-muted'
      }`}
    >
      <input {...getInputProps()} />
      <div className="text-center">
        <p className="text-muted-foreground text-sm">{t('fileUploader.dragDropText')}</p>
        <Button variant="outline" className="mt-2" type="button">
          {t('fileUploader.selectFiles')}
        </Button>
      </div>
      <div className="mt-4 h-[120px] overflow-y-auto">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {files.map((fileData, index) => (
            <div key={fileData.id} className="relative">
              <FilePreview defaultFile={null} fileData={fileData} progress={fileData.progress} />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute top-0 right-0 h-6 w-6 rounded-full p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(fileData.id);
                }}
              >
                <X className="h-3 w-3 text-gray-500" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export function FileUploaderSkeleton() {
  return (
    <Card className="border-dashed p-4">
      <div className="flex flex-col items-center space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-10 w-[150px]" />
      </div>
      <div className="mt-4 h-[120px]">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          <Skeleton className="h-24 w-24 rounded" />
          <Skeleton className="h-24 w-24 rounded" />
          <Skeleton className="h-24 w-24 rounded" />
        </div>
      </div>
    </Card>
  );
}

export const LazyFileUploader = dynamic(() => Promise.resolve(FileUploader), {
  loading: () => <FileUploaderSkeleton />,
  ssr: false,
});

export default FileUploader;

interface FileUploaderContextType {
  files: FileWithMetadata[];
  setFiles: React.Dispatch<React.SetStateAction<FileWithMetadata[]>>;
  addFiles: (newFiles: File[], multiple?: boolean) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
}

const FileUploaderContext = createContext<FileUploaderContextType | undefined>(undefined);

interface FileUploaderProviderProps {
  children: React.ReactNode;
  onFileUpload?: (data: { file: File; fileId: string }) => void;
}

export function FileUploaderProvider({ children, onFileUpload }: FileUploaderProviderProps) {
  const [files, setFiles] = useState<FileWithMetadata[]>([]);

  const addFiles = useCallback(
    (newFiles: File[], multiple = false) => {
      const filesWithMetadata = newFiles.map((file) => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        progress: 0,
        type: file.type,
      }));

      setFiles((prevFiles) => {
        const updatedFiles = multiple ? [...prevFiles, ...filesWithMetadata] : filesWithMetadata;

        // If onFileUpload is provided, call it for each new file
        if (onFileUpload) {
          filesWithMetadata.forEach((fileData) => {
            onFileUpload({ file: fileData.file, fileId: fileData.id });
          });
        }

        return updatedFiles;
      });
    },
    [onFileUpload],
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prevFiles) => prevFiles.filter((fileData) => fileData.id !== id));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  const value = {
    files,
    setFiles,
    addFiles,
    removeFile,
    clearFiles,
  };

  return <FileUploaderContext.Provider value={value}>{children}</FileUploaderContext.Provider>;
}

export const useFileUploadProvider = () => {
  const context = useContext(FileUploaderContext);
  if (!context) {
    throw new Error('useFileUploadProvider must be used within a FileUploaderProvider');
  }
  return context;
};
