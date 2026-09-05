'use client';

import { useTranslations } from 'next-intl';
import { useFormContext, useWatch } from 'react-hook-form';

import { cn } from '@/lib/utils';
import e2pNumbers from '@/utils/e2pNumber';

import type { ProductFormValues } from '../productEditor.schema';
import { editorCard } from '../ui/editorChrome';
import { EditorSection } from '../ui/EditorSection';

/**
 * Step ۲ — the description, as PLAIN TEXT with a hard cap.
 *
 * This used to be a WYSIWYG contentEditable storing markdown, with a push/pull arbitration to stop
 * the caret jumping. All of that is gone, and none of it is missed: the field's only live consumer
 * is the Instagram DM carousel card, whose generic-template subtitle is `price — description`
 * inside ~80 characters. Markdown was never rendered there, and anything past the cap was silently
 * cropped by Instagram — so the editor was letting merchants write formatted prose no buyer would
 * ever see.
 *
 * 60 is the cap because the price prefix is variable-width: a nine-digit toman figure plus its
 * separator costs 20 of the 80. At 60 the counter is honest for every product, whatever it costs.
 */
export const DESCRIPTION_MAX_LENGTH = 60;

export const DescriptionSection = ({ step = 2 }: { step?: number }) => {
  const t = useTranslations('Commerce.Editor.Description');
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ProductFormValues>();

  const description = useWatch({ control, name: 'description' }) ?? '';

  return (
    <EditorSection bare step={step} title={t('title')} hint={t('hint')}>
      <div className={cn(editorCard, 'overflow-hidden')}>
        <textarea
          {...register('description')}
          data-testid="description-input"
          // `maxLength` as well as the zod cap: it stops the merchant typing into text that would
          // be rejected on save, rather than telling them afterwards.
          maxLength={DESCRIPTION_MAX_LENGTH}
          aria-invalid={errors.description ? true : undefined}
          aria-label={t('title')}
          placeholder={t('placeholder')}
          // `resize-none`, not just an absent `resize-y`: Tailwind's own preflight sets
          // `textarea { resize: vertical }` on every textarea, so the grip is the DEFAULT, not
          // something a class here would add. Only an explicit override removes it.
          className="bg-card min-h-[170px] w-full resize-none px-3.5 py-3.5 text-sm leading-8 outline-none focus:shadow-[inset_0_0_0_2px_var(--primary)]"
        />

        <div
          data-testid="description-count"
          className={cn(
            'border-lnv border-t px-3 py-2 text-xs',
            errors.description ? 'bg-dtint text-dtext' : 'bg-muted text-mut',
          )}
        >
          {errors.description?.message ??
            t('count', {
              count: e2pNumbers(String(description.length)),
              max: e2pNumbers(String(DESCRIPTION_MAX_LENGTH)),
            })}
        </div>
      </div>
    </EditorSection>
  );
};
