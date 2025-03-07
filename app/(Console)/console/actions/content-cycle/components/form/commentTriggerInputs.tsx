import { useFormContext } from "react-hook-form";
// Just UI Imports Below
import { FormField, FormMessage, FormLabel, FormDescription } from "@/components/ui/form";
import { Textarea } from "@/components/theme/ui/textarea";
import { useTranslations } from "next-intl";

export default function CommentTriggerInputs() {
  const { getValues, control } = useFormContext();
  const t = useTranslations("Automations.Trigger");

  return (
    <>
      {getValues().isComment && (
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
