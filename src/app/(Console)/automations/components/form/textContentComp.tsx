// app/(Console)/automations/components/form/text/main.tsx

import { ContentCycleContentModeEnum } from "@/app/constants/contentCycleContent.enum";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import InputCounter from "@/components/ui/inputCounter";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "next-intl";

export type TextContentCompProps = {
  index: number;
  mode: ContentCycleContentModeEnum;
  control: any;
};

export default function TextContentComp({
  index,
  mode,
  control,
}: TextContentCompProps) {
  const t = useTranslations("Automations.Contents");
  const t_err = useTranslations("Automations.Errors");

  return (
    <FormField
      name={`${mode === ContentCycleContentModeEnum.CONTENT_CYCLE ? "contents" : "reminders"}.${index}.text`}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormItem>
          <Label className="mb-2 font-normal">
            {t.rich("youCanUseVars", {
              name: (chunks) => <span className="text-blue-500">{chunks}</span>,
            })}
          </Label>
          <Textarea
            className="mt-1 bg-white"
            rows={5}
            maxLength={1000}
            placeholder={t("enterYourMessage")}
            {...field} // Keep only this spread
          />
          <InputCounter text={field.value} maxLength={1000} />
          {error && <FormMessage>{t_err(error.message)}</FormMessage>}
        </FormItem>
      )}
    />
  );
}
