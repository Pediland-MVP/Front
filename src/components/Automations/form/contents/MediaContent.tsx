// src/components/Automations/form/Contents/MediaContent.tsx
"use client";

import {
  AutomationContentModeEnum,
  AutomationContentTypesEnum,
} from "@/constants/automationContent.enum";
import api from "@/hooks/swr/api-client";
import { AutomationFormType } from "@/schemas/automationForm";
import { ExceptionMessage } from "@/types/exceptionMessage";
import { FileNamespace } from "@/types/file";
import { UploadedFile } from "@/types/fileUploader";
import { AxiosError, AxiosResponse } from "axios";
import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";

import {
  FileUploader,
  FormMessage,
  toast,
  useContentsUploaderContext,
} from "@/components/index";

interface MediaContentProps {
  index: number;
  mode: AutomationContentModeEnum;
  type: AutomationContentTypesEnum;
}

export const MediaContent = ({ index, mode, type }: MediaContentProps) => {
  const { files, setFiles } = useContentsUploaderContext();

  const {
    control,
    setValue,
    getValues,
    trigger,
    formState: { errors },
  } = useFormContext<AutomationFormType>();

  const t_ec = useTranslations("ERROR_CODES");
  const t_err = useTranslations("Automations.Contents.Media.Errors");
  const t_fileUploader = useTranslations("FileUploader");

  const onChange = (files: UploadedFile[]) => {
    if (files.length === 0) {
      setValue(
        `${mode === AutomationContentModeEnum.AUTOMATION ? "contents" : "reminders"}.${index}.file`,
        null,
      );
    }
    
    if ("file" in files[0]) {
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
          setFiles([
            {
              id: res.data.id,
              url: res.data.url,
              mimeType: res.data.mimeType,
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
          const errorCode = t_ec(
            (err.response?.data as ExceptionMessage)?.code,
          );
          if (errorCode !== "ERROR_CODES") {
            toast({
              title: errorCode,
              variant: "destructive",
            });
            return;
          }

          if (err.status === 400) {
            toast({
              title: `${t_fileUploader(`Limits.${type}.text`)}. ${t_fileUploader(`Limits.${type}.formats`)}`,
              description: "لطفا یک فایل دیگر انتخاب کنید",
              variant: "destructive",
            });
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
      <FileUploader
        multiple={false}
        files={files}
        setFiles={setFiles}
        onChange={onChange}
        accept="audio/*,video/*,image/*"
      />

      {errors.contents?.[index]?.file && (
        <FormMessage>
          {t_err(`${errors.contents?.[index]?.file.message}`)}
        </FormMessage>
      )}
    </>
  );
};
