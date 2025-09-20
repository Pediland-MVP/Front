// app/(Console)/automations/components/form/justFollowers.tsx
"use client";

import useUser from "@/hooks/useUser";
import { AutomationFormType } from "@/schemas/automationForm";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Control, useFormContext, UseFormGetValues } from "react-hook-form";
import { WizardVideoLinks } from "../wizardVideoLinks.conf";

// UI Imports
import {
  ErrorMessage,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  HelpMeDialog,
  Input,
  Switch,
  Textarea,
} from "@/components/index";

type JustFollowersProps = {
  control: Control<AutomationFormType>;
  getValues: UseFormGetValues<AutomationFormType>;
};
export const JustFollowers = ({ control, getValues }: JustFollowersProps) => {
  const t = useTranslations("Automations.JustFollowers");
  const { setValue, watch, clearErrors } = useFormContext<AutomationFormType>();

  const { user, hasInstagram } = useUser();

  useEffect(() => {
    if (!user) return;
    
    if (watch("justFollowers")) {
      // Set default values when enabling
      if (!watch("followMessage") && hasInstagram) {
        setValue(
          "followMessage",
          t("follow_message", {
            username: `@${user?.instagrams[0].username}`,
          }),
        );
      }
      if (!watch("followCheckMessage")) {
        setValue("followCheckMessage", t("follow_check_message"));
      }
    } else {
      // Reset values and clear errors when disabling
      setValue("followMessage", "");
      setValue("followCheckMessage", "");
      clearErrors("followMessage");
      clearErrors("followCheckMessage");
    }
  }, [watch("justFollowers")]);

  return (
    <div className="_just-followers space-y-2">
      <FormField
        control={control}
        name="justFollowers"
        render={({ field }) => (
          <FormItem className="flex flex-col justify-start gap-y-2">
            <div className="relative flex items-center gap-x-2">
              <HelpMeDialog
                title={t("Help.title")}
                description={t("Help.description")}
                videoSrc={
                  WizardVideoLinks.Automations.Hints.JustFollowers.video
                }
                position="left"
              />
              <FormControl>
                <Switch
                  type="button"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="">{t("title")}</FormLabel>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {getValues().justFollowers && (
        <>
          <p className="text-muted-foreground text-[13px]">{t("helper")}</p>
          <FormField
            control={control}
            name="followMessage"
            render={({ field, fieldState: { error } }) => (
              <FormItem>
                <FormLabel className="">{t("message_text")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t("placeholder")}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                {error && (
                  <ErrorMessage>
                    {t("Errors.followMessage.required")}
                  </ErrorMessage>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="followCheckMessage"
            render={({ field, fieldState: { error } }) => (
              <FormItem>
                <FormLabel className="">{t("retry_button")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("retry_placeholder")}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                {error && (
                  <ErrorMessage>
                    {t("Errors.followCheckMessage.required")}
                  </ErrorMessage>
                )}
              </FormItem>
            )}
          />
        </>
      )}
    </div>
  );
};
