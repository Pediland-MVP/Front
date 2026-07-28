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
 * Step ۵ — the base price.
 *
 * These two numbers are SEEDS, never persisted on their own: they fill in a newly generated
 * variation's price. Once real variations exist the seed has nothing left to seed, and editing it
 * would silently do nothing — so the card locks instead of lying.
 *
 * "Real variations" means there is at least one variant row AND at least one axis that actually
 * HAS values. `variants.length > 0` alone is not enough: a product with no option axes still
 * carries exactly one variant row (the product itself), and that row IS what this card edits.
 *
 * And `options.length > 0` is not the right second half either — pressing "افزودن ویژگی" appends
 * an empty axis, which generates no combination at all, so the card would grey out while the
 * single implicit row it edits is still the only thing there. Only an axis with values can
 * multiply into rows, which is exactly the set `axesOfValues` keeps at payload time.
 */
export const BasePriceSection = ({ step = 5 }: { step?: number }) => {
  const t = useTranslations('Commerce.Editor.BasePrice');
  const { control } = useFormContext<ProductFormValues>();
  const selectOnFocus = useSelectOnFocus();

  const variants = useWatch({ control, name: 'variants' }) ?? [];
  const options = useWatch({ control, name: 'options' }) ?? [];
  const liveAxes = options.filter((option) => (option.values?.length ?? 0) > 0).length;
  const locked = variants.length > 0 && liveAxes > 0;

  const { field: price } = useController({ control, name: 'basePrice' });
  const { field: compare } = useController({ control, name: 'baseCompare' });

  // Mirrors `CHK_commerce_variant_compare_gt_price`: equal is as wrong as lower.
  const compareBad = price.value != null && compare.value != null && compare.value <= price.value;

  return (
    <EditorSection
      step={step}
      title={t('title')}
      cardClassName={cn(locked && 'pointer-events-none opacity-55')}
    >
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label htmlFor="base-price" className="text-mut mb-1.5 block text-xs font-bold">
            {t('price')}
          </label>
          <div className="relative">
            <input
              id="base-price"
              // TEXT, never type="number" (CLAUDE.md §18): a number input blanks Persian digits
              // before `onInputP2EHandler` can convert them.
              type="text"
              inputMode="numeric"
              disabled={locked}
              aria-label={t('price')}
              placeholder={t('pricePlaceholder')}
              {...selectOnFocus}
              onInput={onInputP2EHandler}
              value={formatAmount(price.value)}
              onChange={(e) => price.onChange(parseAmount(e.target.value))}
              onBlur={price.onBlur}
              className={cn(editorInput, 'h-[42px] ps-3 pe-16 text-base font-bold')}
            />
            <span className="text-mut pointer-events-none absolute end-3 top-3 text-xs">
              {t('tooman')}
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="base-compare" className="text-mut mb-1.5 block text-xs font-bold">
            {t('compare')}
          </label>
          <div className="relative">
            <input
              id="base-compare"
              type="text"
              inputMode="numeric"
              disabled={locked}
              aria-label={t('compare')}
              placeholder={t('comparePlaceholder')}
              data-bad={compareBad ? 'zero' : undefined}
              {...selectOnFocus}
              onInput={onInputP2EHandler}
              value={formatAmount(compare.value)}
              onChange={(e) => compare.onChange(parseAmount(e.target.value))}
              onBlur={compare.onBlur}
              className={cn(editorInput, 'text-mut h-[42px] ps-3 pe-16 text-base font-semibold')}
            />
            <span className="text-mut pointer-events-none absolute end-3 top-3 text-xs">
              {t('tooman')}
            </span>
          </div>
        </div>
      </div>

      <p className="text-mut mt-2 text-xs text-pretty">{locked ? t('locked') : t('hint')}</p>
      {compareBad && <p className="text-wtext mt-1 text-xs text-pretty">{t('compareHint')}</p>}
    </EditorSection>
  );
};
