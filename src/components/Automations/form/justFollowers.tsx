// app/(Console)/automations/components/form/justFollowers.tsx
"use client";

import useUser from "@/hooks/useUser";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Control, useFormContext, UseFormGetValues } from "react-hook-form";
import { z } from "zod";
import { contentCycleFormSchema } from "../contentCycle";
import { WizardVideoLinks } from "../wizardVideoLinks.conf";

// UI Imports
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage, HelpMeDialog, Input, Switch, Textarea
} from "@/components/index";

type JustFollowersProps = {
  control: Control<z.infer<typeof contentCycleFormSchema>>;
  getValues: UseFormGetValues<z.infer<typeof contentCycleFormSchema>>;
};
export const JustFollowers = ({ control, getValues }: JustFollowersProps) => {
  const t = useTranslations("Automations.JustFollowers");
  const t_automations = useTranslations("Automations");
  const { setValue, watch } =
    useFormContext<z.infer<typeof contentCycleFormSchema>>();

  const { user, hasInstagram } = useUser();

  useEffect(() => {
    if (!user || !watch("justFollowers")) return;
    if (watch("followMessage")) return;
    if (hasInstagram) {
      setValue(
        "followMessage",
        t_automations("followMessage", {
          username: `@${user?.instagrams[0].username}`,
        }),
      );

      setValue("followCheckMessage", t_automations("followCheckMessage"));
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
                  dir="ltr"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="">{t("justFollowers")}</FormLabel>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {getValues().justFollowers && (
        <>
          <p className="text-muted-foreground text-sm">{t("helper")}</p>
          <FormField
            control={control}
            name="followMessage"
            render={({ field, fieldState: { error } }) => (
              <FormItem>
                <FormLabel className="">{t("messageText")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t("placeholder")}
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
                <FormLabel className="">{t("retryButton")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("retryPlaceholder")}
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
    </div>
  );
};
