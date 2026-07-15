'use client';

import { AutomationFormType } from '@/schemas/automationForm';
import { useTranslations } from 'next-intl';
import { Control } from 'react-hook-form';

import { FormControl, FormField, FormItem, FormLabel, Input, Switch } from '@/components/ui';

type TitleAndEnabledProps = {
  control: Control<AutomationFormType>;
};

export const TitleAndEnabled = ({ control }: TitleAndEnabledProps) => {
  const t = useTranslations('Automations.TitleAndEnabled');

  return (
    <div className="_title-and-enabled space-y-4">
      <FormField
        control={control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('title_label')}</FormLabel>
            <FormControl>
              <Input placeholder={t('title_placeholder')} {...field} value={field.value ?? ''} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="enabled"
        render={({ field }) => (
          <FormItem className="flex items-center gap-x-2">
            <FormControl>
              <Switch type="button" checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <FormLabel className="mt-0">{t('enabled_label')}</FormLabel>
          </FormItem>
        )}
      />
    </div>
  );
};
