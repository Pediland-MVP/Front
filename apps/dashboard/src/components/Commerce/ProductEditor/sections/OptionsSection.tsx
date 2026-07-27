'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { ChevronDownIcon, ChevronUpIcon, PlusIcon, RefreshCcwIcon, XIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';

import { EditorSection } from '../ui/EditorSection';
import {
  editorAddButton,
  editorAddButtonSm,
  editorEmptyBox,
  editorIconButton,
  editorIconButtonDanger,
  editorInputSm,
  editorInputGhost,
  editorSubBox,
} from '../ui/editorChrome';
import { buildSeededVariant, isEmptySeed, readBaseSeed } from '../baseSeed.util';
import { generateVariantCombinations, OPTION_LIMIT, VARIANT_LIMIT } from '../variantMatrix.util';
import { getComboIdentities, getComboKey } from '../variantIdentity.util';
import type { ProductFormValues } from '../productForm.schema';

type OptionValue = ProductFormValues['options'][number]['values'][number];
type Variant = ProductFormValues['variants'][number];

/** Several values at once, the way the design's hint promises: "قرمز، آبی، مشکی". */
const splitValues = (raw: string) =>
  raw
    .split(/[,،]/)
    .map((part) => part.trim())
    .filter(Boolean);

/**
 * Step 7 — the option axes (سایز, رنگ …) that generate the variation matrix.
 *
 * Split out of `VariantsSection` because the design puts the specs card between this and the
 * variation table. They share nothing but form state, which `useFormContext` already provides.
 *
 * Ordering matters and is surfaced as up/down buttons rather than drag: the FIRST option becomes
 * the top level of the variation tree, so "رنگ then سایز" and "سایز then رنگ" produce visibly
 * different tables from identical data. A drag handle hid that; a labelled button can say it.
 */
