"use client";

import type {
  FileUploaderProps,
  FileWithPreview,
  ExistingFile,
  UploadedFile,
} from "@/types/fileUploader";
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileIcon,
  Music,
  Play,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { AudioRecorderWithVisualizer } from "./AudioRecorder";

export const MediaUploader = ({
  files,
  setFiles,
  accept,
  onChange,
}: FileUploaderProps) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const t = useTranslations("Automations.Contents.Media.FileUploader");

  // Type guards and helpers
  const isNewFile = (file: UploadedFile): file is FileWithPreview =>
    "file" in file;
  const isExistingFile = (file: UploadedFile): file is ExistingFile =>
    "url" in file;

  const getDisplayName = (file: UploadedFile): string => {
    if (isNewFile(file)) return file.file.name;
    if (isExistingFile(file)) {
      return (
        file.originalName ?? file.url.split("/").pop() ?? t("uploaded_file")
      );
    }
    return t("uploaded_file");
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
    if (isExistingFile(file)) return null;
    if (isNewFile(file) && file.process !== undefined) {
      const processPercentage = Math.round(file.process)
      return `${processPercentage === 100 ? 98 : processPercentage}%`;
    }
    return t("uploaded");
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
    },
    [onChange, setFiles],
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
    multiple: false,
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
    const isUploaded = "url" in file;
    const { file: uploadedFile } = file as FileWithPreview;
    const fileType = isUploaded
      ? file.mimeType?.split("/")[0]
      : uploadedFile.type.split("/")[0];

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
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <Play size={24} className="text-muted-foreground" />
          </div>
        );
      case "audio":
        return (
          <div className="flex h-full w-full items-center justify-center bg-muted">
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

  return (
    <div className="w-full space-y-3">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`relative min-h-32 cursor-pointer rounded-lg border bg-background transition-colors hover:bg-muted/50`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <Upload className="mb-1 size-8 text-muted-foreground" />
          <p className="mb-3 text-sm text-muted-foreground">
            {isDragActive ? t("dropzone") : t("upload_button")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("drag_drop_hint", {
              defaultValue: "Drag and drop files here or click to browse",
            })}
          </p>
        </div>
      </div>

      {/* Audio Recorder */}
      <div className="relative pt-6">
        <AudioRecorderWithVisualizer
          onRecordingComplete={handleRecordingComplete}
        />
      </div>

      {/* File list */}
      {files.length > 0 &&
        files.map((file) => (
          <div
            key={file.id}
            className="flex items-center gap-3 rounded-lg border bg-background p-3"
          >
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
              {renderPreview(file)}
            </div>
            {/* File info */}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {t("uploaded_file")}
                </span>
                {isUploading(file) ? (
                  <span className="h-6 w-1/3 truncate text-left text-[13px] text-muted-foreground">
                    {getDisplayName(file)}
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
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
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-all duration-300 ease-out"
                  style={{
                    width: `${
                      "process" in file && file.process !== undefined
                        ? file.process
                        : 100
                    }%`,
                  }}
                />
              </div>

              <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                <span className="ltr">{getDisplaySize(file)}</span>
                {getProgressText(file) && <span>{getProgressText(file)}</span>}
              </div>
            </div>
          </div>
        ))}

      {/* Limits info */}
      <div className="flex flex-col items-start justify-center text-sm uppercase">
        <div className="inline-block">
          <span className="text-xs text-muted-foreground">
            {t("Limits.image.text")}
          </span>
          <span className="mx-1">.</span>
          <span className="text-xs text-muted-foreground">
            {t("Limits.image.formats")}
          </span>
        </div>
        <div className="inline-block">
          <span className="text-xs text-muted-foreground">
            {t("Limits.video.text")}
          </span>
          <span className="mx-1">.</span>
          <span className="text-xs text-muted-foreground">
            {t("Limits.video.formats")}
          </span>
        </div>
        <div className="inline-block">
          <span className="text-xs text-muted-foreground">
            {t("Limits.audio.text")}
          </span>
          <span className="mx-1">.</span>
          <span className="text-xs text-muted-foreground">
            {t("Limits.audio.formats")}
          </span>
        </div>
      </div>
    </div>
  );
};
