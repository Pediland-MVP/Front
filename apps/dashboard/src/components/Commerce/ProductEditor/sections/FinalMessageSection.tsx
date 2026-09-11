'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useFormContext, useWatch } from 'react-hook-form';

import { cn } from '@/lib/utils';
import e2pNumbers from '@/utils/e2pNumber';

import type { ProductFormValues } from '../productEditor.schema';
import { editorInput } from '../ui/editorChrome';
import { EditorSection } from '../ui/EditorSection';

const FINAL_MESSAGE_MAX = 1000;

/**
 * Last step, for both kinds -- a plain-text DM sent to the buyer the moment their order is
 * marked completed (`Back`'s `dmBuyerNotify.queue.ts`). A digital seller's course link, a
 * physical seller's thank-you note, or nothing at all (physical only -- digital has no default,
 * see below). Same length cap as an automation text-content message.
 */
export const FinalMessageSection = ({
  step,
  showDefaultHint,
}: {
  step: number;
  /** True in CREATE mode, PHYSICAL kind, when the workspace has a store-settings default -- the
   * field the merchant is looking at was prefilled from it (`ProductEditorPage`'s seeding effect),
   * not typed by them, so a plain "hi" `t('hint')` would be misleading about where it came from. */
  showDefaultHint?: boolean;
}) => {
  const t = useTranslations('Commerce.Editor.FinalMessage');
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ProductFormValues>();
  const value = useWatch({ control, name: 'finalMessage' });
  const kind = useWatch({ control, name: 'kind' });

  const note = errors.finalMessage?.message ? (
    errors.finalMessage.message
  ) : kind === 'digital' ? (
    t('digitalRequiredHint')
  ) : showDefaultHint ? (
    <>
      {t('defaultPrefillHint')}{' '}
      <Link href="/products/settings" className="text-primary underline">
        {t('defaultPrefillHintLink')}
      </Link>
      .
    </>
  ) : (
    t('hint')
  );

  return (
    <EditorSection
      step={step}
      title={t('title')}
      hint={t('count', {
        count: e2pNumbers(String(value.length)),
        max: e2pNumbers(String(FINAL_MESSAGE_MAX)),
      })}
    >
      <textarea
        {...register('finalMessage')}
        aria-label={t('title')}
        placeholder={t('placeholder')}
        rows={4}
        // `maxLength` as well as the zod cap: it stops the merchant typing past what would be
        // rejected on save, same as `DescriptionSection`.
        maxLength={FINAL_MESSAGE_MAX}
        data-bad={errors.finalMessage ? 'empty' : undefined}
        className={cn(editorInput, 'h-auto resize-none py-3')}
      />
      <p className={cn('mt-2 text-xs', errors.finalMessage ? 'text-dtext' : 'text-mut')}>{note}</p>
    </EditorSection>
  );
};
