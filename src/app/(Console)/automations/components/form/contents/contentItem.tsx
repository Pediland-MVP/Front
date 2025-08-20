// app/(Console)/automations/components/form/contents/contentItem.tsx
"use client";

import {
  ContentCycleContentModeEnum,
  ContentCycleContentTypesEnum,
} from "@/app/constants/contentCycleContent.enum";
import api from "@/hooks/swr/api-client";
import { ExceptionMessage } from "@/types/exceptionMessage";
import { FileNamespace } from "@/types/file";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AxiosError, AxiosResponse } from "axios";
import { useTranslations } from "next-intl";
import { Controller, useFormContext } from "react-hook-form";
import { z } from "zod";
import { contentCycleFormSchema } from "../../contentCycle";
import ButtonTemplateComp from "../buttonTemplateComp";
import { useContentsContext } from "./useContentsContext";
import { useContentsUploaderContext } from "./useContentsUploaderContext";

// UI Imports
import { UploadedFile } from "@/components/theme/types/fileUploader";
import { Badge } from "@/components/ui/badge";
import { FileUploader } from "@/components/ui/fileUploader";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/components/ui/use-toast";
import {
  ArrowsOutCardinalIcon,
  TrashIcon,
} from "@phosphor-icons/react/dist/ssr";
import TextContentComp from "../textContentComp";
import ProductContentComp from "../productContentComp";
import InstagramPostsContentComp from "../instagramPostsContentComp";

type MessageByTypeProps = {
  index: number;
  type: ContentCycleContentTypesEnum;
  mode: ContentCycleContentModeEnum;
};

function NameVariable() {
  return <mark className="font-bold text-blue-400">#نام</mark>;
}

export function MessageByType({ index, type, mode }: MessageByTypeProps) {
  const { files, setFiles } = useContentsUploaderContext();
  const t_ec = useTranslations("ERROR_CODES");
  const t_err = useTranslations("Automations.Errors");
  const t_fileUploader = useTranslations("FileUploader");
  const t = useTranslations("Automations.Contents");

  const {
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext<z.infer<typeof contentCycleFormSchema>>();

  const onChange = (files: UploadedFile[]) => {
    if (files.length === 0) {
      setValue(
        `${mode === ContentCycleContentModeEnum.CONTENT_CYCLE ? "contents" : "reminders"}.${index}.file`,
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
            `${mode === ContentCycleContentModeEnum.CONTENT_CYCLE ? "contents" : "reminders"}.${index}`,
            {
              ...getValues(
                `${mode === ContentCycleContentModeEnum.CONTENT_CYCLE ? "contents" : "reminders"}.${index}`,
              ),
              type: res.data.mimeType.split(
                "/",
              )[0] as ContentCycleContentTypesEnum,
              file:             {
                id: res.data.id,
                url: res.data.url,
                mimeType: res.data.mimeType,
              },
            },
          );

          console.log('Uploader content of that content', getValues(`${mode === ContentCycleContentModeEnum.CONTENT_CYCLE ? "contents" : "reminders"}.${index}`));
          

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
        });
    }
  };
  const { updateContents, contents } = useContentsContext();

  switch (type) {
    case ContentCycleContentTypesEnum.TEXT:
      return <TextContentComp control={control} mode={mode} index={index} />;

    case ContentCycleContentTypesEnum.INSTAGRAM_POST:
      return <InstagramPostsContentComp mode={mode} index={index} />;

    case ContentCycleContentTypesEnum.PRODUCT:
      return <ProductContentComp mode={mode} index={index} />;

    case ContentCycleContentTypesEnum.BUTTON_TEMPLATE:
      return <ButtonTemplateComp mode={mode} contentIndex={index} />;

    default:
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
              {t_err(
                `${mode === ContentCycleContentModeEnum.CONTENT_CYCLE ? "contents" : "reminders"}.media.${errors.contents?.[index]?.file.message}`,
              )}
            </FormMessage>
          )}
        </>
      );
  }
}

