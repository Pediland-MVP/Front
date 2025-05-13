"use client";

import { useTranslations } from "next-intl";
import { Controller, useFormContext } from "react-hook-form";
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
  Paperclip,
  Storefront,
  RadioButton,
} from "@phosphor-icons/react/dist/ssr";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/theme/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ContentCycleContentModeEnum,
  ContentCycleContentTypesEnum,
} from "@/app/constants/contentCycleContent.enum";
import { Button } from "@/components/theme/ui/button";
import { FileUploader } from "@/components/theme/ui/fileUploader";
import { UploadedFile } from "@/components/theme/types/fileUploader";
import { AxiosError, AxiosResponse } from "axios";
import { toast } from "@/components/ui/use-toast";
import { ExceptionMessage } from "@/types/exceptionMessage";
import { FileNamespace } from "@/types/file";
import { useContentsUploaderContext } from "./useContentsUploaderContext";
import { useContentsContext } from "./useContentsContext";
import InstagramPostsDialog from "@/app/(Console)/automations/components/instagramPosts.dialog";
import Catalogue from "../catalogue";
import ButtonTemplate from "../buttonTemplate/buttonTemplate";
import api from "@/hooks/swr/api-client";
import { Label } from "@/components/ui/label";
import InputCounter from "@/components/theme/ui/inputCounter";
import { useTransition } from "react";

type MessageByTypeProps = {
  index: number;
  type: ContentCycleContentTypesEnum;
  mode: ContentCycleContentModeEnum;
};

function NameVariable() {
  return <mark className="text-blue-400 font-bold">#نام</mark>;
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
        null
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
                  (progressEvent.loaded / progressEvent.total) * 100
                );
                setFiles((prev) => {
                  return [{ ...prev[0], process: process }];
                });
              }
            },
          }
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
            `${mode === ContentCycleContentModeEnum.CONTENT_CYCLE ? "contents" : "reminders"}.${index}.file`,
            {
              id: res.data.id,
              url: res.data.url,
              mimeType: res.data.mimeType,
            }
          );
          setValue(
            `${mode === ContentCycleContentModeEnum.CONTENT_CYCLE ? "contents" : "reminders"}.${index}`,
            {
              ...getValues(
                `${mode === ContentCycleContentModeEnum.CONTENT_CYCLE ? "contents" : "reminders"}.${index}`
              ),
              type: res.data.mimeType.split(
                "/"
              )[0] as ContentCycleContentTypesEnum,
            }
          );
        })
        .catch((err: AxiosError) => {
          const errorCode = t_ec(
            (err.response?.data as ExceptionMessage)?.code
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
    case ContentCycleContentTypesEnum.INSTAGRAM_POST:
      return (
        <div className="relative flex justify-center items-center">
          <InstagramPostsDialog mode={mode} index={index} />
        </div>
      );
    case ContentCycleContentTypesEnum.TEXT:
      return (
        <FormField
          name={`${mode === ContentCycleContentModeEnum.CONTENT_CYCLE ? "contents" : "reminders"}.${index}.text`}
          control={control}
          render={({ field, fieldState: { error } }) => {
            return (
              <FormField
                name={`${mode === ContentCycleContentModeEnum.CONTENT_CYCLE ? "contents" : "reminders"}.${index}.text`}
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <FormItem>
                    <Label className="text-xs font-medium">
                      {t.rich("youCanUseVars", {
                        name: (chunks) => (
                          <span
                            className="text-blue-500"
                          >
                            {chunks}
                          </span>
                        ),
                      })}
                    </Label>
                    <Textarea
                      rows={5}
                      placeholder={t("enterYourMessage")}
                      {...field} // Keep only this spread
                    />
                    <InputCounter text={field.value} maxLength={1000} />
                    {error && <FormMessage>{t_err(error.message)}</FormMessage>}
                  </FormItem>
                )}
              />
            );
          }}
        />
      );

    case ContentCycleContentTypesEnum.PRODUCT:
      return <Catalogue mode={mode} index={index} />;

    case ContentCycleContentTypesEnum.BUTTON_TEMPLATE:
      return <ButtonTemplate mode={mode} contentIndex={index} />;

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
              {" "}
              {t_err(
                `${mode === ContentCycleContentModeEnum.CONTENT_CYCLE ? "contents" : "reminders"}.media.${errors.contents?.[index]?.file.message}`
              )}{" "}
            </FormMessage>
          )}
        </>
      );
  }
}

interface MessageTypeOption {
  value: ContentCycleContentTypesEnum | "media";
  label: string;
  icon: React.ReactNode;
}

//FIXME: Should be refactored
//BUG: Dont change my order!
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
    value: ContentCycleContentTypesEnum.PRODUCT,
    label: "Product",
    icon: <Storefront className="h-6 w-6" />,
  },
  {
    value: ContentCycleContentTypesEnum.BUTTON_TEMPLATE,
    label: "Button",
    icon: <RadioButton className="h-6 w-6" />,
  },
  //BUG: Dont change my order!
  {
    value: "media",
    label: "Media",
    icon: <Paperclip className="h-6 w-6" />,
  },
];

export default function ContentItem({
  id,
  index,
  mode,
  defaultUploaderValue,
}: {
  id: string;
  index: number;
  mode: ContentCycleContentModeEnum;
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
    type: ContentCycleContentTypesEnum | "media"
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
      `${mode === ContentCycleContentModeEnum.CONTENT_CYCLE ? "contents" : "reminders"}.${index}`
    );

    clearErrors("contents.0.buttonTemplate");
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-blue-50 p-3 rounded-xl flex flex-col items-start gap-y-4"
    >
      <div className="_header flex justify-between items-center w-full">
        <div {...attributes} {...listeners} className="cursor-move touch-none">
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
        {/**FIXME: Should be refactor */}
        {messageTypeOptions.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={
              (option.value === "media" &&
                ["image", "video", "audio"].includes(contents[index].type)) ||
              contents[index].type === option.value
                ? "default"
                : "outline"
            }
            className={`h-15 flex flex-col items-center justify-cente ${
              (option.value === "media" &&
                ["image", "video", "audio"].includes(contents[index].type)) ||
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
          <MessageByType
            mode={mode}
            index={index}
            type={contents[index].type}
          />

          {contents[index].type === ContentCycleContentTypesEnum.TEXT &&
            mode === ContentCycleContentModeEnum.CONTENT_CYCLE &&
            index > 0 && (
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
                              contents[index].type ===
                                ContentCycleContentTypesEnum.TEXT && {
                                open: false,
                              })}
                          >
                            <TooltipTrigger
                              asChild
                              disabled={
                                contents.length > 1 ||
                                contents[index].type !==
                                  ContentCycleContentTypesEnum.TEXT
                              }
                            >
                              <Checkbox
                                disabled={
                                  contents.length <= 1 ||
                                  contents[index].type !==
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
                                : contents[index].type !==
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
                            <Input
                              placeholder={t("consentMessage")}
                              {...field}
                            />
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
    </div>
  );
}
