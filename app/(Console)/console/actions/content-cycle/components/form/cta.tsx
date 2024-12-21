import { Control } from "react-hook-form";
import { z } from "zod";
import { contentCycleFormSchema } from "../contentCycle";
import { useTranslations } from "next-intl";
// Just UI Imports Below
import { FormField, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/theme/ui/textarea";

type CtaProps = {
  control: Control<z.infer<typeof contentCycleFormSchema>>;
};

export default function Cta({ control }: CtaProps) {
  const t = useTranslations("Automations.Cta");
  return (
    <FormField
      name="cta"
      control={control}
      render={({ field, fieldState: { error } }) => {
        return (
          <div className="space-y-1 mb-2">
            <FormLabel>{t("label")}</FormLabel>
            <Textarea {...field} placeholder={t("placeholder")} />
            {error && <FormMessage> {error.message} </FormMessage>}
          </div>
        );
      }}
    ></FormField>
  );
}