const OptionRow = ({
  index,
  isFirst,
  isLast,
  onRemove,
  onMove,
}: {
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}) => {
  const t = useTranslations('Commerce.Editor.Variants');
  const form = useFormContext<ProductFormValues>();
  const [valueDraft, setValueDraft] = useState('');

  const valuesFieldArray = useFieldArray({
    control: form.control,
    name: `options.${index}.values`,
    keyName: '_vxid',
  });
  const optionStyle = useWatch({ control: form.control, name: `options.${index}.style` });
  const optionName = useWatch({ control: form.control, name: `options.${index}.name` }) ?? '';

  const addValues = () => {
    const parts = splitValues(valueDraft);
    if (!parts.length) return;

    const existing = new Set(
      valuesFieldArray.fields.map((field) => field.value.trim().toLowerCase()),
    );

    for (const value of parts) {
      // Same-name values would generate duplicate combinations that the backend rejects as one
      // signature — refuse here rather than at save.
      if (existing.has(value.toLowerCase())) continue;
      existing.add(value.toLowerCase());
      // Assign the stable client-side identity the MOMENT the value is created — this is what
      // lets the regenerate-diff (see `getValueIdentity`) recognize this exact value across
      // later edits/regenerates, before it has ever been saved (and therefore has no backend
      // `id` yet). Never sent to the backend (`buildOptionsPayload` only reads
      // `id`/`value`/`colorHex`).
      const newValue: OptionValue = { value, _localId: crypto.randomUUID() };
      if (optionStyle === 'color') newValue.colorHex = '#cccccc';
      valuesFieldArray.append(newValue);
    }
    setValueDraft('');
  };

  return (
    <div className={editorSubBox}>
      <div className="mb-2.5 flex items-center gap-1.5">
        <div className="flex flex-none flex-col gap-px">
          <button
            type="button"
            disabled={isFirst}
            onClick={() => onMove(-1)}
            aria-label={t('moveOptionUp')}
            title={t('moveOptionUpTooltip')}
            data-testid={`option-move-up-${index}`}
            className={cn(editorIconButton, 'h-3.5 w-5 rounded-[3px]')}
          >
            <ChevronUpIcon className="size-3" />
          </button>
          <button
            type="button"
            disabled={isLast}
            onClick={() => onMove(1)}
            aria-label={t('moveOptionDown')}
            data-testid={`option-move-down-${index}`}
            className={cn(editorIconButton, 'h-3.5 w-5 rounded-[3px]')}
          >
            <ChevronDownIcon className="size-3" />
          </button>
        </div>

        <FormField
          control={form.control}
          name={`options.${index}.name`}
          render={({ field }) => (
            <FormItem className="min-w-0 flex-1 space-y-0">
              <FormControl>
                <input
                  {...field}
                  aria-label={t('optionNamePlaceholder')}
                  placeholder={t('optionNamePlaceholder')}
                  className={editorInputGhost}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <span className="text-mut flex-none text-xs">
          {t('optionValueCount', { count: valuesFieldArray.fields.length })}
        </span>

        <FormField
          control={form.control}
          name={`options.${index}.style`}
          render={({ field }) => (
            <Select dir="rtl" value={field.value} onValueChange={field.onChange}>
              <SelectTrigger size="sm" className="w-28 flex-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dropdown">{t('OptionStyleOptions.dropdown')}</SelectItem>
                <SelectItem value="button">{t('OptionStyleOptions.button')}</SelectItem>
                <SelectItem value="color">{t('OptionStyleOptions.color')}</SelectItem>
              </SelectContent>
            </Select>
          )}
        />

        <button
          type="button"
          onClick={onRemove}
          aria-label={t('removeOptionNamed', { name: optionName })}
          data-testid={`option-remove-${index}`}
          className={editorIconButtonDanger}
        >
          <XIcon className="size-3.5" />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {valuesFieldArray.fields.map((valueField, valueIndex) => (
          <span
            key={valueField._vxid}
            className="border-lnv bg-card inline-flex items-center gap-1.5 rounded-full border py-1 ps-2.5 pe-1 text-xs font-semibold"
          >
            {optionStyle === 'color' && (
              <FormField
                control={form.control}
                name={`options.${index}.values.${valueIndex}.colorHex`}
                render={({ field }) => (
                  <input
                    type="color"
                    value={field.value ?? '#cccccc'}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="size-3.5 shrink-0 cursor-pointer rounded-full border-0 p-0"
                    aria-label={t('colorHexLabel')}
                  />
                )}
              />
            )}
            {valueField.value}
            <button
              type="button"
              onClick={() => valuesFieldArray.remove(valueIndex)}
              aria-label={t('removeValue')}
              className="bg-muted text-mut hover:bg-dtint hover:text-dtext grid size-[22px] flex-none place-items-center rounded-full transition-colors"
            >
              <XIcon className="size-2.5" />
            </button>
          </span>
        ))}
      </div>

      <div className="mt-2.5 flex gap-1.5">
        <input
          data-testid={`option-value-input-${index}`}
          value={valueDraft}
          aria-label={t('valueInputPlaceholder')}
          onChange={(e) => setValueDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            addValues();
          }}
          placeholder={t('valueInputPlaceholder')}
          className={cn(editorInputSm, 'h-[34px]')}
        />
        <button
          type="button"
          onClick={addValues}
          data-testid={`option-value-add-${index}`}
          className={cn(editorAddButtonSm, 'h-[34px]')}
        >
          {t('addValue')}
        </button>
      </div>
      <p className="text-mut mt-1.5 text-xs">{t('multiValueHint')}</p>
    </div>
  );
};

export const OptionsSection = ({ step }: { step: number }) => {
  const t = useTranslations('Commerce.Editor.Variants');
  const form = useFormContext<ProductFormValues>();

  const optionsFieldArray = useFieldArray({
    control: form.control,
    name: 'options',
    keyName: '_oid',
  });
  const variantsFieldArray = useFieldArray({
    control: form.control,
    name: 'variants',
    keyName: '_vid',
  });

  const watchedOptions = useWatch({ control: form.control, name: 'options' }) ?? [];

  const addOption = () => {
    if (optionsFieldArray.fields.length >= OPTION_LIMIT) return;
    optionsFieldArray.append({ name: '', style: 'dropdown', values: [] });
  };

  // Shown on the regenerate button so the merchant sees the resulting count before clicking.
  // Cheap enough to recompute on every render — not worth a `useMemo` (whose dependency,
  // `watchedOptions`, is a fresh array reference from `useWatch` on every render anyway).
  const potentialVariantCount =
    watchedOptions.length === 0
      ? 1
      : watchedOptions.reduce((total, option) => total * option.values.length, 1);

  const handleRegenerate = () => {
    const options = form.getValues('options');
    const counts = options.map((option) => option.values.length);

    if (options.length > 0 && counts.some((count) => count === 0)) {
      toast.error(t('regenerateNeedsValues'));
      return;
    }

    const total = counts.length === 0 ? 1 : counts.reduce((product, count) => product * count, 1);
    if (total > VARIANT_LIMIT) {
      // Hard, blocking error — never silently cap/truncate the combination list.
      toast.error(t('regenerateLimitExceeded', { count: total }));
      return;
    }

    const combos = generateVariantCombinations(counts);
    const currentVariants = form.getValues('variants');
    // Diff key = the SORTED SET of the combination's values' stable identities (real `id` or
    // session `_localId`, never raw array position — see `getValueIdentity`). Any combination
    // that still exists after regeneration keeps its existing row (id, price, SKU, stock,
    // toggles) untouched — only combinations that are new get a fresh default row, and
    // combinations that no longer exist are dropped. This is the guard against losing a
    // merchant's already-entered prices on every options edit.
    //
    // Keying by raw position (the old approach) breaks the moment positions shift under the
    // existing rows: removing a non-last value, or reordering option rows, both shift which
    // index means what without changing the underlying values — a positional key would then
    // silently match the wrong old row to a new combo (see the regression tests).
    const existingByKey = new Map(
      currentVariants.map((variant) => [getComboKey(variant._valueIdentities ?? []), variant]),
    );

    const seed = readBaseSeed(form.getValues());
    let seenNew = false;

    const nextVariants: Variant[] = combos.map((combo) => {
      const identities = getComboIdentities(combo, options);
      const existing = existingByKey.get(getComboKey(identities));
      if (existing) return { ...existing, valueIndexes: combo, _valueIdentities: identities };

      // Only the first BRAND-NEW row takes the stock seed — see `baseSeed.util`'s quantity rule.
      const isFirstNew = !seenNew;
      seenNew = true;
      return buildSeededVariant(combo, identities, seed, isFirstNew);
    });

    variantsFieldArray.replace(nextVariants);
    toast.success(isEmptySeed(seed) ? t('regenerateSuccess') : t('regenerateSuccessSeeded'));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= optionsFieldArray.fields.length) return;
    optionsFieldArray.move(index, target);
  };

  const atLimit = optionsFieldArray.fields.length >= OPTION_LIMIT;

  return (
    <EditorSection
      step={step}
      title={t('optionsCardTitle')}
      hint={t('optionsCardDescription')}
      cardClassName="p-3"
    >
      <div className="flex flex-col gap-2.5">
        {optionsFieldArray.fields.length === 0 && (
          <div className={editorEmptyBox}>
            <div className="mb-1 text-sm font-bold">{t('noOptionsTitle')}</div>
            <p className="text-mut m-0 text-xs text-pretty">{t('noOptionsHint')}</p>
          </div>
        )}

        {optionsFieldArray.fields.map((field, index) => (
          <OptionRow
            key={field._oid}
            index={index}
            isFirst={index === 0}
            isLast={index === optionsFieldArray.fields.length - 1}
            onRemove={() => optionsFieldArray.remove(index)}
            onMove={(direction) => move(index, direction)}
          />
        ))}

        <button
          type="button"
          onClick={addOption}
          disabled={atLimit}
          data-testid="add-option-button"
          className={editorAddButton}
        >
          <PlusIcon className="size-3.5" />
          {t('addOption')}
        </button>

        {atLimit && <p className="text-mut text-xs">{t('optionLimitReached')}</p>}

        <button
          type="button"
          onClick={handleRegenerate}
          data-testid="regenerate-variants-button"
          className="bg-primary text-primary-foreground flex h-[38px] w-full items-center justify-center gap-2 rounded-lg text-sm font-bold transition-opacity hover:opacity-90"
        >
          <RefreshCcwIcon className="size-3.5" />
          {t('regenerateButton', { count: potentialVariantCount })}
        </button>
      </div>
    </EditorSection>
  );
};
