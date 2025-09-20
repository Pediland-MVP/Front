"use client";

import type {
  FileUploaderProps,
  FileWithPreview,
  ExistingFile,
  UploadedFile,
} from "@/types/fileUploader";
import { Button } from "@/components/ui/button";
import {
  FileIcon,
  MusicNoteIcon,
  PauseIcon,
  PlayIcon,
  TrashIcon,
  TrashSimpleIcon,
  UploadSimpleIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useTranslations } from "next-intl";
import type React from "react";
import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";

export const MediaUploader = ({
  multiple = false,
  files,
  setFiles,
  accept,
  onChange,
}: FileUploaderProps) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const t = useTranslations("Automations.Contents.Media.FileUploader");

  // Type guards and helpers
  const isNewFile = (file: UploadedFile): file is FileWithPreview => 'file' in file;
  const isExistingFile = (file: UploadedFile): file is ExistingFile => 'url' in file;
  
  const getDisplayName = (file: UploadedFile): string => {
    if (isNewFile(file)) return file.file.name;
    if (isExistingFile(file)) {
      return file.originalName ?? file.url.split('/').pop() ?? t("uploaded_file");
    }
    return t("uploaded_file");
  };

  const isUploading = (file: UploadedFile): boolean => {
    if (isExistingFile(file)) return false;
    if (isNewFile(file)) {
      if (file.process !== undefined) return file.process < 100;
      if (file.isUploading) return !!file.isUploading;
      return true; // new file without process yet
    }
    return false;
  };

  const getDisplaySize = (file: UploadedFile): string => {
    if (isNewFile(file)) {
      return `${(file.file.size / 1024 / 1024).toFixed(2)} ${t("MB")}`;
    }
    if (isExistingFile(file)) {
      return t("uploaded");
    }
    return t("uploaded");
  };

  const getProgressText = (file: UploadedFile): string | null => {
    if (isExistingFile(file)) return null; // Don't show progress for existing files
    if (isNewFile(file) && file.process !== undefined) {
      return `${Math.round(file.process)}%`;
    }
    return t("uploaded");
  };

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      const newFiles = acceptedFiles.map((file) => ({
        file,
        id: Math.floor(Math.random() * 1000000),
      }));

      const updatedFiles = multiple ? [...files, ...newFiles] : newFiles;
      setFiles(updatedFiles);
      onChange(updatedFiles, rejectedFiles);
    },
    [files, multiple, onChange, setFiles],
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: accept
      ? accept.split(",").reduce(
          (acc, mimeType) => {
            acc[mimeType.trim()] = [];
            return acc;
          },
          {} as Record<string, string[]>,
        )
      : undefined,
    multiple,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false),
  });

  const removeFile = (id: number) => {
    const updatedFiles = files.filter(
      (file): file is UploadedFile => "id" in file && file.id !== id,
    );
    setFiles(updatedFiles);
    onChange(updatedFiles);
  };

  const renderPreview = (file: UploadedFile) => {
    const isUploaded = "url" in file;
    const { file: uploadedFile } = file as FileWithPreview;
    const fileType = isUploaded
      ? file.mimeType?.split("/")[0]
      : uploadedFile.type.split("/")[0];

    const content = (() => {
      switch (fileType) {
        case "image":
          return (
            <Image
              src={isUploaded ? file.url : URL.createObjectURL(uploadedFile)}
              alt="Preview"
              width={64}
              height={64}
              className="h-full w-full object-cover"
            />
          );
        case "video":
          return (
            <div className="flex h-full w-full items-center justify-center bg-gray-600">
              <PlayIcon size={24} className="text-gray-300" weight="thin" />
            </div>
          );
        case "audio":
          return (
            <div className="flex h-full w-full items-center justify-center bg-gray-600">
              <MusicNoteIcon
                size={24}
                className="text-gray-300"
                weight="thin"
              />
            </div>
          );
        default:
          return (
            <div className="flex h-full w-full items-center justify-center">
              <FileIcon size={24} weight="thin" className="text-gray-400" />
            </div>
          );
      }
    })();

    return content;
  };

  return (
    <div className="w-full space-y-3">
      <div
        {...getRootProps()}
        className={`relative min-h-32 cursor-pointer rounded-lg border bg-white transition-colors hover:bg-gray-50`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <UploadSimpleIcon className="mb-1 size-8 text-gray-400" />
          <p className="mb-3 text-sm text-gray-600">
            {isDragActive ? t("dropzone") : t("upload_button")}
          </p>
          <p className="text-xs text-gray-500">
            {t("drag_drop_hint", {
              defaultValue: "Drag and drop files here or click to browse",
            })}
          </p>
        </div>
      </div>

      {files.length > 0 &&
        files.map((file) => (
          <div
            key={file.id}
            className="flex items-center gap-3 rounded-lg border bg-white/90 p-3"
          >
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
              {renderPreview(file)}
            </div>
            {/* File info */}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {t("uploaded_file")}
                </span>
                {isUploading(file) ? (
                  <span className="w-1/3 h-6 truncate text-left text-[13px] text-gray-500">
                    {getDisplayName(file)}
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file.id);
                    }}
                  >
                    <TrashSimpleIcon className="h-3 w-3" />
                  </Button>
                )}
              </div>
              {/* Progress bar - always visible */}
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-blue-500 transition-all duration-300 ease-out"
                  style={{
                    width: `${
                      "process" in file && file.process !== undefined
                        ? file.process
                        : 100
                    }%`,
                  }}
                />
              </div>
              
              <div className="mt-1.5 flex items-center gap-1 text-xs text-gray-500">
                <span className="ltr">
                  {getDisplaySize(file)}
                </span>
                {getProgressText(file) && (
                  <span>
                    {getProgressText(file)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

      <div className="flex flex-col items-start justify-center text-sm uppercase">
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">
            {t("Limits.image.text")}
          </span>
          .
          <span className="text-xs text-gray-500">
            {t("Limits.image.formats")}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">
            {t("Limits.video.text")}
          </span>
          .
          <span className="text-xs text-gray-500">
            {t("Limits.video.formats")}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">
            {t("Limits.audio.text")}
          </span>
          .
          <span className="text-xs text-gray-500">
            {t("Limits.audio.formats")}
          </span>
        </div>
      </div>
    </div>
  );
};
