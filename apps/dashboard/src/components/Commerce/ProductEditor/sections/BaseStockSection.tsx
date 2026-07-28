'use client';

import { useTranslations } from 'next-intl';
import { useController, useFormContext, useWatch } from 'react-hook-form';

import { useSelectOnFocus } from '@/hooks/useSelectOnFocus';
import { cn } from '@/lib/utils';
import { onInputP2EHandler } from '@/utils/p2eNumber';

import type { ProductFormValues } from '../productEditor.schema';
import { formatAmount, parseAmount } from '../utils/editorNumber.util';
import { editorInput } from '../ui/editorChrome';
import { EditorSection } from '../ui/EditorSection';

/**
 * Step ۶ — the base stock.
 *
 * Same lock rule as step ۵, but a narrower seed: this count goes to the FIRST generated variation
 * only. Copying "۱۰ تا" across every size×colour row would invent stock the merchant never
 * counted, and inventory here is a real ledger (`InventoryService.setStock` writes a MANUAL row).
 */
export const BaseStockSection = ({ step = 6 }: { step?: number }) => {
  const t = useTranslations('Commerce.Editor.BaseStock');
  const { control } = useFormContext<ProductFormValues>();
  const selectOnFocus = useSelectOnFocus();

  const variants = useWatch({ control, name: 'variants' }) ?? [];
  const options = useWatch({ control, name: 'options' }) ?? [];
  const locked = variants.length > 0 && options.length > 0;

  const { field: stock } = useController({ control, name: 'baseStock' });

  return (
    <EditorSection
      step={step}
      title={t('title')}
      cardClassName={cn(locked && 'pointer-events-none opacity-55')}
    >
      <input
        id="base-stock"
        type="text"
        inputMode="numeric"
        disabled={locked}
        aria-label={t('label')}
        placeholder={t('placeholder')}
        {...selectOnFocus}
        onInput={onInputP2EHandler}
        value={formatAmount(stock.value)}
        onChange={(e) => stock.onChange(parseAmount(e.target.value))}
        onBlur={stock.onBlur}
        className={cn(editorInput, 'h-[42px] text-base font-bold')}
      />
      <p className="text-mut mt-2 text-xs text-pretty">{locked ? t('locked') : t('hint')}</p>
    </EditorSection>
  );
};
