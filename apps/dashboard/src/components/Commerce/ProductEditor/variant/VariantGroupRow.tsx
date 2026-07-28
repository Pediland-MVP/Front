'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFormContext, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { Checkbox } from '@/components/ui';

import type { ProductFormValues } from '../productEditor.schema';
import { formatAmount, formatCount, parseAmount } from '../utils/editorNumber.util';
import { aggregate, discountPercent, type Aggregate } from './variantTree.util';
import type { VariantRow } from './useVariantSync';
import type { VariantCellField } from './VariantNumberCell';
import type { VariantMediaItem, VariantMediaTarget } from './VariantLeafRow';

export interface VariantGroupRowProps {
  groupKey: string;
  label: string;
  colorHex?: string | null;
  /** Indexes of this group's leaves, in grid order. Always 2+ — a solo group renders as a leaf. */
  childIndexes: number[];
  expanded: boolean;
  selected: boolean;
  media: VariantMediaItem[];
  onToggleExpand: (groupKey: string) => void;
  onToggleSelect: (groupKey: string) => void;
  onOpenPicker: (target: VariantMediaTarget) => void;
}

const asText = (value: number): string => (value === Infinity ? '∞' : formatAmount(value));

/** "۴۲۰٬۰۰۰ → ۳۱۵٬۵۰۰", or a single number when both ends agree (only blanks make it a range). */
const rangeText = (state: Extract<Aggregate, { state: 'mixed' }>): string =>
  state.min === state.max ? asText(state.min) : `${asText(state.min)} → ${asText(state.max)}`;

interface GroupCellProps {
  field: VariantCellField;
  agg: Aggregate;
  childIndexes: number[];
  ariaLabel: string;
  placeholder: string;
  rangeTitle: string;
  rolledKey: 'rolledPrice' | 'rolledCompare' | 'rolledStock';
  tone: '' | 'empty' | 'zero';
  bold?: boolean;
}

/**
 * A roll-up cell.
 *
 * `uniform` → a plain input showing the shared value. `mixed` → a button showing the range and
 * how many children are blank; clicking it turns the button into an input. Committing writes the
 * one value onto EVERY child.
 *
 * It is deliberately NOT `register`-ed: a parent row is not a form field, it is a writer.
 */
function GroupCell({
  field,
  agg,
  childIndexes,
  ariaLabel,
  placeholder,
  rangeTitle,
  rolledKey,
  tone,
  bold,
}: GroupCellProps) {
  const t = useTranslations('Commerce.Editor.Variants');
  const { setValue } = useFormContext<ProductFormValues>();
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const text = agg.state === 'uniform' ? asText(agg.value) : '';
  const shownRef = useRef(text);
  shownRef.current = text;

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = (raw: string) => {
    setEditing(false);

    // Guard 1 — nothing was typed. Focus-and-blur must never write, and it is the ONLY way a
    // uniform "∞" cell could otherwise be parsed as "blank" and clear every child's stock.
    if (raw === shownRef.current) return;

    const next = parseAmount(raw);

    // Guard 2 — the value did not actually change.
    if (agg.state === 'uniform' && agg.value === next) return;

    // Guard 3 — THE rule. Blanking a parent that was showing a range does nothing. Writing null
    // across the group would wipe per-variant values the merchant never touched, and the design
    // gives no way to get them back.
    if (next == null && agg.state !== 'uniform') return;

    childIndexes.forEach((index) => {
      setValue(`variants.${index}.${field}`, next, { shouldDirty: true });
      // A number and "untracked" are mutually exclusive.
      if (field === 'stock') setValue(`variants.${index}.infinite`, false, { shouldDirty: true });
    });
    toast.success(t(rolledKey, { count: formatCount(childIndexes.length) }));
  };

  if (agg.state === 'mixed' && !editing) {
    return (
      <button
        type="button"
        data-range="1"
        title={rangeTitle}
        onClick={() => setEditing(true)}
        className="border-lnv bg-card flex h-9 w-full items-center justify-center gap-1.5 rounded-md border text-xs font-bold"
      >
        <span dir="ltr" className="[unicode-bidi:isolate]">
          {rangeText(agg)}
        </span>
        {agg.missing > 0 && (
          <span className="text-wtext text-xs font-semibold">
            {t('emptyCount', { count: formatCount(agg.missing) })}
          </span>
        )}
      </button>
    );
  }

  return (
    <input
      ref={inputRef}
      key={`${agg.state}-${text}`}
      defaultValue={text}
      type="text"
      inputMode="numeric"
      dir="ltr"
      data-bad={tone || undefined}
      aria-label={ariaLabel}
      placeholder={placeholder}
      className={`bg-card border-ln focus:border-primary h-9 w-full min-w-0 rounded-md border px-2 text-xs outline-none ${bold ? 'font-bold' : 'text-mut font-semibold'}`}
      onInput={(event) => {
        event.currentTarget.value = event.currentTarget.value
          .replace(/[۰-۹]/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(digit).toString())
          .replace(/[^0-9]/g, '');
      }}
      onBlur={(event) => commit(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.currentTarget.value = shownRef.current;
          setEditing(false);
          event.currentTarget.blur();
          return;
        }
        if (event.key === 'Enter') {
          event.preventDefault();
          event.currentTarget.blur(); // blur commits
        }
      }}
    />
  );
}

