'use client';

import { useTranslations } from 'next-intl';
import { useFormContext, useWatch } from 'react-hook-form';

import { cn } from '@/lib/utils';

import type { ProductFormValues } from '../productEditor.schema';
import { editorInput } from '../ui/editorChrome';
import { EditorSection } from '../ui/EditorSection';

const FINAL_MESSAGE_MAX = 1000;

/**
 * Last step, for both kinds -- a plain-text DM sent to the buyer the moment their order is
 * marked completed (`Back`'s `dmBuyerNotify.queue.ts`). A digital seller's course link, a
 * physical seller's thank-you note, or nothing at all. Same length cap as an automation
 * text-content message.
 */
export const FinalMessageSection = ({ step }: { step: number }) => {
  const t = useTranslations('Commerce.Editor.FinalMessage');
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ProductFormValues>();
  const value = useWatch({ control, name: 'finalMessage' });

  return (
    <EditorSection
      step={step}
      title={t('title')}
      hint={t('count', { count: value.length, max: FINAL_MESSAGE_MAX })}
    >
      <textarea
        {...register('finalMessage')}
        aria-label={t('title')}
        placeholder={t('placeholder')}
        rows={4}
        data-bad={errors.finalMessage ? 'empty' : undefined}
        className={cn(editorInput, 'h-auto resize-none py-3')}
      />
      <p className={cn('mt-2 text-xs', errors.finalMessage ? 'text-dtext' : 'text-mut')}>
        {errors.finalMessage?.message ?? t('hint')}
      </p>
    </EditorSection>
  );
};
