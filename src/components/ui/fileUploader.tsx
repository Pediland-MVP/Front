"use client";

import type {
  FileUploaderProps,
  FileWithPreview,
  UploadedFile,
} from "@/types/fileUploader";
import { Button } from "@/components/ui/button";
import {} from "@phosphor-icons/react";
import {
  FileIcon,
  MusicNoteIcon,
  PauseIcon,
  PlayIcon,
  UploadSimpleIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useTranslations } from "next-intl";
import type React from "react";
import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";

export function FileUploader({
  multiple = false,
  files,
  setFiles,
  accept,
  onChange,
}: FileUploaderProps) {
  const t = useTranslations("FileUploader");
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.map((file) => ({
        file,
        id: Math.floor(Math.random() * 1000000),
      }));

      const updatedFiles = multiple ? [...files, ...newFiles] : newFiles;
      setFiles(updatedFiles);
      onChange(updatedFiles);
    },
    [files, multiple, onChange, setFiles],
  );

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    accept: accept ? { [accept]: [] } : undefined,
    multiple,
    noClick: true,
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

  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRef = useRef<HTMLAudioElement | HTMLVideoElement>(null);

  const renderPreview = (file: UploadedFile) => {
    const isUploaded = "url" in file;
    const { file: uploadedFile } = file as FileWithPreview;
    const fileType = isUploaded
      ? file.mimeType?.split("/")[0]
      : uploadedFile.type.split("/")[0];

    const renderPlay = () => {
      const handlePlay = (e: React.MouseEvent<SVGSVGElement>) => {
        e.preventDefault();
        if (mediaRef.current) {
          if (mediaRef.current.paused) {
            mediaRef.current.play();
            setIsPlaying(true);
          } else {
            mediaRef.current.pause();
            setIsPlaying(false);
          }
        }
      };
      return (
        <div className="absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 transform">
          {isPlaying ? (
            <PauseIcon
              onClick={handlePlay}
              size={48}
              fill="white"
              className="text-gray-300"
            />
          ) : (
            <PlayIcon
              onClick={handlePlay}
              size={48}
              fill="white"
              className="text-gray-300"
            />
          )}
        </div>
      );
    };

    const renderUploadCircularProgress = () => {
      const progress = (file as FileWithPreview).process;
      if (!progress) {
        return null;
      }
      const radius = 40;
      const strokeWidth = 8;
      const normalizedRadius = radius - strokeWidth * 2;
      const circumference = normalizedRadius * 2 * Math.PI;
      const strokeDashoffset = circumference - (progress / 100) * circumference;

      return (
        <div className="relative inline-flex h-full w-full items-center justify-center bg-transparent">
          <svg height={radius * 2} width={radius * 2}>
            <circle
              stroke="#e6e6e6"
              fill="transparent"
              strokeWidth={strokeWidth}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            <circle
              stroke="#3b82f6"
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference + " " + circumference}
              style={{ strokeDashoffset }}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              transform={`rotate(-90 ${radius} ${radius})`}
            />
          </svg>
          <div className="absolute text-lg font-semibold">
            <p className="text-xs">{Math.round(progress)}%</p>
          </div>
        </div>
      );
    };

    switch (fileType) {
      case "image":
        return (
          <div className="relative h-full w-full object-cover">
            {"isUploading" in file &&
              file.isUploading &&
              renderUploadCircularProgress()}
            <img
              src={isUploaded ? file.url : URL.createObjectURL(uploadedFile)}
              alt="Preview"
              className="h-full w-full object-cover"
            />
          </div>
        );
      case "video":
        return (
          <div className="relative h-full w-full object-cover">
            {"isUploading" in file && file.isUploading
              ? renderUploadCircularProgress()
              : renderPlay()}
            <video
              ref={mediaRef as React.RefObject<HTMLVideoElement>}
              src={isUploaded ? file.url : URL.createObjectURL(uploadedFile)}
              className="h-full w-full object-cover"
            />
          </div>
        );
      case "audio":
        return (
          <div className="relative flex h-full w-full items-center justify-center bg-gray-600 object-cover">
            {"isUploading" in file && file.isUploading
              ? renderUploadCircularProgress()
              : renderPlay()}
            <MusicNoteIcon size={48} className="text-gray-300" weight="thin" />
            <audio
              ref={mediaRef as React.RefObject<HTMLAudioElement>}
              src={isUploaded ? file.url : URL.createObjectURL(uploadedFile)}
              className="h-full w-full object-cover"
            />
          </div>
        );
      default:
        return <FileIcon size={48} weight="thin" />;
    }
  };

  return (
    <div className="w-full">
      <div {...getRootProps()} className="relative">
        <input {...getInputProps()} />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={open}
          className="flex w-full items-center justify-center gap-2"
        >
          <UploadSimpleIcon className="size-5" />
          {t("uploadButton")}
        </Button>
        {isDragActive && (
          <div className="border-primary bg-primary/10 absolute inset-0 flex items-center justify-center rounded-lg border-2 border-dashed">
            <p>{t("dropzone")}</p>
          </div>
        )}
      </div>
      {files.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-4">
          {files.map((file) => (
            <div key={file.id} className="relative h-24 w-24">
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                {renderPreview(file)}
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                onClick={() => removeFile(file.id)}
              >
                <XIcon size={12} weight="bold" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <div className="mt-2 flex flex-col items-start justify-center">
        <span className="text-xs text-gray-500">{t("Limits.media.text")}</span>
        <span className="text-xs text-gray-500">
          {t("Limits.media.formats")}
        </span>
      </div>
    </div>
  );
}
