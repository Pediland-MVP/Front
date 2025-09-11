// app/(Console)/automations/components/form/trigger.tsx

import { useTranslations } from "next-intl";
import { Control, useFormContext, UseFormGetValues } from "react-hook-form";
import { z } from "zod";
import { contentCycleFormSchema } from '../contentCycle';

// UI Imports
import HelpmeDialog from "@/components/global/helpme.dialog";
import { FormField, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { WizardVideoLinks } from "../../wizardVideoLinks.conf";

type TriggerProps = {
  control: Control<z.infer<typeof contentCycleFormSchema>>;
  getValues: UseFormGetValues<z.infer<typeof contentCycleFormSchema>>;
};

export default function Trigger({ control, getValues }: TriggerProps) {
  const t = useTranslations("Automations.Trigger");
  const {watch} = useFormContext<z.infer<typeof contentCycleFormSchema>>()

  return (
    <div className="_trigger relative flex flex-col items-center w-full">
      <div className="relative flex items-center gap-4 md:gap-6">

      <span className="text-sm font-medium">{t("userIn")}</span>

      <div className="flex flex-1 items-center gap-4 md:gap-6">
        <FormField
          control={control}
          name="isDirect"
          render={({ field }) => (
            <div className="flex items-center gap-2">
              <FormMessage />
              <Switch
                dir="ltr"
                id="direct"
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={!!watch('isCommentContentTargetEnabled')}
              />
              <FormLabel htmlFor="direct">{t("direct")}</FormLabel>
            </div>
          )}
        />
        <FormField
          control={control}
          name="isComment"
          render={({ field }) => (
            <div className="flex items-center gap-2">
              <Switch
                type="button"
                dir="ltr"
                id="direct"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
              <FormLabel htmlFor="direct">{t("comment")}</FormLabel>
            </div>
          )}
        />
      </div>
      <HelpmeDialog
        noAbsolute
        title={t("Help.title")}
        description={t("Help.description")}
        videoSrc={WizardVideoLinks.Automations.Hints.Triggers.video}
      />
      </div>

      {watch('isCommentContentTargetEnabled') && (<div className="mt-2">
        <p className="text-xs">برای روشن کردن حالت دایرکت باید محدود کردن به پست خاص را خاموش کنید</p>
      </div>)}
    </div>
  );
}
