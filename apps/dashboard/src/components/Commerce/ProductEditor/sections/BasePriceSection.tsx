'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useController, useFormContext, useWatch } from 'react-hook-form';

import { Switch } from '@/components/ui/switch';
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

  /**
   * Whether the product is on sale. This is UI state, NOT form data — the backend has no such
   * flag, it infers "on sale" from `comparePrice` being present at all. Adding a field to
   * `ProductFormValues` for it would mean carrying something every payload builder has to
   * remember to strip.
   *
   * The switch has to follow the form value in, because the value arrives from places the user
   * never touched: in edit mode the product loads AFTER this mounts and resets the form, and
   * Revert does the same. Seeding `useState` once would leave a product that has a compare
   * price rendering with the switch off and the field greyed out over its own data.
   */
  const [onSale, setOnSale] = useState(compare.value != null);

  /**
   * The last value this component itself wrote. Without it, clearing the input mid-edit reads
   * as "value became null" and flips the switch off under the user's cursor — the field then
   * disables itself while they are still typing in it. Same one-way arbitration the description
   * editor uses for its contentEditable.
   */
  const lastLocal = useRef<number | null | undefined>(undefined);

  useEffect(() => {
    if (compare.value === lastLocal.current) return; // our own edit — leave the switch alone
    setOnSale(compare.value != null);
  }, [compare.value]);

  const writeCompare = (next: number | null) => {
    lastLocal.current = next;
    compare.onChange(next);
  };

  const toggleSale = (next: boolean) => {
    setOnSale(next);
    // Turning it off must clear the value, not just hide it: a stale compare price left in the
    // form would still be sent on save and the product would stay discounted.
    if (!next) writeCompare(null);
  };

  // Mirrors `CHK_commerce_variant_compare_gt_price`: equal is as wrong as lower. Only meaningful
  // while the sale is on — a disabled, null field can never be in violation.
  const compareBad =
    onSale && price.value != null && compare.value != null && compare.value <= price.value;

  return (
    <EditorSection
      step={step}
      title={t('title')}
      cardClassName={cn(locked && 'pointer-events-none opacity-55')}
    >
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          {/* h-5 matches the compare column, whose label row also holds the switch — without a
              shared height the two inputs sit a couple of pixels apart. */}
          <div className="mb-1.5 flex h-5 items-center">
            <label htmlFor="base-price" className="text-mut text-xs font-bold">
              {t('price')}
            </label>
          </div>
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
          <div className="mb-1.5 flex h-5 items-center gap-2">
            <label htmlFor="base-compare" className="text-mut text-xs font-bold">
              {t('compare')}
            </label>
            <Switch
              id="base-sale"
              checked={onSale}
              disabled={locked}
              aria-label={t('hasDiscount')}
              onCheckedChange={toggleSale}
              className="ms-auto"
            />
          </div>
          <div className="relative">
            <input
              id="base-compare"
              type="text"
              inputMode="numeric"
              // Locked (the product has real variations) OR simply not on sale. Both mean the
              // seed is not editable, and a disabled input is also skipped by tab order.
              disabled={locked || !onSale}
              aria-label={t('compare')}
              placeholder={onSale ? t('comparePlaceholder') : t('noDiscount')}
              data-bad={compareBad ? 'zero' : undefined}
              {...selectOnFocus}
              onInput={onInputP2EHandler}
              value={formatAmount(compare.value)}
              onChange={(e) => writeCompare(parseAmount(e.target.value))}
              onBlur={compare.onBlur}
              className={cn(
                editorInput,
                'text-mut h-[42px] ps-3 pe-16 text-base font-semibold',
                'disabled:cursor-not-allowed disabled:opacity-55',
              )}
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
