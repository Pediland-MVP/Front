'use client';

import { useTranslations } from 'next-intl';
import { useFormContext, useWatch } from 'react-hook-form';

import { Checkbox } from '@/components/ui';

import type { ProductFormValues } from '../productEditor.schema';
import { formatCount } from '../utils/editorNumber.util';
import { discountPercent } from './variantTree.util';
import type { VariantRow } from './useVariantSync';
import {
  VariantNumberCell,
  type VariantCellField,
  type VariantCellTone,
} from './VariantNumberCell';

export interface VariantMediaItem {
  id: string;
  /**
   * The STILL to draw — a video's poster frame, never the video file itself (see `posterOf`).
   * `null` when there is no still, which is how a queued create-mode video arrives; the row then
   * draws its `+` placeholder instead of a broken image.
   */
  url: string | null;
  name: string;
  isVideo?: boolean;
}

/**
 * What the media picker is being opened for.
 *
 * `row` is one leaf by its field-array index; `group` is a parent row, keyed by its FIRST axis
 * value — the same first-axis grouping `topKeyOf` gives the variant grid, so "this group" means
 * exactly the leaves drawn under that parent and nothing else.
 *
 * THE ONE definition; `dialogs/VariantMediaPickerDialog` re-exports it. It used to be declared in
 * both, structurally identical, so the producer and the consumer of a picker target could have
 * drifted apart without a single compiler error.
 */
export type VariantMediaTarget = { kind: 'row'; index: number } | { kind: 'group'; key: string };

export interface VariantLeafRowProps {
  index: number;
  rowKey: string;
  label: string;
  /** Full "قرمز، S" label, used in every aria string on the row. */
  ariaLabel: string;
  /** A group with one leaf has no parent row — the leaf IS the top row (no indent, no elbow). */
  asTopRow?: boolean;
  selected: boolean;
  media: VariantMediaItem[];
  onToggleSelect: (rowKey: string, shiftKey: boolean) => void;
  onOpenPicker: (target: VariantMediaTarget) => void;
  onDelete: (index: number) => void;
  onNavigate: (index: number, field: VariantCellField, direction: 1 | -1) => void;
  onFillDown: (index: number, field: VariantCellField) => void;
}

const priceTone = (value: number | null): VariantCellTone => (value == null ? 'empty' : '');
const compareTone = (compare: number | null, price: number | null): VariantCellTone =>
  compare != null && price != null && compare <= price ? 'zero' : '';
const stockTone = (stock: number | null, infinite: boolean): VariantCellTone => {
  if (infinite) return '';
  if (stock == null) return 'empty';
  return stock === 0 ? 'zero' : '';
};

