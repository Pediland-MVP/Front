// app/(Console)/automations/components/form/commentConsent.tsx

import { ContentCycleContentTypesEnum } from "@/app/constants/contentCycleContent.enum";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { z } from "zod";
import { WizardVideoLinks } from "../../wizardVideoLinks.conf";
import { contentCycleFormSchema } from "../contentCycle";

// UI Imports
import HelpmeDialog from "@/components/global/helpme.dialog";
import { Textarea } from "@/components/theme/ui/textarea";
import { FormField, FormLabel, FormMessage } from "@/components/ui/form";

export default function CommentConsent() {
  const { watch, control, getValues, setValue } =
    useFormContext<z.infer<typeof contentCycleFormSchema>>();
  const t = useTranslations("Automations.CommentConsent");
  const contents = watch("contents");

  const [isActive, setIsActive] = useState(false);

  // if (!(watch("isComment") && !watch("justFollowers") && (contents?.[0]?.type === ContentCycleContentTypesEnum.PRODUCT || contents?.length > 1))) {
  //   setValue('commentStartText', undefined);
  //   return null
  // } else {
  //   setValue('commentStartText', t('commentStartText'));
  // }

  useEffect(() => {
    if (
      watch("isComment") &&
      !watch("justFollowers") &&
      (contents?.[0]?.type === ContentCycleContentTypesEnum.PRODUCT ||
        contents?.length > 1)
    ) {
      setValue("commentStartText", t("commentStartText"));
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
            <HelpmeDialog
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
            <FormLabel>{t("commentStartTitle")}</FormLabel>
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
}
