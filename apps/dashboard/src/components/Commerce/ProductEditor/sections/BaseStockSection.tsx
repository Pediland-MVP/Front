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
 * Step ۷ — the stock, and whether it is counted at all.
 *
 * Same lock rule as step ۶ — a variant row AND an axis that actually has values, never the bare
 * `options.length`, which counts the empty axis "افزودن ویژگی" just appended.
 *
 * UNLOCKED, this card is the product's REAL stock, not a seed. A product with no axes still has
 * exactly one implicit variation and that row IS the product, so both controls write straight into
 * `variants[0]` — this card used to write only `baseStock`, which `useVariantSync` reads when it
 * GENERATES rows, so for a product that never got an axis the number went nowhere and the merchant
 * had to retype it into the one-row grid below.
 *
 * `baseStock`/`baseInfinite` are still written alongside, because they are what survives the first
 * axis added: the implicit row carries no option values, so `donorOf` never matches it and the
 * rows generated in its place fall back to the seeds.
 *
 * LOCKED (the product has real variations), the seeds are all that is left to show — per-variant
 * stock lives in the grid, and the hint says so.
 */
export const BaseStockSection = ({ step = 7 }: { step?: number }) => {
  const t = useTranslations('Commerce.Editor.BaseStock');
  const { control, setValue } = useFormContext<ProductFormValues>();
  const selectOnFocus = useSelectOnFocus();

  const variants = useWatch({ control, name: 'variants' }) ?? [];
  const options = useWatch({ control, name: 'options' }) ?? [];
  const liveAxes = options.filter((option) => (option.values?.length ?? 0) > 0).length;
  const locked = variants.length > 0 && liveAxes > 0;

  const { field: seedStock } = useController({ control, name: 'baseStock' });
  const { field: seedInfinite } = useController({ control, name: 'baseInfinite' });

  // Read from the row while it is the product, so a value typed in the grid (or loaded from the
  // server) shows here too and the two are never out of step.
  const rowStock = useWatch({ control, name: 'variants.0.stock' });
  const rowInfinite = useWatch({ control, name: 'variants.0.infinite' });

  const stockValue = locked ? seedStock.value : (rowStock ?? null);
  const infinite = locked ? seedInfinite.value : Boolean(rowInfinite);

  const writeStock = (next: number | null) => {
    seedStock.onChange(next);
    if (!locked) setValue('variants.0.stock', next, { shouldDirty: true });
  };

  const writeInfinite = (next: boolean) => {
    seedInfinite.onChange(next);
    if (!locked) setValue('variants.0.infinite', next, { shouldDirty: true });
    // ∞ means "not tracked" — a leftover count would be sent as `initialStock` and silently
    // rewrite the ledger for a variant that has no count. Same rule `VariantLeafRow` follows.
    if (next) writeStock(null);
  };

  return (
    <EditorSection
      step={step}
      title={t('title')}
      cardClassName={cn(locked && 'pointer-events-none opacity-55')}
    >
      {/*
        A labelled, bordered row rather than a bare ∞ button, matching the discount switch in
        step ۶: a naked switch on a white card is about 1.4:1 against its background with no text
        on it, and this is the control that decides whether the product can ever sell out.
      */}
      <label
        htmlFor="base-infinite"
        className={cn(
          'border-lnv bg-tint mb-2.5 flex items-center gap-2.5 rounded-lg border px-3 py-2.5',
          locked ? 'cursor-not-allowed' : 'cursor-pointer',
        )}
      >
        <Switch
          id="base-infinite"
          checked={infinite}
          disabled={locked}
          onCheckedChange={writeInfinite}
        />
        <span className="text-sm font-bold">{t('infinite')}</span>
      </label>

      <input
        id="base-stock"
        // TEXT, never type="number" (CLAUDE.md §18): a number input blanks Persian digits before
        // `onInputP2EHandler` can convert them.
        type="text"
        inputMode="numeric"
        disabled={locked || infinite}
        aria-label={t('label')}
        placeholder={infinite ? t('infinitePlaceholder') : t('placeholder')}
        {...selectOnFocus}
        onInput={onInputP2EHandler}
        value={infinite ? '' : formatAmount(stockValue)}
        onChange={(e) => writeStock(parseAmount(e.target.value))}
        onBlur={seedStock.onBlur}
        className={cn(editorInput, 'h-[42px] text-base font-bold')}
      />
      <p className="text-mut mt-2 text-xs text-pretty">
        {locked ? t('locked') : infinite ? t('infiniteHint') : t('hint')}
      </p>
    </EditorSection>
  );
};
