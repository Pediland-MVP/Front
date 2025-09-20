import { Checkbox } from "@befroosh/ui";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@befroosh/ui";
import {
  AutomationFormType
} from "@/schemas/automationForm";
import { useTranslations } from "next-intl";
import { Control } from "react-hook-form";

type LikeDirectProps = {
  control: Control<AutomationFormType>;
};

export default function LikeDirect({ control }: LikeDirectProps) {
  const t = useTranslations("Automations");
  return (
    <FormField
      control={control}
      name="likeDirect"
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
            <FormLabel className="">{t("likeCommand")}</FormLabel>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
