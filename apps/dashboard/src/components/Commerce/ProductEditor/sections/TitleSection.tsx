'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';

import { cn } from '@/lib/utils';

import type { ProductFormValues } from '../productEditor.schema';
import { editorInput } from '../ui/editorChrome';
import { EditorSection } from '../ui/EditorSection';

/**
 * Step ۱ — the product title.
 *
 * Plain `register`, so this input is uncontrolled: typing here re-renders nothing, not even this
 * component. The top bar's title is read with a `useWatch` at the page level instead, which
 * confines the per-keystroke render to that one bar.
 */
export const TitleSection = ({ step = 1 }: { step?: number }) => {
  const t = useTranslations('Commerce.Editor.Title');
  const {
    register,
    formState: { errors },
  } = useFormContext<ProductFormValues>();

  return (
    <EditorSection step={step} title={t('title')}>
      <input
        {...register('title')}
        aria-label={t('title')}
        placeholder={t('placeholder')}
        data-bad={errors.title ? 'empty' : undefined}
        className={cn(editorInput, 'h-12 text-lg font-bold')}
      />
      <p className={cn('mt-2 text-xs', errors.title ? 'text-dtext' : 'text-mut')}>
        {errors.title?.message ?? t('hint')}
      </p>
    </EditorSection>
  );
};
