import { useFormContext } from "react-hook-form";
// Just UI Imports Below
import { FormField, FormMessage, FormLabel } from "@/components/ui/form";
import { Textarea } from "@/components/theme/ui/textarea";
import { useTranslations } from "next-intl";
import { FormDescription } from "@/components/theme/ui/form";
import { contentCycleFormSchema } from "../contentCycle";
import { z, set } from 'zod';
import { ContentCycleContentTypesEnum } from "@/app/constants/contentCycleContent.enum";
import { useEffect, useState } from "react";

export default function CommentTriggerInputs() {
  const { watch, control, getValues, setValue } =
    useFormContext<z.infer<typeof contentCycleFormSchema>>();
  const t = useTranslations("Automations.Trigger");
  const contents = watch("contents");

  const [isActive, setIsActive] = useState(false);

  // if (!(watch("isComment") && !watch("justFollowers") && (contents?.[0]?.type === ContentCycleContentTypesEnum.PRODUCT || contents?.length > 1))) {
  //   setValue('commentStartText', undefined);
  //   return null
  // } else {
  //   setValue('commentStartText', t('commentStartText'));
  // }

  useEffect(() => {
    if (watch("isComment") && !watch("justFollowers") && (contents?.[0]?.type === ContentCycleContentTypesEnum.PRODUCT || contents?.length > 1)) {
      setValue('commentStartText', t('commentStartText'));
      setIsActive(true)
      return
    }

    setIsActive(false)
    setValue('commentStartText', undefined);
  }, [watch('isComment'), watch('justFollowers'), contents])


  if (!isActive) {
    return null
  }

  return (
    <>
      <FormField
        control={control}
        name="commentStartText"
        render={({ field, fieldState: { error } }) => (
          <div className="space-y-1">
            <FormLabel>{t("startRequestMessage")}</FormLabel>
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
