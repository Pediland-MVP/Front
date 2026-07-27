'use client';

import { useTranslations } from 'next-intl';
import { useFormContext, useWatch } from 'react-hook-form';

import { cn } from '@/lib/utils';

import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui';

import { editorInput } from '../ui/editorChrome';
import { EditorSection } from '../ui/EditorSection';
import type { ProductFormValues } from '../productForm.schema';

/** Matches the backend's `@MaxLength(255)` on `title`. */
const TITLE_LIMIT = 255;

/**
 * Step 1 — the product title, on its own so it reads as the headline of the form.
 *
 * The design gives it a taller (48px) input at `text-lg`, deliberately unlike every other field:
 * it is the one value that ends up as the storefront's page heading.
 */
export const TitleSection = ({ step }: { step: number }) => {
  const t = useTranslations('Commerce.Editor.Basic');
  const form = useFormContext<ProductFormValues>();
  const title = useWatch({ control: form.control, name: 'title' }) ?? '';

  return (
    <EditorSection step={step} title={t('title')}>
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem className="space-y-0">
            <FormControl>
              <input
                {...field}
                maxLength={TITLE_LIMIT}
                aria-label={t('title')}
                placeholder={t('titlePlaceholder')}
                className={cn(editorInput, 'h-12 text-lg font-bold')}
              />
            </FormControl>
            {/* The hint doubles as a length counter, so the 255 cap is visible before the
                browser silently stops accepting keystrokes at the maxLength. */}
            <p className="text-mut mt-2 text-xs">
              {t('titleHint', { count: title.length, max: TITLE_LIMIT })}
            </p>
            <FormMessage />
          </FormItem>
        )}
      />
    </EditorSection>
  );
};
