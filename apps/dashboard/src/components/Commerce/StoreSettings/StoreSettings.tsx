'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { useTranslations } from 'next-intl';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { ButtonLoading } from '@/components/ui-custom/ButtonLoading';
import { LoaderSpin } from '@/components/ui-custom/LoaderSpin';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { usePermissions } from '@/hooks/usePermissions';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { editorCard } from '@/components/Commerce/ProductEditor/ui/editorChrome';
import { cn } from '@/lib/utils';
import e2pNumbers from '@/utils/e2pNumber';

const DEFAULT_FINAL_MESSAGE_MAX = 1000;

const schema = z.object({
  defaultFinalMessage: z.string().max(DEFAULT_FINAL_MESSAGE_MAX),
});

type FormValues = z.infer<typeof schema>;

/**
 * The whole "تنظیمات فروشگاه" screen. Today it holds one field: the default `finalMessage` a new
 * PHYSICAL product is prefilled with at creation (`ProductEditorPage`). Digital products have no
 * default -- there is nothing here for them, by design (see `FinalMessageSection`'s docstring).
 */
export const StoreSettings = () => {
  const t = useTranslations('Commerce.StoreSettings');
  const t_ec = useTranslations('ERROR_CODES');
  const { can } = usePermissions();
  // Matches the backend controller: reads need PRODUCT_VIEW, the write needs PRODUCT_EDIT.
  const canEdit = can('product:edit');

  const { settings, isLoading, error, mutate, save } = useStoreSettings();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { defaultFinalMessage: '' },
  });

  // Seeded whenever the fetched row changes identity, same as a plain reset-on-load form --
  // there is no per-field drafting to protect here, unlike the multi-card shipping screen.
  useEffect(() => {
    if (!settings) return;
    form.reset({ defaultFinalMessage: settings.defaultFinalMessage ?? '' });
  }, [settings, form]);

  const value = useWatch({ control: form.control, name: 'defaultFinalMessage' }) ?? '';

  const onSubmit = async (values: FormValues) => {
    const message = values.defaultFinalMessage.trim();
    await save(message === '' ? null : message)
      .then((response) => {
        toast.success(t('saved'));
        mutate(response.data, { revalidate: false });
        form.reset({ defaultFinalMessage: response.data.data.defaultFinalMessage ?? '' });
      })
      .catch((err) => {
        const code = isAxiosError(err) ? err.response?.data?.code : undefined;
        toast.error(code ? t_ec(code) : t('saveFailed'));
      });
  };

  if (isLoading) return <LoaderSpin />;
  if (error && !settings) return <p className="text-dtext text-sm">{t('loadFailed')}</p>;

  return (
    <div className={cn(editorCard, 'max-w-2xl p-4')}>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <p className="text-mut text-sm">{t('description')}</p>

          <FormField
            control={form.control}
            name="defaultFinalMessage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('defaultFinalMessageLabel')}</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={4}
                    placeholder={t('defaultFinalMessagePlaceholder')}
                    maxLength={DEFAULT_FINAL_MESSAGE_MAX}
                    disabled={!canEdit}
                  />
                </FormControl>
                <div className="flex items-center justify-between">
                  <span className="text-mut text-xs">{t('defaultFinalMessageHint')}</span>
                  <span className="text-mut text-xs">
                    {t('count', {
                      count: e2pNumbers(String(value.length)),
                      max: e2pNumbers(String(DEFAULT_FINAL_MESSAGE_MAX)),
                    })}
                  </span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <ButtonLoading
            isLoading={form.formState.isSubmitting}
            disabled={!canEdit}
            type="submit"
            className="self-start"
          >
            {t('save')}
          </ButtonLoading>
        </form>
      </FormProvider>
    </div>
  );
};
