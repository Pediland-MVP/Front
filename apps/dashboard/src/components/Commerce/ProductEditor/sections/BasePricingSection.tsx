'use client';

import { useTranslations } from 'next-intl';
import { useFormContext, useWatch } from 'react-hook-form';

import { cn } from '@/lib/utils';
import { formatNumber } from '@/utils/formatNumber';
import { onInputP2EHandler } from '@/utils/p2eNumber';
import { useSelectOnFocus } from '@/hooks/useSelectOnFocus';

import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui';

import { editorInput } from '../ui/editorChrome';
import { EditorSection } from '../ui/EditorSection';
import type { ProductFormValues } from '../productForm.schema';

/**
 * Steps 5 and 6 — the product's base price, compare-at price and opening stock.
 *
 * These are **editor-only seeds, never persisted**. `buildCreatePayload`/`buildUpdatePayload`
 * deliberately omit them; what they do is pre-fill each newly generated variation, so a merchant
 * with one price across twelve sizes types it once instead of twelve times.
 *
 * They dim once real variations exist. At that point the per-variation values are the truth, and
 * an editable "base price" sitting above a table of different prices would be lying about which
 * number wins.
 */
const numericValue = (raw: string): number | null => (raw === '' ? null : Number(raw));

/** A money input: text (never `type="number"`, which blanks Persian digits), grouped display. */
const MoneyInput = ({
  value,
  onChange,
  disabled,
  label,
  placeholder,
  testId,
  muted,
}: {
  value: number | null;
  onChange: (next: number | null) => void;
  disabled?: boolean;
  label: string;
  placeholder: string;
  testId: string;
  muted?: boolean;
}) => {
  const t = useTranslations('Commerce.Editor.Base');
  const { onFocus } = useSelectOnFocus();

  return (
    <div>
      <label className="text-mut mb-1.5 block text-xs font-bold">{label}</label>
      <div className="relative">
        <input
          inputMode="numeric"
          onInput={onInputP2EHandler}
          onFocus={onFocus}
          disabled={disabled}
          data-testid={testId}
          aria-label={label}
          placeholder={placeholder}
          value={value === null ? '' : (formatNumber(value) ?? '')}
          onChange={(e) => onChange(numericValue(e.target.value))}
          className={cn(editorInput, 'ps-3 pe-14 font-bold', muted && 'text-mut font-semibold')}
        />
        <span className="text-mut pointer-events-none absolute inset-y-0 end-3 flex items-center text-xs">
          {t('currency')}
        </span>
      </div>
    </div>
  );
};

export const BasePricingSection = ({
  priceStep,
  stockStep,
}: {
  priceStep: number;
  stockStep: number;
}) => {
  const t = useTranslations('Commerce.Editor.Base');
  const form = useFormContext<ProductFormValues>();
  const { onFocus } = useSelectOnFocus();

  const variants = useWatch({ control: form.control, name: 'variants' }) ?? [];
  const options = useWatch({ control: form.control, name: 'options' }) ?? [];
  // "Real" variations means the merchant has built a matrix — more than the single implicit row
  // a product starts with. Below that, the base fields ARE the product's price and stock.
  const isLocked = options.length > 0 && variants.length > 1;

  const basePrice = useWatch({ control: form.control, name: 'basePrice' });
  const baseCompare = useWatch({ control: form.control, name: 'baseCompare' });

  // Guarding on both being set: a compare price below the sale price is what puts a struck-out
  // number BELOW the real one on the storefront, which reads as a price rise, not a discount.
  const compareBelowPrice =
    basePrice !== null && baseCompare !== null && baseCompare > 0 && baseCompare <= basePrice;

  return (
    <div className={cn('grid gap-4 md:grid-cols-2', isLocked && 'opacity-55')}>
      <EditorSection step={priceStep} title={t('priceTitle')}>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="basePrice"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormControl>
                  <MoneyInput
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isLocked}
                    label={t('price')}
                    placeholder={t('pricePlaceholder')}
                    testId="base-price"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="baseCompare"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormControl>
                  <MoneyInput
                    muted
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isLocked}
                    label={t('compare')}
                    placeholder={t('comparePlaceholder')}
                    testId="base-compare"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <p className="text-mut mt-2 text-xs text-pretty">
          {isLocked ? t('priceLockedHint') : t('priceHint')}
        </p>
        {compareBelowPrice && (
          <p className="text-wtext mt-1.5 text-xs text-pretty" data-testid="base-compare-warning">
            {t('compareBelowPrice')}
          </p>
        )}
      </EditorSection>

      <EditorSection step={stockStep} title={t('stockTitle')}>
        <FormField
          control={form.control}
          name="baseStock"
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormControl>
                <input
                  inputMode="numeric"
                  onInput={onInputP2EHandler}
                  onFocus={onFocus}
                  disabled={isLocked}
                  data-testid="base-stock"
                  aria-label={t('stockTitle')}
                  placeholder={t('stockPlaceholder')}
                  value={field.value === null ? '' : (formatNumber(field.value) ?? '')}
                  onChange={(e) => field.onChange(numericValue(e.target.value))}
                  className={cn(editorInput, 'font-bold')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <p className="text-mut mt-2 text-xs text-pretty">
          {isLocked ? t('stockLockedHint') : t('stockHint')}
        </p>
      </EditorSection>
    </div>
  );
};
