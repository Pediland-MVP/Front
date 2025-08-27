// src/components/Automations/form/Contents/ContentItem.tsx
"use client";

import {
  AutomationContentModeEnum,
  AutomationContentTypesEnum,
} from "@/constants/automationContent.enum";
import { AutomationFormType } from "@/schemas/automationForm";
import { UploadedFile } from "@/types/fileUploader";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslations } from "next-intl";
import { Controller, useFormContext } from "react-hook-form";

import {
  Checkbox,
  ContentButtons,
  ContentMedia,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  InstagramPostContent,
  ProductContentComp,
  TextContent,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  useContentsContext,
} from "@/components/index";
import {
  ArrowsOutCardinalIcon,
  TrashSimpleIcon,
} from "@phosphor-icons/react/dist/ssr";

interface ReturnContentProps {
  index: number;
  type: AutomationContentTypesEnum;
  mode: AutomationContentModeEnum;
}

export const ReturnContent = ({ index, type, mode }: ReturnContentProps) => {
  const t = useTranslations("Automations.Contents");

  const {
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext<AutomationFormType>();

  switch (type) {
    case AutomationContentTypesEnum.TEXT:
      return <TextContent control={control} mode={mode} index={index} />;

    case AutomationContentTypesEnum.INSTAGRAM_POST:
      return <InstagramPostContent mode={mode} index={index} />;

    case AutomationContentTypesEnum.PRODUCT:
      return <ProductContentComp mode={mode} index={index} />;

    case AutomationContentTypesEnum.BUTTON_TEMPLATE:
      return <ContentButtons mode={mode} contentIndex={index} />;

    default:
      return <ContentMedia index={index} mode={mode} type={type} />;
  }
};

export const ContentItem = ({
  id,
  index,
  mode,
  isPromotion,
  defaultUploaderValue,
}: {
  id: string;
  index: number;
  mode: AutomationContentModeEnum;
  isPromotion?: boolean;
  defaultUploaderValue?: UploadedFile | null;
}) => {
  const {
    control,
    getValues,
    formState: { errors },
    setValue,
    clearErrors,
    trigger,
  } = useFormContext<AutomationFormType>();
  const t = useTranslations("Automations.Contents");
  const t_contentTypes = useTranslations("Automations.Contents.Types");

  let { removeContents, updateContents, contents } = useContentsContext();

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const deleteContent = () => {
    removeContents(index);

    // وضعیت جدید بعد از حذف
    const newList =
      mode === AutomationContentModeEnum.AUTOMATION
        ? getValues().contents
        : getValues().reminders;

    // اگر فقط ۱ آیتم یا کمتر باقی مونده => haveConsent رو خاموش کن
    if (newList && newList.length === 1) {
      updateContents(0, {
        ...newList[0],
        haveConsent: false,
      });
    }
  };

  // *************** NEVE USED ???????
  const handleContentTypeChange = async (
    type: AutomationContentTypesEnum | "media",
  ) => {
    // Create a new content object with the selected type
    //NOTE: Default values of the new content
    const updatedContent = {
      ...contents[index],
      type,
      // Reset content-specific fields when changing type
      ...((type === AutomationContentTypesEnum.TEXT ||
        type === AutomationContentTypesEnum.INSTAGRAM_POST) && {
        file: null,
      }),
      ...(type === AutomationContentTypesEnum.PRODUCT && {
        products: [{}],
      }),
      ...(type === AutomationContentTypesEnum.BUTTON_TEMPLATE
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
      ...(type !== AutomationContentTypesEnum.TEXT && { text: undefined }),
    };

    // Update the form field
    updateContents(index, updatedContent);

    // Trigger form validation
    await trigger(
      `${mode === AutomationContentModeEnum.AUTOMATION ? "contents" : "reminders"}.${index}`,
    );

    clearErrors("contents.0.buttonTemplate");
  };

  const typeKey = contents?.[index]?.type as string | undefined;
  const typeLabelMap: Record<string, string> = {
    button_template: t_contentTypes("button_template"),
    ig_post: t_contentTypes("instagram_post"),
    media: t_contentTypes("media"),
    product: t_contentTypes("product_or_service"),
    text: t_contentTypes("text"),
  };

  const typeLabel = typeKey
    ? typeLabelMap[typeKey]
    : t_contentTypes("fallback_key");

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col items-start gap-y-4 rounded-xl border border-dashed border-blue-200/75 bg-blue-50/60 p-3 hover:border-blue-300"
    >
      <div className="_header flex w-full items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-move touch-none"
          >
            <ArrowsOutCardinalIcon
              size={18}
              className="text-gray-500 hover:text-blue-900"
            />
          </div>
          <div className="flex gap-2 text-sm font-medium text-blue-900">
            <div className="flex size-5.5 items-center justify-center rounded-full bg-blue-900 p-0 text-xs leading-px font-medium text-white">
              {index + 1}
            </div>
            {`${t_contentTypes("create_title")} ${typeLabel}`}
          </div>
        </div>
        <div>
          <TrashSimpleIcon
            size={20}
            className="cursor-pointer text-red-600"
            onClick={deleteContent}
            aria-label={t("remove_content")}
          />
        </div>
      </div>

      <div className="_content flex w-full flex-col gap-3">
        <ReturnContent
          mode={mode}
          index={index}
          type={contents?.[index]?.type}
        />

        {contents?.[index]?.type === AutomationContentTypesEnum.TEXT &&
          mode === AutomationContentModeEnum.AUTOMATION &&
          (contents.length > 1 || index > 0) &&
          index !== contents.length - 1 && (
            <FormField
              name={`contents.${index}.haveConsent`}
              control={control}
              render={({ field }) => (
                <FormItem className="flex flex-col justify-start space-y-0 gap-y-2">
                  <div className="flex items-center gap-x-2">
                    <FormControl>
                      <TooltipProvider>
                        <Tooltip
                          {...(contents.length > 1 &&
                            contents?.[index]?.type ===
                              AutomationContentTypesEnum.TEXT && {
                              open: false,
                            })}
                        >
                          <TooltipTrigger
                            asChild
                            disabled={
                              contents.length > 1 ||
                              contents?.[index]?.type !==
                                AutomationContentTypesEnum.TEXT
                            }
                          >
                            <Checkbox
                              disabled={
                                contents.length <= 1 ||
                                contents?.[index]?.type !==
                                  AutomationContentTypesEnum.TEXT
                              }
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            {contents.length <= 1
                              ? t("consentTooltip")
                              : contents?.[index]?.type !==
                                  AutomationContentTypesEnum.TEXT &&
                                t("consentTooltipType")}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormControl>
                    <FormLabel className="m-0">{t("consent")}</FormLabel>
                  </div>

                  {!!field.value && (
                    <Controller
                      name={`contents.${index}.consentText`}
                      control={control}
                      render={({ field, fieldState: { error } }) => (
                        <FormItem>
                          <Input
                            placeholder={t("consent_message")}
                            {...field}
                          />
                          {error && <FormMessage>{error.message}</FormMessage>}
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
};
