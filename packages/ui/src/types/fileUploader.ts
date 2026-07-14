import {
  AutomationContentFileType,
  AutomationContentModeEnum,
  AutomationContentTypesEnum,
} from '@/automation-builder/constants/automationContent.enum';
import { ContentItemSchema } from '@/automation-builder/schemas/automationForm';
import React from 'react';
import { FieldArrayWithId, UseFieldArrayAppend } from 'react-hook-form';
import z from 'zod';

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
  content: z.infer<typeof ContentItemSchema>;
  appendContents: UseFieldArrayAppend<z.infer<typeof ContentItemSchema>>;
  mode: AutomationContentModeEnum;
  fileType: AutomationContentFileType;
  multiple?: boolean;
  // value: UploadedFile[]
  onChange: (files: UploadedFile[], rejectedFiles?: any[]) => any;
  files: UploadedFile[];
  setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  accept?: string;
}
