// packages/ui/src/automation-builder/Contents/MediaContent.tsx
'use client';

import {
  AutomationContentFileType,
  AutomationContentModeEnum,
  AutomationContentTypesEnum,
} from '../constants/automationContent.enum';
import { AutomationFormType, ContentItemSchema } from '../schemas/automationForm';
import { UploadedFile } from '@/types/fileUploader';
import React, { useState } from 'react';
import { UseFieldArrayAppend, useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { AxiosError } from 'axios';
import { toast } from 'sonner';

import { FormMessage } from '@/components/ui/form';
import { useContentsUploaderContext } from './ContentsUploaderContext';
import { MediaUploader } from '@/components/ui-custom/MediaUploader';
import z from 'zod';
import { AutomationBuilderApiClient } from '../types/apiClient';

interface MediaContentProps {
  index: number;
  mode: AutomationContentModeEnum;
  type: AutomationContentTypesEnum;
  appendContents: UseFieldArrayAppend<z.infer<typeof ContentItemSchema>>;
  content: z.infer<typeof ContentItemSchema>;
  apiClient: AutomationBuilderApiClient;
}

export const MediaContent = ({
  index,
  mode,
  type,
  appendContents,
  content,
  apiClient,
}: MediaContentProps) => {
  const { files, setFiles } = useContentsUploaderContext();

  const {
    setValue,
    getValues,
    trigger,
    watch,
    formState: { errors },
  } = useFormContext<AutomationFormType>();

  const t_err = useTranslations('Automations.Contents.Media.Errors');
  const t_fileUploader = useTranslations('Automations.Contents.Media.FileUploader');
  const t_ec = useTranslations('ERROR_CODES');

  const [uploadError, setUploadError] = useState<string | null>(null);

  const onChange = (files: UploadedFile[], rejectedFiles?: any[]) => {
    // Clear previous errors
    setUploadError(null);

    // Handle rejected files
    if (rejectedFiles && rejectedFiles.length > 0) {
      const rejectedFile = rejectedFiles[0];
      if (rejectedFile.errors) {
        const errorCode = rejectedFile.errors[0].code;
        switch (errorCode) {
          case 'file-invalid-type':
            setUploadError(t_fileUploader('Errors.invalid_type'));
            break;
          case 'file-too-large':
            setUploadError(t_fileUploader('Errors.file_too_large'));
            break;
          case 'file-too-small':
            setUploadError(t_fileUploader('Errors.file_too_small'));
            break;
          case 'too-many-files':
            setUploadError(t_fileUploader('Errors.too_many_files'));
            break;
          default:
            setUploadError(t_fileUploader('Errors.upload_failed'));
        }
      }
      return;
    }

    if (files.length === 0) {
      setValue(
        `${mode === AutomationContentModeEnum.AUTOMATION ? 'contents' : 'reminders'}.${index}.file`,
        null,
      );
      return;
    }

    if (files[0] && 'file' in files[0]) {
      setFiles((files) => {
        return [{ ...files[0], isUploading: true, process: 0 }];
      });

      apiClient
        .upload(files[0].file, (percent) => {
          setFiles((prev) => {
            return [{ ...prev[0], process: percent }];
          });
        })
        .then((res) => {
          const originalFile = files[0];
          setFiles([
            {
              id: res.id,
              url: res.url,
              mimeType: res.mimeType,
              // Preserve original file info
              ...(originalFile &&
                'file' in originalFile && {
                  originalName: originalFile.file.name,
                  originalSize: originalFile.file.size,
                }),
            },
          ]);

          setValue(
            `${mode === AutomationContentModeEnum.AUTOMATION ? 'contents' : 'reminders'}.${index}`,
            {
              ...getValues(
                `${mode === AutomationContentModeEnum.AUTOMATION ? 'contents' : 'reminders'}.${index}`,
              ),
              type: res.mimeType.split('/')[0] as AutomationContentTypesEnum,
              file: {
                id: res.id,
                url: res.url,
                mimeType: res.mimeType,
              },
            },
          );
        })
        .catch((err: AxiosError<{ code?: string }>) => {
          const code = err.response?.data?.code;
          if (code) {
            toast.error(t_ec(code));
          } else if (err.status === 400) {
            toast.error(
              `${t_fileUploader(`Limits.${type}.text`)}. ${t_fileUploader(`Limits.${type}.formats`)}`,
            );
          }
        })
        .finally(() => {
          setFiles((prev) => {
            return [{ ...prev[0], isUploading: false }];
          });
          trigger('contents');
        });
    }
  };

  return (
    <>
      <MediaUploader
        multiple={false}
        files={files}
        setFiles={setFiles}
        onChange={onChange}
        fileType={watch('contents')[index].type as AutomationContentFileType}
        mode={mode}
        appendContents={appendContents}
        content={content}
      />

      {uploadError && (
        <FormMessage>{`${uploadError} ${t_fileUploader(`Errors.select_another`)}`}</FormMessage>
      )}

      {errors.contents?.[index]?.file && (
        <FormMessage>{t_err(`${errors.contents?.[index]?.file.message}`)}</FormMessage>
      )}
    </>
  );
};