export function VariantLeafRow({
  index,
  rowKey,
  label,
  ariaLabel,
  asTopRow,
  selected,
  media,
  onToggleSelect,
  onOpenPicker,
  onDelete,
  onNavigate,
  onFillDown,
}: VariantLeafRowProps) {
  const t = useTranslations('Commerce.Editor.Variants');
  const { control, setValue } = useFormContext<ProductFormValues>();

  // SCOPED watch: `variants.${index}` and nothing else. Editing a cell in row 900 re-renders
  // row 900 — not the other 1999 rows, and not the section. The inputs themselves are
  // uncontrolled (`register`), so this re-render never disturbs what is being typed.
  const row = useWatch({ control, name: `variants.${index}` }) as VariantRow | undefined;
  if (!row) return null;

  const discount = discountPercent(row.price, row.compare);
  const thumbIds = row.mediaIds ?? [];
  const thumb = media.find((item) => item.id === thumbIds[0]) ?? null;

  return (
    <div
      data-vg="1"
      data-row={asTopRow ? 'top' : 'leaf'}
      data-sel={selected ? 'true' : 'false'}
      role="row"
      className="border-ln border-b px-4 py-[7px]"
    >
      <Checkbox
        checked={selected}
        aria-label={t('select', { name: ariaLabel })}
        // The toggle lives in `onClick`, not `onCheckedChange`, because only the click event
        // carries `shiftKey` — and shift-click is how a range gets selected.
        onClick={(event) => onToggleSelect(rowKey, event.shiftKey)}
      />

      <div
        role="gridcell"
        className={`flex min-w-0 items-center gap-2 ${asTopRow ? '' : 'ps-[22px]'}`}
      >
        {!asTopRow && (
          <span
            aria-hidden="true"
            className="border-lnv mb-[5px] size-[10px] flex-none border-s border-b"
          />
        )}
        <span className={`truncate text-xs ${asTopRow ? 'font-bold' : 'font-semibold'}`}>
          {label}
        </span>
      </div>

      <button
        type="button"
        role="gridcell"
        onClick={() => onOpenPicker({ kind: 'row', index })}
        aria-label={t('mediaAria', { name: ariaLabel })}
        title={thumb ? t('mediaSome', { count: formatCount(thumbIds.length) }) : t('mediaEmpty')}
        className="border-lnv bg-card text-primary hover:border-primary relative grid size-10 place-items-center overflow-hidden rounded-md border border-dashed p-0"
      >
        {thumb?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb.url} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <span aria-hidden="true" className="text-sm leading-none">
            +
          </span>
        )}
      </button>

      <div role="gridcell">
        <VariantNumberCell
          index={index}
          field="price"
          value={row.price}
          tone={priceTone(row.price)}
          ariaLabel={t('priceAria', { name: ariaLabel })}
          placeholder={t('pricePlaceholder')}
          onNavigate={(direction) => onNavigate(index, 'price', direction)}
          onFillDown={() => onFillDown(index, 'price')}
        />
      </div>

      <div role="gridcell" className="flex items-center gap-1.5">
        <VariantNumberCell
          index={index}
          field="compare"
          value={row.compare}
          tone={compareTone(row.compare, row.price)}
          ariaLabel={t('compareAria', { name: ariaLabel })}
          placeholder={t('comparePlaceholder')}
          className="bg-card border-ln focus:border-primary text-mut h-[34px] w-full min-w-0 rounded-md border px-2 text-xs font-semibold outline-none"
          onNavigate={(direction) => onNavigate(index, 'compare', direction)}
          onFillDown={() => onFillDown(index, 'compare')}
        />
        {discount != null && (
          <span
            title={t('discount')}
            className="bg-dtint text-dtext flex-none rounded-full px-1.5 py-0.5 text-xs font-bold"
          >
            {t('discountBadge', { percent: formatCount(discount) })}
          </span>
        )}
      </div>

      <div role="gridcell" className="flex items-center gap-1.5">
        <VariantNumberCell
          index={index}
          field="stock"
          value={row.stock}
          display={row.infinite ? '∞' : undefined}
          disabled={row.infinite}
          tone={stockTone(row.stock, row.infinite)}
          ariaLabel={t('stockAria', { name: ariaLabel })}
          placeholder={t('stockPlaceholder')}
          className="bg-card border-ln focus:border-primary h-[34px] w-full min-w-0 rounded-md border px-2 text-xs outline-none disabled:opacity-60"
          onNavigate={(direction) => onNavigate(index, 'stock', direction)}
          onFillDown={() => onFillDown(index, 'stock')}
        />
        <button
          type="button"
          data-inf="1"
          aria-pressed={row.infinite}
          aria-label={t('infiniteAria', { name: ariaLabel })}
          title={t('infinite')}
          onClick={() => {
            const next = !row.infinite;
            setValue(`variants.${index}.infinite`, next, { shouldDirty: true });
            // ∞ means "not tracked" — a leftover count would be sent as `initialStock` and
            // silently rewrite the ledger for a variant that has no count.
            if (next) setValue(`variants.${index}.stock`, null, { shouldDirty: true });
          }}
          className="border-ln bg-card text-mut size-[30px] flex-none rounded-md border p-0 text-sm font-bold"
        >
          ∞
        </button>
      </div>

      <div role="gridcell" className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => onDelete(index)}
          aria-label={t('remove', { name: ariaLabel })}
          className="text-mut hover:bg-dtint hover:text-dtext grid size-7 place-items-center rounded-md border-none bg-transparent p-0"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
