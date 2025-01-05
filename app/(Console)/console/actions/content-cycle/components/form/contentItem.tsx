"use client";

import { useTranslations } from "next-intl";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import InstagramPostsDialog from "../../../components/instagramPosts.dialog";
import { z } from "zod";
import { contentCycleFormSchema } from "../contentCycle";

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
import { FileUploaderProvider, LazyFileUploader, useFileUploadProvider } from "@/components/theme/ui/fileUploader";
import { useFileUpload } from "@/hooks/useFileUploader";
import { use, useEffect } from "react";

type MessageByTypeProps = {
  index: number;
  type: ContentCycleContentTypesEnum;
}

export function MessageByType({ index, type }: MessageByTypeProps) {

  const {
    control,
    formState: { errors },
  } = useFormContext<z.infer<typeof contentCycleFormSchema>>();

  const {
    fields: contentsField,
    update: updateContents,
  } = useFieldArray({
    control: control,
    name: "contents",
    keyName: "_xid",
  });

  const t = useTranslations("Automations.Contents");
  const { clearFiles } = useFileUploadProvider()
  
  const { uploadFile, progress, isUploading } = useFileUpload({
    url: `${process.env.NEXT_PUBLIC_BACK_API_URL}/upload/any`,
  })

  useEffect(() => {
    clearFiles()
  },[type])
  
  switch (type) {
    case ContentCycleContentTypesEnum.INSTAGRAM_POST:
      return (
        <div className="relative flex justify-center items-center">
          <InstagramPostsDialog
            index={index}
            updateContents={updateContents}
            contents={contentsField}
          />
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
      )
    
    case ContentCycleContentTypesEnum.AUDIO:
      return (
          <LazyFileUploader uploadHandler={uploadFile} defaultFiles={[]} acceptedFileTypes={['audio/*']} multiple={false} />
      )
    
    case ContentCycleContentTypesEnum.VIDEO:
      return (
          <LazyFileUploader uploadHandler={uploadFile} defaultFiles={[]} acceptedFileTypes={['video/*']} multiple={false} />
      )
    
    case ContentCycleContentTypesEnum.IMAGE:
      return (
          <LazyFileUploader uploadHandler={uploadFile} defaultFiles={[]} acceptedFileTypes={['image/*']} multiple={false} />
      )
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
}: {
  id: string;
  index: number;
}) {
  const {
    control,
    getValues,
    formState: { errors },
    setValue,
    trigger,
  } = useFormContext<z.infer<typeof contentCycleFormSchema>>();

  const {
    fields: contentsField,
    remove: removeContents,
    append: appendContents,
    update: updateContents,
    move: moveContents,
  } = useFieldArray({
    control: control,
    name: "contents",
    keyName: "_xid",
  });

  const {files} = useFileUploadProvider()

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

  useEffect(() => {
    if (!files?.[0]?.data) {
      updateContents(index, {
        ...contentsField[index],
        file: null
      })
      return
    }
    updateContents(index, {
      ...contentsField[index],
      file: {
        id: files[0].data.id
      }
    });
  }, [files])

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
                contentsField[index].type === option.value ? "default" : "outline"
              }
              className={`h-15 flex flex-col items-center justify-cente ${
                contentsField[index].type === option.value
                  ? "ring-2 ring-primary"
                  : ""
              }`}
              onClick={() =>
                updateContents(index, {
                  ...contentsField[index],
                  type: option.value,
                })
              } // updateContents}
            >
              {option.icon}
              <span className="text-sm">{t_messageTypes(option.value)}</span>
            </Button>
          ))}
        </div>

        <div className="_content gap-3 flex flex-col w-full">
          <div className="flex flex-col gap-2 w-full">

            <MessageByType index={index} type={contentsField[index].type} />

            <FormField
              name={`contents.${index}.haveConsent`}
              control={control}
              render={({ field }) => (
                <FormItem className="flex flex-col justify-start gap-y-2">
                  <div className="flex items-center gap-x-2">
                    <FormControl>
                      <TooltipProvider>
                        <Tooltip
                          {...(contentsField.length > 1 && { open: false })}
                        >
                          <TooltipTrigger
                            asChild
                            disabled={contentsField.length > 1}
                          >
                            <Checkbox
                              disabled={contentsField.length <= 1}
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
