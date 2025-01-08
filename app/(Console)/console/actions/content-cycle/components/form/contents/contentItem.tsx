"use client";

import { useTranslations } from "next-intl";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { z } from "zod";
import { contentCycleFormSchema } from "../../contentCycle";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
// Just UI Imports Below
import { Textarea } from "@/components/theme/ui/textarea";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Trash,
  ArrowsOutCardinal,
  Chat,
  InstagramLogo,
  Waveform,
  Video,
  Image,
} from "@phosphor-icons/react/dist/ssr";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/theme/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ContentCycleContentTypesEnum } from "@/app/constants/contentCycleContent.enum";
import { Button } from "@/components/theme/ui/button";
import { useEffect, useState } from "react";
import { FileUploader } from "@/components/theme/ui/fileUploader";
import { UploadedFile } from "@/components/theme/types/fileUploader";
import logger from "@/app/utils/logger";
import axios, { AxiosError, AxiosResponse } from "axios";
import { toast } from "@/components/ui/use-toast";
import { ExceptionMessage } from "@/types/exceptionMessage";
import { FileNamespace } from "@/types/file";
import { useContentsUploaderContext } from "./useContentsUploaderContext";
import { useContentsContext } from "./useContentsContext";

type MessageByTypeProps = {
  index: number;
  type: ContentCycleContentTypesEnum;
  // contents: z.infer<typeof  contentCycleFormSchema>['contents']
  // updateContents: (index: number, content: z.infer<typeof  contentCycleFormSchema>['contents'][number]) => void
};

export function MessageByType({ index, type }: MessageByTypeProps) {
  const { files, setFiles } = useContentsUploaderContext();
  const t_ec = useTranslations("ERROR_CODES");
  const t_err = useTranslations("Automations.Errors");
  const t_fileUploader = useTranslations('FileUploader')

  const {
    control,
    setValue,
    formState: { errors },
  } = useFormContext<z.infer<typeof contentCycleFormSchema>>();

  const onChange = (files: UploadedFile[]) => {
    if (files.length === 0) {
      setValue(`contents.${index}.file`, null);
    }
    if ("file" in files[0]) {
      setFiles((files) => {
        return [{ ...files[0], isUploading: true, process: 0 }];
      });
      const formData = new FormData();
      formData.append("file", files[0].file);
      const res = axios
        .post(`${process.env.NEXT_PUBLIC_BACK_API_URL}/contentCycle/upload`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const process = Math.round(
                (progressEvent.loaded / progressEvent.total) * 100
              );
              setFiles((prev) => {
                return [{ ...prev[0], process: process }];
              });
            }
          },
        })
        .then((res: AxiosResponse<FileNamespace.File>) => {
          setFiles([
            {
              id: res.data.id,
              url: res.data.url,
              mimeType: res.data.mimeType,
            },
          ]);

          setValue(`contents.${index}.file`, {
            id: res.data.id,
            url: res.data.url,
            mimeType: res.data.mimeType,
          });
        })
        .catch((err: AxiosError) => {
          const errorCode = t_ec(
            (err.response?.data as ExceptionMessage)?.code
          );
          if (errorCode !== 'ERROR_CODES') {
            toast({
              title: errorCode,
              variant: "destructive",
            });
            return
          }

          if (err.status === 400) {
            toast({
              title: `${t_fileUploader(`Limits.${type}.text`)}. ${t_fileUploader(`Limits.${type}.formats`)}`,
              description: "لطفا یک فایل دیگر انتخاب کنید",
              variant: "destructive"
            })
          }

        })
        .finally(() => {
          setFiles((prev) => {
            return [{ ...prev[0], isUploading: false }];
          });
        });
    }
  };

  const t = useTranslations("Automations.Contents");

  switch (type) {
    case ContentCycleContentTypesEnum.INSTAGRAM_POST:
      return (
        <div className="relative flex justify-center items-center">
          {/* <InstagramPostsDialog
            index={index}
            updateContents={updateContents}
            contents={contents}
          /> */}
        </div>
      );
    case ContentCycleContentTypesEnum.TEXT:
      return (
        <Controller
          name={`contents.${index}.text`}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <FormItem>
              <Textarea placeholder={t("enterYourMessage")} {...field} />
              {error && (
                <FormMessage>
                  {" "}
                  {t_err(`contents.text.${error.message}`)}{" "}
                </FormMessage>
              )}
            </FormItem>
          )}
        />
      );

    case ContentCycleContentTypesEnum.AUDIO:
      return (
        <>
          <FileUploader
            multiple={false}
            files={files}
            setFiles={setFiles}
            onChange={onChange}
            accept="audio/*"
          />
          {errors.contents?.[index]?.file && (
            <FormMessage>
              {" "}
              {t_err(
                `contents.audio.${errors.contents?.[index]?.file.message}`
              )}{" "}
            </FormMessage>
          )}
        </>
      );

    case ContentCycleContentTypesEnum.VIDEO:
      return (
        <>
          <FileUploader
            multiple={false}
            files={files}
            setFiles={setFiles}
            onChange={onChange}
            accept="video/*"
          />
          {errors.contents?.[index]?.file && (
            <FormMessage>
              {" "}
              {t_err(
                `contents.video.${errors.contents?.[index]?.file.message}`
              )}{" "}
            </FormMessage>
          )}
        </>
      );
    case ContentCycleContentTypesEnum.IMAGE:
      return (
        <>
          <FileUploader
            multiple={false}
            files={files}
            setFiles={setFiles}
            onChange={onChange}
            accept="image/*"
          />
          {errors.contents?.[index]?.file && (
            <FormMessage>
              {" "}
              {t_err(
                `contents.image.${errors.contents?.[index]?.file.message}`
              )}{" "}
            </FormMessage>
          )}
        </>
      );
  }
}

