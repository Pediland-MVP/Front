'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';

import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui';

import { EditorSection } from '../ui/EditorSection';
import { MarkdownDescriptionField } from '../MarkdownDescriptionField';
import type { ProductFormValues } from '../productForm.schema';

/**
 * Step 2 — the storefront description, in markdown.
 *
 * `bare` because `MarkdownDescriptionField` draws its own card: the toolbar and the character
 * count are bands flush against the card edge, which a wrapping card with padding would break.
 */
export const DescriptionSection = ({ step }: { step: number }) => {
  const t = useTranslations('Commerce.Editor.Basic');
  const form = useFormContext<ProductFormValues>();

  return (
    <EditorSection bare step={step} title={t('description')} hint={t('descriptionHint')}>
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem className="space-y-0">
            <FormControl>
              {/* Markdown, with a render-only preview — the stored value stays raw text. */}
              <MarkdownDescriptionField value={field.value} onChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </EditorSection>
  );
};
