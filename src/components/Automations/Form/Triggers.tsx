// src/components/Automations/form/Trigger.tsx
"use client";

import { AutomationFormType } from "@/schemas/automationForm";
import { useTranslations } from "next-intl";
import { Control, useFormContext, UseFormGetValues } from "react-hook-form";
import { WizardVideoLinks } from "../wizardVideoLinks.conf";

// UI Imports
import {
  ErrorMessage,
  FormField,
  FormLabel,
  HelpMeDialog,
  Switch,
} from "@/components/index";
import { toast } from "sonner";

type TriggersProps = {
  control: Control<AutomationFormType>;
  getValues: UseFormGetValues<AutomationFormType>;
};

export const Triggers = ({ control, getValues }: TriggersProps) => {
  const t = useTranslations("Automations.Triggers");
  const t_err = useTranslations("Automations.Triggers.Errors");

  const {
    formState: { errors },
    trigger,
  } = useFormContext<AutomationFormType>();

  const hasTriggerError = !!(errors.isDirect || errors.isComment);

  const triggerErrorMessage =
    errors.isDirect?.message ?? errors.isComment?.message;

  return (
    <div className="_trigger relative flex flex-col gap-2">
      <div className="flex flex-1 items-center gap-4">
        <span className="text-sm font-medium">{t("user_in")}</span>

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
                    const isCommentContentTargetEnabled = getValues(
                      "isCommentContentTargetEnabled",
                    );

                    if (isCommentContentTargetEnabled && val === true) {
                      toast.error(
                        "زمانی که گزینه محدود کردن به پست خاص فعال است نمی‌توانید دایرکت را فعال کنید.",
                      );
                      return;
                    }

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