interface MessageTypeOption {
  value: ContentCycleContentTypesEnum;
  label: string;
  icon: React.ReactNode;
}

const messageTypeOptions: MessageTypeOption[] = [
  {
    value: ContentCycleContentTypesEnum.TEXT,
    label: "Text",
    icon: <Chat className="h-6 w-6" />,
  },
  {
    value: ContentCycleContentTypesEnum.INSTAGRAM_POST,
    label: "Instagram Post",
    icon: <InstagramLogo className="h-6 w-6" />,
  },
  {
    value: ContentCycleContentTypesEnum.AUDIO,
    label: "Audio",
    icon: <Waveform className="h-6 w-6" />,
  },
  {
    value: ContentCycleContentTypesEnum.VIDEO,
    label: "Video",
    icon: <Video className="h-6 w-6" />,
  },
  {
    value: ContentCycleContentTypesEnum.IMAGE,
    label: "Image",
    icon: <Image className="h-6 w-6" />,
  },
];

export default function ContentItem({
  id,
  index,
  defaultUploaderValue,
}: {
  id: string;
  index: number;
  defaultUploaderValue?: UploadedFile | null;
}) {
  const {
    control,
    getValues,
    formState: { errors },
    setValue,
    trigger,
  } = useFormContext<z.infer<typeof contentCycleFormSchema>>();

  const { removeContents, updateContents, contents } = useContentsContext();

  const t = useTranslations("Automations.Contents");
  const t_messageTypes = useTranslations("MessageTypes");

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const deleteContent = () => {
    removeContents(index);
    if (index === 0) {
      setValue("isContentsEnabled", false);
    }

    // if the index is 1, set the haveConsent to false because for consent we need at least 2 item
    if (index === 1) {
      updateContents(0, {
        ...getValues().contents?.[0],
        haveConsent: false,
      });
    }
    trigger();
  };

  const handleMessageTypeChange = (type: ContentCycleContentTypesEnum) => {
    // Create a new content object with the selected type
    const updatedContent = {
      ...contents[index],
      type,
      // Reset content-specific fields when changing type
      ...(type !== ContentCycleContentTypesEnum.TEXT && { text: undefined }),
      ...((type === ContentCycleContentTypesEnum.TEXT ||
        type === ContentCycleContentTypesEnum.INSTAGRAM_POST) && {
        file: null,
      }),
    };

    // Update the form field
    updateContents(index, updatedContent);

    // Trigger form validation
    trigger(`contents.${index}`);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-blue-50 p-3 rounded-xl flex flex-col items-start gap-y-4"
    >
      <div className="_header flex justify-between items-center w-full">
        <div {...attributes} {...listeners} className="cursor-move">
          <ArrowsOutCardinal size={20} />
        </div>
        <div>
          <Trash
            size={22}
            className="text-red-600 cursor-pointer"
            onClick={deleteContent}
            aria-label={t("removeContent")}
          />
        </div>
      </div>

      <div className="w-full grid grid-cols-5 gap-x-2 shrink-0 items-center">
        {messageTypeOptions.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={
              contents[index].type === option.value ? "default" : "outline"
            }
            className={`h-15 flex flex-col items-center justify-cente ${
              contents[index].type === option.value ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => handleMessageTypeChange(option.value)}
          >
            {option.icon}
            <span className="text-sm">{t_messageTypes(option.value)}</span>
          </Button>
        ))}
      </div>

      <div className="_content gap-3 flex flex-col w-full">
        <div className="flex flex-col gap-2 w-full">
          <MessageByType index={index} type={contents[index].type} />

          <FormField
            name={`contents.${index}.haveConsent`}
            control={control}
            render={({ field }) => (
              <FormItem className="flex flex-col justify-start gap-y-2">
                <div className="flex items-center gap-x-2">
                  <FormControl>
                    <TooltipProvider>
                      <Tooltip {...((contents.length > 1 && contents[index].type === ContentCycleContentTypesEnum.TEXT) && { open: false })}>
                        <TooltipTrigger asChild disabled={contents.length > 1 || contents[index].type !== ContentCycleContentTypesEnum.TEXT}>
                          <Checkbox
                            disabled={contents.length <= 1 || contents[index].type !== ContentCycleContentTypesEnum.TEXT}
                            dir="ltr"
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                        </TooltipTrigger>
                        <TooltipContent>{contents.length <= 1 ? t("consentTooltip") : (contents[index].type !== ContentCycleContentTypesEnum.TEXT && t("consentTooltipType"))}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormControl>
                  <FormLabel className="">{t("consent")}</FormLabel>
                </div>
                {!!field.value && (
                  <Controller
                    name={`contents.${index}.consentText`}
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <FormItem>
                        <Input placeholder={t("consentMessage")} {...field} />
                        {error && <FormMessage> {error.message} </FormMessage>}
                      </FormItem>
                    )}
                  />
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}
