import { FormField, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Control } from "react-hook-form";
import { z } from "zod";
import { contentCycleFormSchema } from "../contentCycle";
import { useTranslations } from "next-intl";

type CtaProps = {
  control: Control<z.infer<typeof contentCycleFormSchema>>;
};

export default function Cta({ control }: CtaProps) {
  const t = useTranslations('Automations.Cta');
  return (
    <FormField
      name="cta"
      control={control}
      render={({ field, fieldState: { error } }) => {
        return (
          <div className="space-y-1">
            <FormLabel>{t('label')}</FormLabel>
            <Textarea
              {...field}
              placeholder={t('placeholder')}
            />
            {error && <FormMessage> {error.message} </FormMessage>}
          </div>
        );
      }}
    ></FormField>
  );
}
