// src/components/Automations/form/Contents/ContentPromotion.tsx
"use client";

import { useTranslations } from "next-intl";
import { Controller, useFormContext } from "react-hook-form";
import { z } from "zod";
import { AutomationFormSchema } from "@/schemas/automationForm";
import { useState } from "react";

// Just UI Imports Below
import {
  Button,
  Checkbox,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Label,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/index";
import {
  AutomationContentModeEnum,
  AutomationContentTypesEnum,
} from "@/constants/automationContent.enum";
import {
  ArrowsOutCardinalIcon,
  ChatIcon,
  InstagramLogoIcon,
  PaperclipIcon,
  RadioButtonIcon,
  StorefrontIcon,
  TrashSimpleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { ContentPromotionDialog } from "./ContentPromotionDialog";

interface MessageTypeOption {
  value: AutomationContentTypesEnum | "media";
  label: string;
  icon: React.ReactNode;
}

//FIXME: Should be refactored
//BUG: Dont change my order!
const messageTypeOptions: MessageTypeOption[] = [
  {
    value: AutomationContentTypesEnum.TEXT,
    label: "Text",
    icon: <ChatIcon className="h-6 w-6" />,
  },
  {
    value: AutomationContentTypesEnum.INSTAGRAM_POST,
    label: "Instagram Post",
    icon: <InstagramLogoIcon className="h-6 w-6" />,
  },
  {
    value: AutomationContentTypesEnum.PRODUCT,
    label: "Product",
    icon: <StorefrontIcon className="h-6 w-6" />,
  },
  {
    value: AutomationContentTypesEnum.BUTTON_TEMPLATE,
    label: "Button",
    icon: <RadioButtonIcon className="h-6 w-6" />,
  },
  //BUG: Dont change my order!
  {
    value: "media",
    label: "Media",
    icon: <PaperclipIcon className="h-6 w-6" />,
  },
];

export const ContentPromotion = () => {
  const {
    control,
    getValues,
    formState: { errors },
    setValue,
    clearErrors,
    trigger,
  } = useFormContext<z.infer<typeof AutomationFormSchema>>();

  //   let { removeContents, updateContents, contents } = useContentsContext();
  const contents: any[] = [];
  const updateContents = (...res: any[]) => {};
  const removeContents = (...res: any[]) => {};
  const index = 1;
  const id = 1_000_000;
  const mode = AutomationContentModeEnum.AUTOMATION;

  const t = useTranslations("Automations.Contents");
  const t_messageTypes = useTranslations("MessageTypes");

  const deleteContent = () => {
    removeContents(index);

    // if the index is 1, set the haveConsent to false because for consent we need at least 2 item
    if (index === 1) {
      updateContents(0, {
        ...(mode === AutomationContentModeEnum.AUTOMATION
          ? getValues().contents?.[0]
          : getValues().reminders?.[0]),
        haveConsent: false,
      });
    }
    trigger();
  };

  const handleMessageTypeChange = async (
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

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="flex flex-col items-start gap-y-4 rounded-xl bg-blue-50 p-3"
      onClick={() =>
        document?.getElementById(ContentPromotionDialog.name)?.click()
      }
    >
      <ContentPromotionDialog setIsOpen={setIsOpen} isOpen={isOpen} />
      <div className="_header flex w-full items-center justify-between">
        <div className="cursor-move touch-none">
          <ArrowsOutCardinalIcon size={20} />
        </div>
        <div>
          <TrashSimpleIcon
            size={22}
            className="cursor-pointer text-red-600"
            onClick={deleteContent}
            aria-label={t("removeContent")}
          />
        </div>
      </div>

      <div className="grid w-full shrink-0 grid-cols-5 items-center gap-x-2">
        {/**FIXME: Should be refactor */}
        {messageTypeOptions.map((option) => (
          <Button
            key={option.value}
            type="button"
            disabled
            variant={
              (option.value === "media" &&
                ["image", "video", "audio"].includes(
                  contents?.[index]?.type,
                )) ||
              contents?.[index]?.type === option.value
                ? "default"
                : "outline"
            }
            className={`justify-cente flex h-15 flex-col items-center ${
              (option.value === "media" &&
                ["image", "video", "audio"].includes(
                  contents?.[index]?.type,
                )) ||
              contents?.[index]?.type === option.value
                ? "ring-primary ring-2"
                : ""
            }`}
            onClick={() => handleMessageTypeChange(option.value)}
          >
            {option.icon}
            <span className="text-sm">{t_messageTypes(option.value)}</span>
          </Button>
        ))}
      </div>

      <div className="_content flex w-full flex-col gap-3">
        <div className="flex w-full flex-col gap-2">
          <FormItem>
            <Label className="text-xs font-medium">
              {t.rich("youCanUseVars", {
                name: (chunks) => (
                  <span className="text-blue-500">{chunks}</span>
                ),
              })}
              asdasds
            </Label>
            <Textarea
              disabled
              rows={5}
              placeholder={t("enterYourMessage")}
              value={t("promotionText")}
            />
          </FormItem>

          {contents?.[index]?.type === AutomationContentTypesEnum.TEXT &&
            mode === AutomationContentModeEnum.AUTOMATION &&
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
                                dir="ltr"
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
};
