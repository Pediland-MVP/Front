'use client';

import type {
  FileUploaderProps,
  FileWithPreview,
  ExistingFile,
  UploadedFile,
} from '@/types/fileUploader';
import { Button } from '@/components/ui/button';
import { Upload, FileIcon, Music, Play, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { AudioRecorderWithVisualizer } from './AudioRecorder';
import { AutomationContentTypesEnum } from '@/automation-builder/constants/automationContent.enum';
import { CheckCircleIcon, CheckIcon } from '@phosphor-icons/react/dist/ssr';

export const MediaUploader = ({
  files,
  setFiles,
  accept,
  onChange,
  fileType,
  mode,
  content,
  appendContents,
}: FileUploaderProps) => {
  const [isInitialized, setIsInitialize] = useState<boolean>(false);

  useEffect(() => {
    if (isInitialized) return;
    if (!content) return;
    setIsInitialize(true);
    if (content.fileTemp) {
      setFiles([content.fileTemp]);
      onChange([content.fileTemp], []);
    }
  }, [content]);

  const [isDragActive, setIsDragActive] = useState(false);
  const t = useTranslations('Automations.Contents.Media.FileUploader');

  // Type guards and helpers
  const isNewFile = (file: UploadedFile): file is FileWithPreview => 'file' in file;
  const isExistingFile = (file: UploadedFile): file is ExistingFile => 'url' in file;

  const getDisplayName = (file: UploadedFile): string => {
    if (isNewFile(file)) return file.file.name;
    if (isExistingFile(file)) {
      return file.originalName ?? file.url.split('/').pop() ?? t('uploaded_file');
    }
    return t('uploaded_file');
  };

  const isUploading = (file: UploadedFile): boolean => {
    if (isExistingFile(file)) return false;
    if (isNewFile(file)) {
      if (file.process !== undefined) return file.process < 100;
      if (file.isUploading) return !!file.isUploading;
      return true;
    }
    return false;
  };

  const getDisplaySize = (file: UploadedFile): React.ReactNode => {
    if (isNewFile(file)) {
      return `${(file.file.size / 1024 / 1024).toFixed(2)} ${t('MB')}`;
    }
    if (isExistingFile(file)) {
      return (
        <p className="flex gap-x-1">
          <CheckCircleIcon weight="fill" size={14} className="text-green-500" />
          {t('uploaded')}{' '}
        </p>
      );
    }
    return (
      <p className="flex gap-x-1">
        <CheckCircleIcon weight="fill" size={14} className="text-green-500" />
        {t('uploaded')}{' '}
      </p>
    );
  };

  const getProgressText = (file: UploadedFile): React.ReactNode | null => {
    if (isExistingFile(file)) return null;
    if (isNewFile(file) && file.process !== undefined) {
      const processPercentage = Math.round(file.process);
      return `${processPercentage === 100 ? 98 : processPercentage}%`;
    }
    return (
      <p className="flex gap-x-1">
        <CheckCircleIcon weight="fill" size={14} className="text-green-500" />
        {t('uploaded')}{' '}
      </p>
    );
  };

  // Single file only: replace any existing file
  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (acceptedFiles.length === 0) return;
      const newFile: FileWithPreview = {
        file: acceptedFiles[0],
        id: Math.floor(Math.random() * 1000000),
      };
      const updatedFiles = [newFile];
      setFiles(updatedFiles);
      onChange(updatedFiles, rejectedFiles);
      if (acceptedFiles.length > 1) {
        for (let i = 1; i < acceptedFiles.length; i++) {
          const newFile: FileWithPreview = {
            file: acceptedFiles[i],
            id: Math.floor(Math.random() * 1000000),
          };
          appendContents({
            type: fileType,
            fileTemp: newFile,
          });
        }
      }
    },
    [onChange, setFiles],
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: accept
      ? accept.split(',').reduce(
          (acc, mimeType) => {
            acc[mimeType.trim()] = [];
            return acc;
          },
          {} as Record<string, string[]>,
        )
      : undefined,
    multiple: true,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false),
  });

  const removeFile = (id: number) => {
    const updatedFiles = files.filter(
      (file): file is UploadedFile => 'id' in file && file.id !== id,
    );
    setFiles(updatedFiles);
    onChange(updatedFiles);
  };

  const handleRecordingComplete = useCallback(
    (file: File) => {
      const newFile: FileWithPreview = {
        file,
        id: Math.floor(Math.random() * 1000000),
        process: 100,
      };
      const updatedFiles = [newFile];
      setFiles(updatedFiles);
      onChange(updatedFiles);
    },
    [onChange, setFiles],
  );

  const renderPreview = (file: UploadedFile) => {
    const isUploaded = 'url' in file;
    const { file: uploadedFile } = file as FileWithPreview;
    const fileType = isUploaded ? file.mimeType?.split('/')[0] : uploadedFile.type.split('/')[0];

    switch (fileType) {
      case 'image':
        return (
          <Image
            src={isUploaded ? file.url : URL.createObjectURL(uploadedFile)}
            alt="Preview"
            width={64}
            height={64}
            className="h-full w-full object-cover"
          />
        );
      case 'video':
        return (
          <div className="bg-muted flex h-full w-full items-center justify-center">
            <Play size={24} className="text-muted-foreground" />
          </div>
        );
      case 'audio':
        return (
          <div className="bg-muted flex h-full w-full items-center justify-center">
            <Music size={24} className="text-muted-foreground" />
          </div>
        );
      default:
        return (
          <div className="flex h-full w-full items-center justify-center">
            <FileIcon size={24} className="text-muted-foreground" />
          </div>
        );
    }
  };

  const acceptedFormats = {
    image: 'image/png, image/jpeg, image/gif',
    video: 'video/mp4, video/ogg, video/avi, video/quicktime, video/webm',
    audio: 'audio/aac, audio/m4a, audio/wav, audio/mp4, audio/mpeg, audio/mp3',
  };

  return (
    <div className="w-full space-y-3">
      {/* File list */}
      {files.length > 0 &&
        files.map((file) => (
          <div
            key={file.id}
            className="bg-background flex items-center gap-3 rounded-lg border p-3"
          >
            <div className="bg-muted h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
              {renderPreview(file)}
            </div>
            {/* File info */}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">{t('uploaded_file')}</span>
                {isUploading(file) ? (
                  <span className="text-muted-foreground h-6 w-1/3 truncate text-left text-[13px]">
                    {getDisplayName(file)}
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              {/* Progress bar */}
              <div className="bg-muted h-2 w-full rounded-full">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: `${
                      'process' in file && file.process !== undefined ? file.process : 100
                    }%`,
                  }}
                />
              </div>

              <div className="text-muted-foreground mt-1.5 flex items-center gap-1 text-xs">
                <span className="ltr">{getDisplaySize(file)}</span>
                {getProgressText(file) && <span>{getProgressText(file)}</span>}
              </div>
            </div>
          </div>
        ))}

      {/* Audio Recorder */}
      {fileType === AutomationContentTypesEnum.AUDIO && (
        <AudioRecorderWithVisualizer onRecordingComplete={handleRecordingComplete} />
      )}

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`bg-background hover:bg-muted/50 relative min-h-32 cursor-pointer rounded-lg border transition-colors`}
      >
        <input {...getInputProps()} multiple accept={acceptedFormats[fileType]} />
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <Upload className="text-muted-foreground mb-1 size-8" />
          <p className="text-muted-foreground mb-3 text-sm">
            {isDragActive ? t('dropzone') : t(`FileTypes.${fileType}.title`)}
          </p>
          <p className="text-muted-foreground text-xs">{t('upload_description')}</p>
          <p className="text-muted-foreground text-xs">
            {t(`FileTypes.${fileType}.formats`, {
              defaultValue: 'Drag and drop files here or click to browse',
            })}
          </p>
        </div>
      </div>
    </div>
  );
};
