import { Control } from "react-hook-form";
import { z } from "zod";
import { contentCycleFormSchema } from "../contentCycle";
import { useTranslations } from "next-intl";
// Just UI Imports Below
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/theme/ui/input";

type TitleProps = {
  control: Control<z.infer<typeof contentCycleFormSchema>>;
};
export default function ContentCycleTitle({ control }: TitleProps) {
  const t = useTranslations("Automations.Title");
  return (
    <FormField
      control={control}
      name="title"
      render={({ field, fieldState: { error } }) => (
        <FormItem>
          <FormLabel>{t("title")}</FormLabel>
          <FormControl>
            <Input {...field} placeholder={t("placeholder")} />
          </FormControl>
          {error && <FormMessage> {error.message} </FormMessage>}
        </FormItem>
      )}
    />
  );
}
