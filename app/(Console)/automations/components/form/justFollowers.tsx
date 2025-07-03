
import { Control, useFormContext, UseFormGetValues } from "react-hook-form";
import { z } from "zod";
import { contentCycleFormSchema } from "../contentCycle";
import { useTranslations } from "next-intl";
// Just UI Imports Below
import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/theme/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/theme/ui/textarea";
import useUser from "@/hooks/useUser";
import { useEffect } from "react";
import HelpmeDialog from "@/components/global/helpme.dialog";
import { WizardVideoLinks } from "../../wizardVideoLinks.conf";


type JustFollowersProps = {
  control: Control<z.infer<typeof contentCycleFormSchema>>;
  getValues: UseFormGetValues<z.infer<typeof contentCycleFormSchema>>;
};
export default function JustFollowers({
  control,
  getValues,
}: JustFollowersProps) {
  const t = useTranslations('Automations.JustFollowers');
  const t_automations = useTranslations('Automations');
  const { setValue, watch } = useFormContext<z.infer<typeof contentCycleFormSchema>>()

  const { user, hasInstagram } = useUser()

  useEffect(() => {
    if (!user || !watch('justFollowers')) return;
    if (watch('followMessage')) return;
    if (hasInstagram) {
      setValue('followMessage', t_automations('followMessage', {
        username: `@${user?.instagrams[0].username}`
      }))

      setValue('followCheckMessage', t_automations('followCheckMessage'))
    }
  }, [watch('justFollowers')])

  return (
    <>
      <FormField
        control={control}
        name="justFollowers"
        render={({ field }) => (
          <FormItem className="flex flex-col justify-start gap-y-2">
            <div className="flex items-center gap-x-2 relative">
            <HelpmeDialog title={t('Help.title')} description={t('Help.description')} videoSrc={WizardVideoLinks.Automations.Hints.JustFollowers.video} position="left" />
              <FormControl>
                <Switch
                  type="button"
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
          <p className="text-sm text-muted-foreground">
            {t('helper')}
          </p>
          <FormField
            control={control}
            name="followMessage"
            render={({ field, fieldState: { error } }) => (
              <FormItem>
                <FormLabel className="">{t('messageText')}</FormLabel>
                <FormControl>
                  <Textarea
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
