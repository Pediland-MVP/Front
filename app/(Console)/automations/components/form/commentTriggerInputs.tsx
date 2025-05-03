import { useFormContext } from "react-hook-form";
// Just UI Imports Below
import {
  FormField,
  FormMessage,
  FormLabel
} from "@/components/ui/form";
import { Textarea } from "@/components/theme/ui/textarea";
import { useTranslations } from "next-intl";
import { FormDescription } from "@/components/theme/ui/form";
import { contentCycleFormSchema } from '../contentCycle';
import { z } from 'zod'
import { ContentCycleContentTypesEnum } from "@/app/constants/contentCycleContent.enum";
import { useEffect } from "react";

export default function CommentTriggerInputs() {
  const { watch, control, getValues } = useFormContext<z.infer<typeof contentCycleFormSchema>>();
  const t = useTranslations("Automations.Trigger");
  const contents = watch('contents')
  return (
    <>
      {watch("isComment") && !watch("justFollowers") && (contents?.[0]?.type === ContentCycleContentTypesEnum.PRODUCT || contents?.length > 1) &&  (
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
      )}
    </>
  );
}
