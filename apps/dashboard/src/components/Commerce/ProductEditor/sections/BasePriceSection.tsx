'use client';

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
 * Step ۶ — the price.
 *
 * "Real variations" means there is at least one variant row AND at least one axis that actually
 * HAS values. `variants.length > 0` alone is not enough: a product with no option axes still
 * carries exactly one variant row (the product itself), and that row IS what this card edits.
 *
 * And `options.length > 0` is not the right second half either — pressing "افزودن ویژگی" appends
 * an empty axis, which generates no combination at all, so the card would grey out while the
 * single implicit row it edits is still the only thing there. Only an axis with values can
 * multiply into rows, which is exactly the set `axesOfValues` keeps at payload time.
 *
 * UNLOCKED, these numbers ARE the product's price — they are written into `variants[0]` directly.
 * They used to be written only to `basePrice`/`baseCompare`, which `useVariantSync` reads when it
 * GENERATES rows; for a product that never got an axis nothing ever generated, so the price typed
 * here went nowhere and Save failed pointing at the one-row grid below instead.
 *
 * The seeds are still written alongside, because they are what survives the first axis added: the
 * implicit row carries no option values, so `donorOf` never matches it and the rows generated in
 * its place fall back to the seeds.
 *
 * LOCKED (the product has real variations), the seeds are all that is left to show — per-variant
 * prices live in the grid, and the hint says so.
 */
export const BasePriceSection = ({ step = 6 }: { step?: number }) => {
  const t = useTranslations('Commerce.Editor.BasePrice');
  const { control, setValue } = useFormContext<ProductFormValues>();
  const selectOnFocus = useSelectOnFocus();

  const variants = useWatch({ control, name: 'variants' }) ?? [];
  const options = useWatch({ control, name: 'options' }) ?? [];
  const liveAxes = options.filter((option) => (option.values?.length ?? 0) > 0).length;
  const locked = variants.length > 0 && liveAxes > 0;

  const { field: seedPrice } = useController({ control, name: 'basePrice' });
  const { field: seedCompare } = useController({ control, name: 'baseCompare' });

  // Read from the row while it is the product, so a value typed in the grid (or loaded from the
  // server) shows here too and the two are never out of step.
  const rowPrice = useWatch({ control, name: 'variants.0.price' });
  const rowCompare = useWatch({ control, name: 'variants.0.compare' });
  const rowHasDiscount = useWatch({ control, name: 'variants.0.hasDiscount' });

  const priceValue = locked ? seedPrice.value : (rowPrice ?? null);
  const compareValue = locked ? seedCompare.value : (rowCompare ?? null);

  /**
   * Whether the product is on sale. Unlocked this is the ROW's stored `hasDiscount` flag, which
   * exists precisely so "the merchant just cleared the field" is not confused with "there is no
   * discount" — reading `compare != null` instead made the input disable itself mid-keystroke.
   * Locked, the card is `pointer-events-none` and this is display only, so the value it carries
   * answers the question on its own.
   */
  const onSale = locked ? seedCompare.value != null : Boolean(rowHasDiscount);

  const writePrice = (next: number | null) => {
    seedPrice.onChange(next);
    if (!locked) setValue('variants.0.price', next, { shouldDirty: true });
  };

  const writeCompare = (next: number | null) => {
    seedCompare.onChange(next);
    if (!locked) setValue('variants.0.compare', next, { shouldDirty: true });
  };

  const toggleSale = (next: boolean) => {
    if (!locked) setValue('variants.0.hasDiscount', next, { shouldDirty: true });
    // Turning it off must clear the value, not just hide it: a stale compare price left in the
    // form would still be sent on save and the product would stay discounted.
    if (!next) writeCompare(null);
  };

  // Mirrors `CHK_commerce_variant_compare_gt_price`: equal is as wrong as lower. Only meaningful
  // while the sale is on — a disabled, null field can never be in violation.
  const compareBad =
    onSale && priceValue != null && compareValue != null && compareValue <= priceValue;

  return (
    <EditorSection
      step={step}
      title={t('title')}
      cardClassName={cn(locked && 'pointer-events-none opacity-55')}
    >
      {/*
        Its own full-width row rather than an icon tucked beside the compare label. A bare radix
        switch is a 32×18 pill in `--input` (L≈87) on a white card (L≈100) — about 1.4:1 against
        its background, with no text on it. It was there and it was unfindable. Given as its own
        bordered, tinted row with a real sentence next to it, there is something to aim at.
      */}
      <label
        htmlFor="base-sale"
        className={cn(
          'border-lnv bg-tint mb-2.5 flex items-center gap-2.5 rounded-lg border px-3 py-2.5',
          locked ? 'cursor-not-allowed' : 'cursor-pointer',
        )}
      >
        <Switch id="base-sale" checked={onSale} disabled={locked} onCheckedChange={toggleSale} />
        <span className="text-sm font-bold">{t('hasDiscount')}</span>
      </label>

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
              value={formatAmount(priceValue)}
              onChange={(e) => writePrice(parseAmount(e.target.value))}
              onBlur={seedPrice.onBlur}
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
              // Locked (the product has real variations) OR simply not on sale. Both mean the
              // field is not editable, and a disabled input is also skipped by tab order.
              disabled={locked || !onSale}
              aria-label={t('compare')}
              placeholder={onSale ? t('comparePlaceholder') : t('noDiscount')}
              data-bad={compareBad ? 'zero' : undefined}
              {...selectOnFocus}
              onInput={onInputP2EHandler}
              value={formatAmount(compareValue)}
              onChange={(e) => writeCompare(parseAmount(e.target.value))}
              onBlur={seedCompare.onBlur}
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
