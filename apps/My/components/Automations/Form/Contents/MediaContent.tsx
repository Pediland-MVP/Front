"use client";

import {
  AutomationContentModeEnum,
  AutomationContentTypesEnum,
} from "@/constants/automationContent.enum";
import api from "@/hooks/swr/api-client";
import { AutomationFormType } from "@/schemas/automationForm";
import { FileNamespace } from "@/types/file";
import { UploadedFile } from "@/types/fileUploader";
import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { AxiosResponse, AxiosError } from "axios";
import { toast } from "sonner";
import { FormMessage } from "@befroosh/ui";
import { MediaUploader } from "@befroosh/ui-custom";
import { useContentsUploaderContext } from "@/components";

interface MediaContentProps {
  index: number;
  mode: AutomationContentModeEnum;
  type: AutomationContentTypesEnum;
}

export const MediaContent = ({ index, mode, type }: MediaContentProps) => {
  const { files, setFiles } = useContentsUploaderContext();

  const {
    setValue,
    getValues,
    trigger,
    formState: { errors },
  } = useFormContext<AutomationFormType>();

  const t_err = useTranslations("Automations.Contents.Media.Errors");
  const t_fileUploader = useTranslations(
    "Automations.Contents.Media.FileUploader",
  );

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
          case "file-invalid-type":
            setUploadError(t_fileUploader("Errors.invalid_type"));
            break;
          case "file-too-large":
            setUploadError(t_fileUploader("Errors.file_too_large"));
            break;
          case "file-too-small":
            setUploadError(t_fileUploader("Errors.file_too_small"));
            break;
          case "too-many-files":
            setUploadError(t_fileUploader("Errors.too_many_files"));
            break;
          default:
            setUploadError(t_fileUploader("Errors.upload_failed"));
        }
      }
      return;
    }

    if (files.length === 0) {
      setValue(
        `${mode === AutomationContentModeEnum.AUTOMATION ? "contents" : "reminders"}.${index}.file`,
        null,
      );
      return;
    }

    if (files[0] && "file" in files[0]) {
      setFiles((files) => {
        return [{ ...files[0], isUploading: true, process: 0 }];
      });
      const formData = new FormData();
      formData.append("file", files[0].file);
      const res = api
        .post(
          `${process.env.NEXT_PUBLIC_BACK_API_URL}/contentCycle/upload`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            withCredentials: true,
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const process = Math.round(
                  (progressEvent.loaded / progressEvent.total) * 100,
                );
                setFiles((prev) => {
                  return [{ ...prev[0], process: process }];
                });
              }
            },
          },
        )
        .then((res: AxiosResponse<FileNamespace.File>) => {
          const originalFile = files[0];
          setFiles([
            {
              id: res.data.id,
              url: res.data.url,
              mimeType: res.data.mimeType,
              // Preserve original file info
              ...(originalFile &&
                "file" in originalFile && {
                  originalName: originalFile.file.name,
                  originalSize: originalFile.file.size,
                }),
            },
          ]);

          setValue(
            `${mode === AutomationContentModeEnum.AUTOMATION ? "contents" : "reminders"}.${index}`,
            {
              ...getValues(
                `${mode === AutomationContentModeEnum.AUTOMATION ? "contents" : "reminders"}.${index}`,
              ),
              type: res.data.mimeType.split(
                "/",
              )[0] as AutomationContentTypesEnum,
              file: {
                id: res.data.id,
                url: res.data.url,
                mimeType: res.data.mimeType,
              },
            },
          );
        })
        .catch((err: AxiosError) => {
          if (err.status === 400) {
            toast.error(
              `${t_fileUploader(`Limits.${type}.text`)}. ${t_fileUploader(`Limits.${type}.formats`)}`,
            );
          }
        })
        .finally(() => {
          setFiles((prev) => {
            return [{ ...prev[0], isUploading: false }];
          });
          trigger("contents");
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
        accept="audio/*,video/*,image/*"
      />

      {uploadError && (
        <FormMessage>{`${uploadError} ${t_fileUploader(`Errors.select_another`)}`}</FormMessage>
      )}

      {errors.contents?.[index]?.file && (
        <FormMessage>
          {t_err(`${errors.contents?.[index]?.file.message}`)}
        </FormMessage>
      )}
    </>
  );
};
