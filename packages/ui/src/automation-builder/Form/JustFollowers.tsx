'use client';

import { AutomationFormType } from '../schemas/automationForm';
import { AutomationBuilderApiClient } from '../types/apiClient';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { Control, useFormContext, UseFormGetValues } from 'react-hook-form';
import useSWR from 'swr';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { AutoResizeTextarea } from '@/components/ui-custom/AutoResizeTextarea';
import { ErrorMessage } from '@/components/ui-custom/ErrorMessage';

type AutomationDefaults = {
  followMessage: string | null;
  followCheckMessage: string | null;
};

type JustFollowersProps = {
  control: Control<AutomationFormType>;
  getValues: UseFormGetValues<AutomationFormType>;
  apiClient: AutomationBuilderApiClient;
  /** Whether the current workspace/user already has a connected Instagram account. The
   * caller computes this (it used to be read here via a dashboard-only `useUser()` hook)
   * so this component stays app-agnostic — same pattern as `Contents.tsx`'s `isPromotion`. */
  hasInstagram?: boolean;
  /** Rendered next to the switch. Replaces the dashboard-only `HelpMeDialog` that used to
   * be hardcoded here. */
  helpSlot?: React.ReactNode;
};
export const JustFollowers = ({
  control,
  getValues,
  apiClient,
  hasInstagram,
  helpSlot,
}: JustFollowersProps) => {
  const t = useTranslations('Automations.JustFollowers');
  const { setValue, watch, clearErrors } = useFormContext<AutomationFormType>();

  // Same endpoint the dashboard-only `useAutomationDefaults()` hook used to call via its
  // own ambient SWR fetcher — fetched here through the injected `apiClient` instead, same
  // pattern as `AutomationSearchSelect.tsx`.
  const { data: defaults } = useSWR<AutomationDefaults>(
    '/contentCycle/automation-defaults',
    (url: string) => apiClient.get(url).then((res) => res.data),
  );

  useEffect(() => {
    if (watch('justFollowers')) {
      // Set default values when enabling
      if (!watch('followMessage') && hasInstagram) {
        setValue('followMessage', defaults?.followMessage || t('follow_message'));
      }
      if (!watch('followCheckMessage')) {
        setValue('followCheckMessage', defaults?.followCheckMessage || t('follow_check_message'));
      }
    } else {
      // Reset values and clear errors when disabling
      setValue('followMessage', '');
      setValue('followCheckMessage', '');
      clearErrors('followMessage');
      clearErrors('followCheckMessage');
    }
  }, [watch('justFollowers'), defaults]);

  return (
    <div className="_just-followers space-y-2">
      <FormField
        control={control}
        name="justFollowers"
        render={({ field }) => (
          <FormItem className="flex flex-col justify-start gap-y-2">
            <div className="relative flex items-center gap-x-2">
              {helpSlot}
              <FormControl>
                <Switch type="button" checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="">{t('title')}</FormLabel>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {getValues().justFollowers && (
        <>
          <p className="text-muted-foreground text-[13px]">{t('helper')}</p>
          <FormField
            control={control}
            name="followMessage"
            render={({ field, fieldState: { error } }) => (
              <FormItem>
                <FormLabel className="">{t('message_text')}</FormLabel>
                <FormControl>
                  <AutoResizeTextarea
                    placeholder={t('placeholder')}
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                {error && <ErrorMessage>{t('Errors.followMessage.required')}</ErrorMessage>}
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="followCheckMessage"
            render={({ field, fieldState: { error } }) => (
              <FormItem>
                <FormLabel className="">{t('retry_button')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('retry_placeholder')}
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                {error && <ErrorMessage>{t('Errors.followCheckMessage.required')}</ErrorMessage>}
              </FormItem>
            )}
          />
        </>
      )}
    </div>
  );
};
