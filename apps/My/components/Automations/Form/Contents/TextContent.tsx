'use client'
import { FormField, FormItem, Label, Textarea } from "@befroosh/ui";
import { InputCounter, ErrorMessage } from "@befroosh/ui-custom";
import { AutomationContentModeEnum } from "@/constants/automationContent.enum";
import { useTranslations } from "next-intl";

export type TextContentProps = {
  index: number;
  mode: AutomationContentModeEnum;
  control: any;
};

export const TextContent = ({ index, mode, control }: TextContentProps) => {
  const t = useTranslations("Automations.Contents.Text");
  const t_err = useTranslations("Automations.Contents.Text.Errors");

  return (
    <FormField
      name={`${mode === AutomationContentModeEnum.AUTOMATION ? "contents" : "reminders"}.${index}.text`}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormItem>
          <Label>
            {t.rich("you_can_use_vars", {
              name: (chunks) => <span className="text-blue-500">{chunks}</span>,
            })}
          </Label>
          <Textarea
            rows={4}
            maxLength={1000}
            {...field}
            aria-invalid={!!error}
          />
          <InputCounter text={field.value} maxLength={1000} />
          {error && <ErrorMessage>{t_err("required")}</ErrorMessage>}
        </FormItem>
      )}
    />
  );
};
