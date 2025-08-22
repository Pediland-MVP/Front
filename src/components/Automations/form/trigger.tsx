// src/components/Automations/form/Trigger.tsx

import { useTranslations } from "next-intl";
import { Control, UseFormGetValues } from "react-hook-form";
import { z } from "zod";
import { contentCycleFormSchema } from "../contentCycle";

// UI Imports
import { FormField, FormLabel, FormMessage, HelpMeDialog, Switch } from "@/components/index";
import { WizardVideoLinks } from "../wizardVideoLinks.conf";

type TriggerProps = {
  control: Control<z.infer<typeof contentCycleFormSchema>>;
  getValues: UseFormGetValues<z.infer<typeof contentCycleFormSchema>>;
};

export const Trigger = ({ control, getValues }: TriggerProps) => {
  const t = useTranslations("Automations.Trigger");

  return (
    <div className="_trigger relative flex items-center gap-4 md:gap-6">
      <span className="text-sm font-medium">{t("userIn")}</span>

      <div className="flex flex-1 items-center gap-4 md:gap-6">
        <FormField
          control={control}
          name="isDirect"
          render={({ field }) => (
            <div className="flex items-center gap-2">
              <FormMessage />
              <Switch
                type="button"
                dir="ltr"
                id="direct"
                checked={field.value}
                onCheckedChange={field.onChange}
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
                id="comment"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
              <FormLabel htmlFor="comment">{t("comment")}</FormLabel>
            </div>
          )}
        />
      </div>

      <HelpMeDialog
        noAbsolute
        title={t("Help.title")}
        description={t("Help.description")}
        videoSrc={WizardVideoLinks.Automations.Hints.Triggers.video}
      />
    </div>
  );
};
