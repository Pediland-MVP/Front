import React from "react";

export type FileWithPreview = {
  file: File;
  id: number;
  process?: number;
  isUploading?: boolean;
};

export type ExistingFile = {
  id: number;
  url: string;
  mimeType: string;
  originalName?: string;
  originalSize?: number;
};

export type UploadedFile = FileWithPreview | ExistingFile;

export interface FileUploaderProps {
  multiple?: boolean;
  // value: UploadedFile[]
  onChange: (files: UploadedFile[], rejectedFiles?: any[]) => any;
  files: UploadedFile[];
  setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  accept?: string;
}
