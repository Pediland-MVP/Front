// app/(Console)/automations/components/form/commentConsent.tsx
"use client";

import { AutomationContentTypesEnum } from "@/constants/automationContent.enum";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { z } from "zod";
import { AutomationFormSchema } from "@/schemas/automationForm";
import { WizardVideoLinks } from "../wizardVideoLinks.conf";

// UI Imports
import {
  FormField,
  FormLabel,
  FormMessage,
  HelpMeDialog,
  Textarea,
} from "@/components/index";

export const CommentTriggerInputs = () => {
  const { watch, control, getValues, setValue } =
    useFormContext<z.infer<typeof AutomationFormSchema>>();
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
      <FormField
        control={control}
        name="commentStartText"
        render={({ field, fieldState: { error } }) => (
          <div className="relative flex items-center gap-x-2">
            <FormLabel>{t("startRequestMessage")}</FormLabel>
            <HelpMeDialog
              title={t("Help.title")}
              description={t("Help.description")}
              videoSrc={WizardVideoLinks.Automations.Hints.CommentConsent.video}
              position="top-left"
            />
            {/* <FormDescription>{t('startRequestMessageDescription')}</FormDescription> */}
            <Textarea
              {...field}
              value={field.value ?? ""}
              placeholder={t("commentPlaceholder")}
            ></Textarea>
            {error && <FormMessage>{error.message}</FormMessage>}
          </div>
        )}
      />
      <FormField
        control={control}
        name="commentStartTitle"
        render={({ field, fieldState: { error } }) => (
          <div className="space-y-1">
            <FormLabel>{t("comment_start_title")}</FormLabel>
            <Textarea
              {...field}
              value={field.value ?? ""}
              placeholder={t("commentStartTitlePlaceholder")}
            ></Textarea>
            {error && <FormMessage>{error.message}</FormMessage>}
          </div>
        )}
      />
    </>
  );
};
