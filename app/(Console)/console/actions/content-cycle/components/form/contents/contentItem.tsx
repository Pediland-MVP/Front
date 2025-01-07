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
  const {files, setFiles} = useContentsUploaderContext()
  const t_ec = useTranslations("ERROR_CODES");

  const { control, setValue } =
    useFormContext<z.infer<typeof contentCycleFormSchema>>();

  useEffect(() => {
      if (files.length === 0) {
      return;
    }
    if ("file" in files[0]) {
      logger.log("Files", files)
      const formData = new FormData();
      formData.append("file", files[0].file);
      const res = axios
        .post(`${process.env.NEXT_PUBLIC_BACK_API_URL}/upload/any`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
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
          // updateContents(index, {
          //   ...contents[index],
          //   file: {
          //     id: res.data.id,
          //     url: res.data.url,
          //   }
          // })
        })
        .catch((err: AxiosError) => {
          const errorCode = t_ec(
            (err.response?.data as ExceptionMessage)?.code
          );
          if (errorCode) {
            toast({
              title: errorCode,
              variant: "destructive",
            });
          }
        });
    }
  }, [files]);

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
              {error && <FormMessage> {error.message} </FormMessage>}
            </FormItem>
          )}
        />
      );

    case ContentCycleContentTypesEnum.AUDIO:
      return (
        <FileUploader
          multiple={false}
          value={files}
          onChange={setFiles}
          accept="audio/*"
        />
      );

    case ContentCycleContentTypesEnum.VIDEO:
      return (
        <FileUploader
          multiple={false}
          value={files}
          onChange={setFiles}
          accept="video/*"
        />
      );

    case ContentCycleContentTypesEnum.IMAGE:
      return (
        <FileUploader
          multiple={false}
          value={files}
          onChange={setFiles}
          accept="image/*"
        />
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
  defaultUploaderValue
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

  const { removeContents, updateContents, contents } = useContentsContext()


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
      ...type !== ContentCycleContentTypesEnum.TEXT && { text: undefined },
      ...(type === ContentCycleContentTypesEnum.TEXT || type === ContentCycleContentTypesEnum.INSTAGRAM_POST )&& {
        file: null
      }
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
              contents[index].type === option.value
                ? "ring-2 ring-primary"
                : ""
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
                      <Tooltip
                        {...(contents.length > 1 && { open: false })}
                      >
                        <TooltipTrigger
                          asChild
                          disabled={contents.length > 1}
                        >
                          <Checkbox
                            disabled={contents.length <= 1}
                            dir="ltr"
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                        </TooltipTrigger>
                        <TooltipContent>{t("consentTooltip")}</TooltipContent>
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
