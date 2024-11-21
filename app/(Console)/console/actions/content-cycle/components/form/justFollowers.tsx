import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Control, UseFormGetValues } from "react-hook-form";
import { z } from "zod";
import { contentCycleFormSchema } from "../contentCycle";
import { useTranslations } from "next-intl";

type JustFollowersProps = {
  control: Control<z.infer<typeof contentCycleFormSchema>>;
  getValues: UseFormGetValues<z.infer<typeof contentCycleFormSchema>>;
};
export default function JustFollowers({
  control,
  getValues,
}: JustFollowersProps) {
  const t = useTranslations('Automations.JustFollowers');
  return (
    <>
      <FormField
        control={control}
        name="justFollowers"
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
              <FormLabel className="">{t('justFollowers')}</FormLabel>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {getValues().justFollowers && (
        <>
          <FormField
            control={control}
            name="followMessage"
            render={({ field, fieldState: { error } }) => (
              <FormItem>
                <FormLabel className="">{t('messageText')}</FormLabel>
                <p className="text-sm mb-1">
                  {t('helper')}
                </p>
                <FormControl>
                  <Input
                    placeholder={t('placeholder')}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                {error && <FormMessage> {error.message} </FormMessage>}
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="followCheckMessage"
            render={({ field, fieldState: { error } }) => (
              <FormItem>
                <FormLabel className="">{t('retryButton')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('retryPlaceholder')}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                {error && <FormMessage> {error.message} </FormMessage>}
              </FormItem>
            )}
          />
        </>
      )}
    </>
  );
}
