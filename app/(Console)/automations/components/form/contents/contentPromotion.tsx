"use client";

import { useTranslations } from "next-intl";
import { Controller, useFormContext } from "react-hook-form";
import { z } from "zod";
import { contentCycleFormSchema } from "../../contentCycle";

// Just UI Imports Below
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
import { Label } from "@/components/theme/ui/label";
import { Textarea } from "@/components/theme/ui/textarea";
import InputCounter from "@/components/theme/ui/inputCounter";
import ContentPromotionDialog from "./contentPromotion.dialog";
import { useState } from "react";

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

export default function ContentPromotion() {
  const {
    control,
    getValues,
    formState: { errors },
    setValue,
    clearErrors,
    trigger,
  } = useFormContext<z.infer<typeof contentCycleFormSchema>>();

  //   let { removeContents, updateContents, contents } = useContentsContext();
  const contents: any[] = [];
  const updateContents = (...res: any[]) => {};
  const removeContents = (...res: any[]) => {};
  const index = 1;
  const id = 1_000_000;
  const mode = ContentCycleContentModeEnum.CONTENT_CYCLE;

  const t = useTranslations("Automations.Contents");
  const t_messageTypes = useTranslations("MessageTypes");

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

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="bg-blue-50 p-3 rounded-xl flex flex-col items-start gap-y-4"
      onClick={() =>
        document?.getElementById(ContentPromotionDialog.name)?.click()
      }
    >
      <ContentPromotionDialog setIsOpen={setIsOpen} isOpen={isOpen} />
      <div className="_header flex justify-between items-center w-full">
        <div className="cursor-move touch-none">
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
            disabled
            variant={
              (option.value === "media" &&
                ["image", "video", "audio"].includes(
                  contents?.[index]?.type
                )) ||
              contents?.[index]?.type === option.value
                ? "default"
                : "outline"
            }
            className={`h-15 flex flex-col items-center justify-cente ${
              (option.value === "media" &&
                ["image", "video", "audio"].includes(
                  contents?.[index]?.type
                )) ||
              contents?.[index]?.type === option.value
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
          <FormItem>
            <Label className="text-xs font-medium">
              {t.rich("youCanUseVars", {
                name: (chunks) => (
                  <span className="text-blue-500">{chunks}</span>
                ),
              })}
            </Label>
            <Textarea
              disabled
              rows={5}
              placeholder={t("enterYourMessage")}
              value={t("promotionText")}
            />
          </FormItem>

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
