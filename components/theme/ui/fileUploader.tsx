"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslations } from "next-intl";
import {
  File as FileIcon,
  MusicNote,
  FileText,
  X,
  UploadSimple,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  FileUploaderProps,
  FileWithPreview,
  UploadedFile,
} from "@/components/theme/types/fileUploader";
import { Pause, Play } from "@phosphor-icons/react/dist/ssr";

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
    [files, multiple /**onChange*/]
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
      (file): file is UploadedFile => "id" in file && file.id !== id
    );
    setFiles(updatedFiles);
    onChange(updatedFiles);
  };

  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRef = useRef<HTMLAudioElement | HTMLVideoElement>(null);
  const fileType = accept?.split("/")?.[0];

  const renderPreview = (file: UploadedFile) => {
    const isUploaded = "url" in file;
    const { file: uploadedFile } = file as FileWithPreview;

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
        <div className="absolute z-20 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          {isPlaying ? (
            <Pause
              onClick={handlePlay}
              size={48}
              fill="white"
              className="text-gray-300"
            />
          ) : (
            <Play
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
        <div className="relative inline-flex items-center justify-center h-full w-full bg-transparent">
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
          <div className="w-full h-full object-cover relative">
            {"isUploading" in file &&
              file.isUploading &&
              renderUploadCircularProgress()}
            <img
              src={isUploaded ? file.url : URL.createObjectURL(uploadedFile)}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
        );
      case "video":
        return (
          <div className="w-full h-full object-cover relative">
            {"isUploading" in file && file.isUploading
              ? renderUploadCircularProgress()
              : renderPlay()}
            <video
              ref={mediaRef as React.RefObject<HTMLVideoElement>}
              src={isUploaded ? file.url : URL.createObjectURL(uploadedFile)}
              className="w-full h-full object-cover"
            />
          </div>
        );
      case "audio":
        return (
          <div className="w-full h-full object-cover relative flex justify-center items-center bg-gray-600">
            {"isUploading" in file && file.isUploading
              ? renderUploadCircularProgress()
              : renderPlay()}
            <MusicNote size={48} className="text-gray-300" weight="thin" />
            <audio
              ref={mediaRef as React.RefObject<HTMLAudioElement>}
              src={isUploaded ? file.url : URL.createObjectURL(uploadedFile)}
              className="w-full h-full object-cover"
            />
          </div>
        );
      case "application":
        return uploadedFile.type === "application/pdf" ? (
          <FileText size={48} weight="thin" />
        ) : (
          <FileIcon size={48} weight="thin" />
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
          onClick={open}
          className="w-full flex items-center justify-center gap-2"
        >
          <UploadSimple size={20} />
          {t("uploadButton")}
        </Button>
        {isDragActive && (
          <div className="absolute inset-0 border-2 border-dashed border-primary bg-primary/10 rounded-lg flex items-center justify-center">
            <p>{t("dropzone")}</p>
          </div>
        )}
      </div>
      {files.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-4">
          {files.map((file) => {
            const isUploaded = "url" in file;
            const { file: uploadedFile } = file as FileWithPreview;
            const uploadedFileType = isUploaded
              ? file?.mimeType?.split("/")?.[0]
              : uploadedFile.type.split("/")[0];

              if (uploadedFileType !== fileType) {
                return null
              }

            return (
              <div key={file.id} className="relative w-24 h-24">
                <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden">
                  {renderPreview(file)}
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
                  onClick={() => removeFile(file.id)}
                >
                  <X size={12} weight="bold" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
      {fileType && (
        <div className="flex justify-center items-start flex-col mt-2">
          <span className="text-xs text-gray-500">
            {t(`Limits.${fileType}.text`)}
          </span>
          <span className="text-xs text-gray-500">
            {t(`Limits.${fileType}.formats`)}
          </span>
        </div>
      )}
    </div>
  );
}
