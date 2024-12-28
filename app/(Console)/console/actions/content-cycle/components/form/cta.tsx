import { Control } from "react-hook-form";
import { z } from "zod";
import { contentCycleFormSchema } from "../contentCycle";
import { useTranslations } from "next-intl";
// Just UI Imports Below
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/theme/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

type CtaProps = {
  control: Control<z.infer<typeof contentCycleFormSchema>>;
};

export default function Cta({ control }: CtaProps) {
  const t = useTranslations("Automations.Cta");
  return (

    <FormField
    control={control}
    name="haveCta"
    render={({ field }) => (
      <FormItem className="flex flex-col justify-start gap-y-2">
        <div className="flex items-center gap-x-2">
          <FormControl>
            <Checkbox
              dir="ltr"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </FormControl>
          <FormLabel className="">{t("label")}</FormLabel>
        </div>
        {
          field.value && (
            <FormField
              name="cta"
              control={control}
              render={({ field, fieldState: { error } }) => {
                return (
                  <div className="space-y-1 mb-2">
                    <Textarea {...field} placeholder={t("placeholder")} />
                    {error && <FormMessage> {error.message} </FormMessage>}
                  </div>
                );
              }}
            />
          )
        }
        <FormMessage />
      </FormItem>
    )}
    />
  );
}
