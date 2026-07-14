'use client';

import { AutomationContentTypesEnum } from '../constants/automationContent.enum';
import type { AutomationFormType } from '../schemas/automationForm';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { FormField, FormItem, FormLabel, FormMessage, Textarea } from '@/components/ui';

type CommentTriggerInputsProps = {
  /** Rendered next to the start-request-message label. Replaces the dashboard-only
   * `HelpMeDialog` that used to be hardcoded here. */
  helpSlot?: React.ReactNode;
};

export const CommentTriggerInputs = ({ helpSlot }: CommentTriggerInputsProps = {}) => {
  const { watch, control, getValues, setValue } = useFormContext<AutomationFormType>();
  const t = useTranslations('Automations.CommentConsent');

  // مشاهده‌ی فیلدهای لازم
  const isComment = watch('isComment');
  const justFollowers = watch('justFollowers');
  const contents = watch('contents');

  const [isActive, setIsActive] = useState(false);

  // کنترل نمایش و مقدار پیش‌فرض
  useEffect(() => {
    const shouldActivate =
      isComment &&
      !justFollowers &&
      (contents?.[0]?.type === AutomationContentTypesEnum.PRODUCT || contents?.length > 1);

    if (shouldActivate) {
      // فقط وقتی فیلد هنوز خالیه مقدار پیش‌فرض بده
      if (!getValues('commentStartText')) {
        setValue('commentStartText', t('comment_start_text'));
      }
      setIsActive(true);
    } else {
      setIsActive(false);
      // رشته خالی به‌جای undefined تا فیلد در فرم بمونه
      setValue('commentStartText', '');
    }
  }, [isComment, justFollowers, contents, getValues, setValue, t]);

  // اگر شرایط فعال نیست، هیچ چیزی نمایش نده
  if (!isActive) return null;

  return (
    <>
      <div className="space-y-3">
        {/* 🗨️ فیلد متن اصلی */}
        <FormField
          control={control}
          name="commentStartText"
          render={({ field, fieldState: { error } }) => (
            <FormItem>
              <div className="relative">
                <FormLabel>{t('start_request_message')}</FormLabel>
                {helpSlot}
              </div>
              <Textarea
                {...field}
                value={field.value ?? ''}
                placeholder={t('comment_placeholder')}
              />
              {error && <FormMessage>{error.message}</FormMessage>}
            </FormItem>
          )}
        />

        {/* 🏷️ فیلد عنوان */}
        <FormField
          control={control}
          name="commentStartTitle"
          render={({ field, fieldState: { error } }) => (
            <FormItem>
              <FormLabel>{t('comment_start_title')}</FormLabel>
              <Textarea
                {...field}
                value={field.value ?? ''}
                placeholder={t('comment_start_title_placeholder')}
              />
              {error && <FormMessage>{error.message}</FormMessage>}
            </FormItem>
          )}
        />
      </div>
    </>
  );
};
