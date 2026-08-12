'use client';

import {
  AutomationContentModeEnum,
  AutomationContentTypesEnum,
} from '@/constants/automationContent.enum';
import { AutomationFormType } from '@/schemas/automationForm';
import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import { WizardVideoLinks } from '../wizardVideoLinks.conf';

import { HelpMeDialog } from '@/components/Global/HelpMeDialog';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ErrorMessage } from '@/components/ui-custom/ErrorMessage';
import { dashboardAutomationApiClient } from '@/lib/automationApiClient';
import { Contents } from './Contents';

export const Reminder = () => {
  const {
    control,
    getValues,
    setValue,
    watch,
    formState: { errors },
    clearErrors,
  } = useFormContext<AutomationFormType>();
  const t = useTranslations('Automations.Reminder');

  const toggleReminders = (isEnabled: boolean) => {
    setValue('isRemindersEnabled', isEnabled);
    setValue('reminders', isEnabled ? [{ type: AutomationContentTypesEnum.TEXT }] : []);

    if (!isEnabled) {
      // Reset reminder time and clear errors when disabling
      setValue('reminderTime', undefined);
      clearErrors('reminders');
      clearErrors('reminderTime');
    }
  };

  if (watch('isComment') && !watch('justFollowers') && !watch('commentStartText')) {
    return null;
  }

  return (
    <FormField
      control={control}
      name="isRemindersEnabled"
      render={({ field }) => (
        <FormItem className="flex flex-col justify-start gap-y-3 rounded-xl border bg-white p-4 shadow-sm">
          <div className="relative flex items-center gap-x-2">
            <HelpMeDialog
              helpId="automation_reminders"
              title={t('Help.title')}
              description={t('Help.description')}
              videoSrc={WizardVideoLinks.Automations.Hints.Reminders.video}
              position="left"
            />
            <FormControl>
              <Switch
                id="reminder"
                checked={field.value}
                onCheckedChange={(e) => toggleReminders(e)}
              />
            </FormControl>
            <FormLabel className="">{t('isEnabled.label')}</FormLabel>
          </div>

          {field.value && (
            <>
              <FormField
                control={control}
                name="reminderTime"
                render={({ field: selectField, fieldState: { error } }) => (
                  <FormItem>
                    <FormControl>
                      <Select value={selectField.value || ''} onValueChange={selectField.onChange}>
                        <SelectTrigger className="w-full" aria-invalid={!!error}>
                          <SelectValue placeholder={t('time.placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {Array.from({ length: 23 }, (_, i) => i + 1).map((hour) => (
                              <SelectItem key={hour} value={`${hour}`}>
                                {hour} {t('hour')}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    {error && <ErrorMessage>{t(`time.Errors.${error.message}`)}</ErrorMessage>}
                  </FormItem>
                )}
              ></FormField>

              <Contents
                mode={AutomationContentModeEnum.REMINDER}
                apiClient={dashboardAutomationApiClient}
              />
            </>
          )}
        </FormItem>
      )}
    />
  );
};
