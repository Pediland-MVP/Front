// src/components/Automations/form/Trigger.tsx
"use client";

import { useTranslations } from "next-intl";
import { Control, useFormContext, UseFormGetValues } from "react-hook-form";
import { z } from "zod";
import { AutomationFormSchema } from "@/schemas/automationForm";
import { WizardVideoLinks } from "../wizardVideoLinks.conf";

// UI Imports
import {
  ErrorMessage,
  FormField,
  FormLabel,
  FormMessage,
  HelpMeDialog,
  Switch,
} from "@/components/index";
import { useEffect } from "react";

type TriggersProps = {
  control: Control<z.infer<typeof AutomationFormSchema>>;
  getValues: UseFormGetValues<z.infer<typeof AutomationFormSchema>>;
};

export const Triggers = ({ control, getValues }: TriggersProps) => {
  const t = useTranslations("Automations.Triggers");
  const t_err = useTranslations("Automations.Triggers.Errors");

  const {
    formState: { errors },
    trigger,
  } = useFormContext<z.infer<typeof AutomationFormSchema>>();

  const hasTriggerError = !!(errors.isDirect || errors.isComment);

  const triggerErrorMessage =
    errors.isDirect?.message ?? errors.isComment?.message;

  useEffect(() => {
    console.log(hasTriggerError);
  }, [errors]);

  return (
    <div className="_trigger relative flex flex-col gap-2">
      <div className="flex flex-1 items-center gap-4">
        <span className="text-sm font-medium">{t("userIn")}</span>

        <div className="flex flex-1 items-center gap-4 md:gap-6">
          <FormField
            control={control}
            name="isDirect"
            render={({ field }) => (
              <div className="flex items-center gap-1.5">
                <Switch
                  type="button"
                  id="direct"
                  checked={field.value}
                  onCheckedChange={(val) => {
                    field.onChange(val);
                    trigger(["isDirect", "isComment"]);
                  }}
                />
                <FormLabel htmlFor="direct">{t("direct")}</FormLabel>
              </div>
            )}
          />
          <FormField
            control={control}
            name="isComment"
            render={({ field }) => (
              <div className="flex items-center gap-1.5">
                <Switch
                  type="button"
                  id="comment"
                  checked={field.value}
                  onCheckedChange={(val) => {
                    field.onChange(val);
                    trigger(["isDirect", "isComment"]);
                  }}
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

      {hasTriggerError && (
        <ErrorMessage>{t_err(triggerErrorMessage)}</ErrorMessage>
      )}
    </div>
  );
};
