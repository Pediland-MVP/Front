import { useFormContext } from "react-hook-form";
import { contentCycleFormSchema } from "../contentCycle";
import { z } from "zod";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/theme/ui/select";
import { Textarea } from "@/components/theme/ui/textarea";
import ErrorMessage from "@/components/ui/errorMessage";
import Contents from "./contents/contents";
import { ContentCycleContentModeEnum, ContentCycleContentTypesEnum } from "@/app/constants/contentCycleContent.enum";
import { useEffect } from "react";

export default function Reminder() {
  const { control, getValues, setValue, watch } = useFormContext<z.infer<typeof contentCycleFormSchema>>();
  const t = useTranslations("Automations.Reminder");

  const toggleReminders = (isEnabled: boolean) => {
    setValue("isRemindersEnabled", isEnabled);
    setValue("reminders", isEnabled ? [{type: ContentCycleContentTypesEnum.TEXT}] : []);
  };

  useEffect(() => {
    console.log(watch());
    
  }, [watch()])

  if (watch('isComment') && (!watch('justFollowers') && !watch('commentStartText'))) {
    return null
  }

  return (
    <FormField
      control={control}
      name="isRemindersEnabled"
      render={({ field }) => (
        <FormItem className="flex flex-col justify-start gap-y-2">
          <div className="flex items-center gap-x-2">
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
                    <FormLabel className="">{t("time.label")}</FormLabel>
                    <FormControl>
                      <Select
                        {...selectField}
                        onValueChange={selectField.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("time.placeholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {Array.from({ length: 23 }, (_, i) => i + 1).map(
                              (hour) => (
                                <SelectItem key={hour} value={`${hour}`}>
                                  {hour} {t('hour')}
                                </SelectItem>
                              )
                            )}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    {error && (
                      <ErrorMessage>
                        {" "}
                        {t(`time.Errors.${error.message}`)}{" "}
                      </ErrorMessage>
                    )}
                  </FormItem>
                )}
              ></FormField>
              <Contents mode={ContentCycleContentModeEnum.REMINDER} />
            </>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
