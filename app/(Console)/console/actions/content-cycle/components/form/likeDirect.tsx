import { FormField, FormItem, FormControl, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Control } from "react-hook-form";
import { z } from "zod";
import { contentCycleFormSchema } from "../contentCycle";
import { useTranslations } from "next-intl";

type LikeDirectProps = {
    control: Control<z.infer<typeof contentCycleFormSchema>>;
  };

export default function LikeDirect({ control }: LikeDirectProps) {
    const t = useTranslations('Automations')
    return (
        <FormField
        control={control}
        name="likeDirect"
        render={({ field }) => (
          <FormItem className="flex flex-col justify-start gap-y-2">
            <div className="flex items-center gap-x-2">
              <FormControl>
                <Switch
                  dir="ltr"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="">
                {t('likeCommand')}
              </FormLabel>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    )

}