export default function ContentItem({
  id,
  index,
  mode,
  isPromotion,
  defaultUploaderValue,
}: {
  id: string;
  index: number;
  mode: ContentCycleContentModeEnum;
  isPromotion?: boolean;
  defaultUploaderValue?: UploadedFile | null;
}) {
  const {
    control,
    getValues,
    formState: { errors },
    setValue,
    clearErrors,
    trigger,
  } = useFormContext<z.infer<typeof contentCycleFormSchema>>();
  const t = useTranslations("Automations.Contents");
  const t_messageTypes = useTranslations("MessageTypes");

  let { removeContents, updateContents, contents } = useContentsContext();
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const deleteContent = () => {
    removeContents(index);

    // if the index is 1, set the haveConsent to false because for consent we need at least 2 item
    if (index === 1) {
      updateContents(0, {
        ...(mode === ContentCycleContentModeEnum.CONTENT_CYCLE
          ? getValues().contents?.[0]
          : getValues().reminders?.[0]),
        haveConsent: false,
      });
    }
    trigger();
  };

  const handleMessageTypeChange = async (
    type: ContentCycleContentTypesEnum | "media",
  ) => {
    // Create a new content object with the selected type
    //NOTE: Default values of the new content
    const updatedContent = {
      ...contents[index],
      type,
      // Reset content-specific fields when changing type
      ...((type === ContentCycleContentTypesEnum.TEXT ||
        type === ContentCycleContentTypesEnum.INSTAGRAM_POST) && {
        file: null,
      }),
      ...(type === ContentCycleContentTypesEnum.PRODUCT && {
        products: [{}],
      }),
      ...(type === ContentCycleContentTypesEnum.BUTTON_TEMPLATE
        ? {
            buttonTemplate: {
              text: "",
              buttons: [
                {
                  url: "",
                  text: "",
                },
              ],
            },
          }
        : {
            buttonTemplate: null,
          }),
      ...(type !== ContentCycleContentTypesEnum.TEXT && { text: undefined }),
    };

    // Update the form field
    updateContents(index, updatedContent);

    // Trigger form validation
    await trigger(
      `${mode === ContentCycleContentModeEnum.CONTENT_CYCLE ? "contents" : "reminders"}.${index}`,
    );

    clearErrors("contents.0.buttonTemplate");
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col items-start gap-y-4 rounded-xl border border-blue-200/75 bg-blue-50/50 p-3 hover:border-blue-300"
    >
      <div className="_header flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-move touch-none"
          >
            <ArrowsOutCardinalIcon size={18} className="text-gray-600" />
          </div>
          <div className="flex gap-2 text-sm font-medium text-blue-900">
            <Badge>{index + 1}</Badge>
            {`${t_messageTypes("create_title")} ${t_messageTypes(contents?.[index]?.type) ?? "عنوان محتوا"}`}
          </div>
        </div>
        <div>
          <TrashIcon
            size={20}
            className="cursor-pointer text-red-600"
            onClick={deleteContent}
            aria-label={t("removeContent")}
          />
        </div>
      </div>

      <div className="_content flex w-full flex-col gap-3">
        <MessageByType
          mode={mode}
          index={index}
          type={contents?.[index]?.type}
        />

        {contents?.[index]?.type === ContentCycleContentTypesEnum.TEXT &&
          mode === ContentCycleContentModeEnum.CONTENT_CYCLE &&
          (contents.length > 1 || index > 0) &&
          index !== contents.length - 1 && (
            <FormField
              name={`contents.${index}.haveConsent`}
              control={control}
              render={({ field }) => (
                <FormItem className="flex flex-col justify-start gap-y-2">
                  <div className="flex items-center gap-x-2">
                    <FormControl>
                      <TooltipProvider>
                        <Tooltip
                          {...(contents.length > 1 &&
                            contents?.[index]?.type ===
                              ContentCycleContentTypesEnum.TEXT && {
                              open: false,
                            })}
                        >
                          <TooltipTrigger
                            asChild
                            disabled={
                              contents.length > 1 ||
                              contents?.[index]?.type !==
                                ContentCycleContentTypesEnum.TEXT
                            }
                          >
                            <Checkbox
                              disabled={
                                contents.length <= 1 ||
                                contents?.[index]?.type !==
                                  ContentCycleContentTypesEnum.TEXT
                              }
                              dir="ltr"
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            {contents.length <= 1
                              ? t("consentTooltip")
                              : contents?.[index]?.type !==
                                  ContentCycleContentTypesEnum.TEXT &&
                                t("consentTooltipType")}
                          </TooltipContent>
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
                          {error && (
                            <FormMessage> {error.message} </FormMessage>
                          )}
                        </FormItem>
                      )}
                    />
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
      </div>
    </div>
  );
}