export function VariantGroupRow({
  groupKey,
  label,
  colorHex,
  childIndexes,
  expanded,
  selected,
  media,
  onToggleExpand,
  onToggleSelect,
  onOpenPicker,
}: VariantGroupRowProps) {
  const t = useTranslations('Commerce.Editor.Variants');
  const { control } = useFormContext<ProductFormValues>();

  const names = useMemo(
    () => childIndexes.map((index) => `variants.${index}` as const),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [childIndexes.join(',')],
  );

  // SCOPED to this group's children only. A price typed in another group does not re-render this
  // row, which is what keeps a 2000-row table responsive — an unscoped `useWatch({name:'variants'})`
  // here would re-render every group on every keystroke.
  const watched = useWatch({ control, name: names }) as Array<VariantRow | undefined>;
  const rows = watched.filter((row): row is VariantRow => Boolean(row));

  const price = aggregate(rows, 'price');
  const compare = aggregate(rows, 'compare');
  const stock = aggregate(rows, 'stock');

  const discount =
    price.state === 'uniform' && compare.state === 'uniform'
      ? discountPercent(price.value, compare.value)
      : null;

  const groupMediaIds = [...new Set(rows.flatMap((row) => row.mediaIds ?? []))];
  const thumb = media.find((item) => item.id === groupMediaIds[0]) ?? null;

  return (
    <div
      data-vg="1"
      data-row="top"
      data-sel={selected ? 'true' : 'false'}
      role="row"
      className="border-ln border-b px-4 py-[9px]"
    >
      <Checkbox
        checked={selected}
        aria-label={t('selectGroup', { name: label })}
        onClick={() => onToggleSelect(groupKey)}
      />

      <div role="gridcell" className="flex min-w-0 items-center gap-2">
        {colorHex && (
          <span
            aria-hidden="true"
            style={{ background: colorHex }}
            className="size-[18px] flex-none rounded-full border border-black/15"
          />
        )}
        <span className="truncate text-sm font-bold">{label}</span>
      </div>

      <button
        type="button"
        role="gridcell"
        onClick={() => onOpenPicker({ kind: 'group', key: groupKey })}
        aria-label={t('mediaAria', { name: label })}
        title={
          thumb ? t('mediaSome', { count: formatCount(groupMediaIds.length) }) : t('mediaEmpty')
        }
        className="border-lnv bg-tint text-primary hover:border-primary relative grid size-11 place-items-center overflow-hidden rounded-md border border-dashed p-0"
      >
        {thumb?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb.url} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <span aria-hidden="true" className="text-sm leading-none">
            +
          </span>
        )}
        {groupMediaIds.length > 1 && (
          <span className="bg-ink absolute inset-x-0 bottom-0 text-xs font-bold text-white">
            {formatCount(groupMediaIds.length)}
          </span>
        )}
      </button>

      <div role="gridcell">
        <GroupCell
          field="price"
          agg={price}
          childIndexes={childIndexes}
          ariaLabel={t('priceAria', { name: label })}
          placeholder={t('pricePlaceholder')}
          rangeTitle={t('rangePriceTitle')}
          rolledKey="rolledPrice"
          tone={price.state === 'empty' ? 'empty' : ''}
          bold
        />
      </div>

      <div role="gridcell" className="flex items-center gap-1.5">
        <GroupCell
          field="compare"
          agg={compare}
          childIndexes={childIndexes}
          ariaLabel={t('compareAria', { name: label })}
          placeholder={t('comparePlaceholder')}
          rangeTitle={t('rangeCompareTitle')}
          rolledKey="rolledCompare"
          tone={
            compare.state === 'uniform' && price.state === 'uniform' && compare.value <= price.value
              ? 'zero'
              : ''
          }
        />
        {discount != null && (
          <span
            title={t('discount')}
            className="bg-dtint text-dtext flex-none rounded-full px-1.5 py-0.5 text-xs font-bold"
          >
            ٪{formatCount(discount)}
          </span>
        )}
      </div>

      <div role="gridcell" className="flex items-center gap-1.5">
        <GroupCell
          field="stock"
          agg={stock}
          childIndexes={childIndexes}
          ariaLabel={t('stockAria', { name: label })}
          placeholder={t('stockPlaceholder')}
          rangeTitle={t('rangeStockTitle')}
          rolledKey="rolledStock"
          tone={
            stock.state === 'empty'
              ? 'empty'
              : stock.state === 'uniform' && stock.value === 0
                ? 'zero'
                : ''
          }
          bold
        />
      </div>

      <div role="gridcell" className="flex items-center justify-end">
        <button
          type="button"
          data-chev="1"
          aria-expanded={expanded}
          onClick={() => onToggleExpand(groupKey)}
          aria-label={t('childCount', { count: formatCount(childIndexes.length) })}
          title={t('childCount', { count: formatCount(childIndexes.length) })}
          className="text-mut hover:bg-tint2 hover:text-primary grid size-7 place-items-center rounded-md border-none bg-transparent p-0"
        >
          ▾
        </button>
      </div>
    </div>
  );
}
