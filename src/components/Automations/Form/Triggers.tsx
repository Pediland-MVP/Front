"use client";

import { AutomationFormType } from "@/schemas/automationForm";
import { useTranslations } from "next-intl";
import { Control, useFormContext, UseFormGetValues } from "react-hook-form";
import { WizardVideoLinks } from "../wizardVideoLinks.conf";

import { HelpMeDialog } from "@/components/Global/HelpMeDialog";
import { FormField, FormLabel, Switch } from "@/components/ui";
import { ErrorMessage } from "@/components/ui-custom/ErrorMessage";
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
      <div className="flex flex-1 flex-col gap-2.5 md:flex-row md:items-center">
        <span className="text-sm font-medium">{t("user_in")}</span>

        <div className="flex flex-1 items-center gap-5">
          <FormField
            control={control}
            name="isDirect"
            render={({ field }) => (
              <div className="flex items-center gap-2">
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
                <FormLabel htmlFor="direct">{t("direct_story")}</FormLabel>
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
                  id="comment"
                  checked={field.value}
                  onCheckedChange={(val) => {
                    field.onChange(val);
                    trigger(["isDirect", "isComment"]);
                  }}
                />
                <FormLabel htmlFor="comment">{t("comment_post")}</FormLabel>
              </div>
            )}
          />
        </div>

        <HelpMeDialog
          position="top-left"
          className="left-0 top-0"
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
