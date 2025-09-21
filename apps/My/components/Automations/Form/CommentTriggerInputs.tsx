"use client";

import { AutomationContentTypesEnum } from "@/constants/automationContent.enum";
import { AutomationFormType } from "@/schemas/automationForm";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { WizardVideoLinks } from "../wizardVideoLinks.conf";

// UI Imports
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Textarea,
} from "@befroosh/ui";
import { SeperateLine } from "@befroosh/ui-custom";
import { HelpMeDialog } from "@/components/Global";

export const CommentTriggerInputs = () => {
  const { watch, control, getValues, setValue } =
    useFormContext<AutomationFormType>();
  const t = useTranslations("Automations.CommentConsent");
  const contents = watch("contents");

  const [isActive, setIsActive] = useState(false);

  // if (!(watch("isComment") && !watch("justFollowers") && (contents?.[0]?.type === AutomationContentTypesEnum.PRODUCT || contents?.length > 1))) {
  //   setValue('commentStartText', undefined);
  //   return null
  // } else {
  //   setValue('commentStartText', t('commentStartText'));
  // }

  useEffect(() => {
    if (
      watch("isComment") &&
      !watch("justFollowers") &&
      (contents?.[0]?.type === AutomationContentTypesEnum.PRODUCT ||
        contents?.length > 1)
    ) {
      setValue("commentStartText", t("comment_start_text"));
      setIsActive(true);
      return;
    }

    setIsActive(false);
    setValue("commentStartText", undefined);
  }, [watch("isComment"), watch("justFollowers"), contents]);

  if (!isActive) {
    return null;
  }

  return (
    <>
      <div className="space-y-3">
        <FormField
          control={control}
          name="commentStartText"
          render={({ field, fieldState: { error } }) => (
            <FormItem>
              <div className="relative">
                <FormLabel>{t("start_request_message")}</FormLabel>
                <HelpMeDialog
                  title={t("Help.title")}
                  description={t("Help.description")}
                  videoSrc={
                    WizardVideoLinks.Automations.Hints.CommentConsent.video
                  }
                  position="left"
                />
              </div>
              <Textarea
                {...field}
                value={field.value ?? ""}
                placeholder={t("comment_placeholder")}
              ></Textarea>
              {error && <FormMessage>{error.message}</FormMessage>}
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="commentStartTitle"
          render={({ field, fieldState: { error } }) => (
            <FormItem>
              <FormLabel>{t("comment_start_title")}</FormLabel>
              <Textarea
                {...field}
                value={field.value ?? ""}
                placeholder={t("comment_start_title_placeholder")}
              ></Textarea>
              {error && <FormMessage>{error.message}</FormMessage>}
            </FormItem>
          )}
        />
      </div>

      <SeperateLine />
    </>
  );
};
