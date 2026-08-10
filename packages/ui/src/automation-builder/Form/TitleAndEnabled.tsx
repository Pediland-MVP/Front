'use client';

import { AutomationFormType } from '../schemas/automationForm';
import { useTranslations } from 'next-intl';
import { Control } from 'react-hook-form';

import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

type TitleAndEnabledProps = {
  control: Control<AutomationFormType>;
  /** Rendered next to the title-field label. Replaces the dashboard-only `HelpMeDialog`
   * that used to be hardcoded here (or, before this fix, was entirely missing). */
  helpSlot?: React.ReactNode;
};

export const TitleAndEnabled = ({ control, helpSlot }: TitleAndEnabledProps) => {
  const t = useTranslations('Automations.TitleAndEnabled');

  return (
    <div className="_title-and-enabled space-y-4">
      <FormField
        control={control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center gap-1">
              <FormLabel>{t('title_label')}</FormLabel>
              {helpSlot}
            </div>
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
