// app/(Console)/automations/components/form/reminder.tsx
"use client";

import {
  AutomationContentModeEnum,
  AutomationContentTypesEnum,
} from "@/constants/automationContent.enum";
import { AutomationFormType } from "@/schemas/automationForm";
import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";
import { WizardVideoLinks } from "../wizardVideoLinks.conf";
import { Contents } from "./Contents";

// UI Imports
import {
  ErrorMessage, FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage, HelpMeDialog, Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue, Switch
} from "@/components/index";

export const Reminder = () => {
  const { control, getValues, setValue, watch } =
    useFormContext<AutomationFormType>();
  const t = useTranslations("Automations.Reminder");

  const toggleReminders = (isEnabled: boolean) => {
    setValue("isRemindersEnabled", isEnabled);
    setValue(
      "reminders",
      isEnabled ? [{ type: AutomationContentTypesEnum.TEXT }] : [],
    );
  };

  if (
    watch("isComment") &&
    !watch("justFollowers") &&
    !watch("commentStartText")
  ) {
    return null;
  }

  return (
    <>
      <hr className="border-gray-100" />

      <FormField
        control={control}
        name="isRemindersEnabled"
        render={({ field }) => (
          <FormItem className="flex flex-col justify-start gap-y-2">
            <div className="relative flex items-center gap-x-2">
              <HelpMeDialog
                title={t("Help.title")}
                description={t("Help.description")}
                videoSrc={WizardVideoLinks.Automations.Hints.Reminders.video}
                position="left"
              />
              <FormControl>
                <Switch
                  dir="ltr"
                  id="reminder"
                  checked={field.value}
                  onCheckedChange={(e) => toggleReminders(e)}
                />
              </FormControl>
              <FormLabel className="">{t("isEnabled.label")}</FormLabel>
            </div>

            {field.value && (
              <>
                <FormField
                  control={control}
                  name="reminderTime"
                  render={({ field: selectField, fieldState: { error } }) => (
                    <FormItem>
                      <FormControl>
                        <Select
                          {...selectField}
                          onValueChange={selectField.onChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={t("time.placeholder")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {Array.from({ length: 23 }, (_, i) => i + 1).map(
                                (hour) => (
                                  <SelectItem key={hour} value={`${hour}`}>
                                    {hour} {t("hour")}
                                  </SelectItem>
                                ),
                              )}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      {error && (
                        <ErrorMessage>
                          {t(`time.Errors.${error.message}`)}{" "}
                        </ErrorMessage>
                      )}
                    </FormItem>
                  )}
                ></FormField>

                <Contents mode={AutomationContentModeEnum.REMINDER} />
              </>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};
