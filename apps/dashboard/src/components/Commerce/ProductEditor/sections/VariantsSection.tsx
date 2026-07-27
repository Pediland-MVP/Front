'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useFieldArray, useFormContext, useWatch, type FieldError } from 'react-hook-form';
import { toast } from 'sonner';
import { ImageIcon } from '@phosphor-icons/react/dist/ssr';
import { ChevronDownIcon, InfinityIcon, SettingsIcon, XIcon } from 'lucide-react';

import { onInputP2EHandler } from '@/utils/p2eNumber';
import { formatNumber } from '@/utils/formatNumber';
import { useSelectOnFocus } from '@/hooks/useSelectOnFocus';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import type {
  CommerceProductMedia,
  CommerceVariantDetail,
  CommerceVariantMediaAssignment,
} from '@/types/commerce';

import {
  DatePicker,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui';

import { VariantMediaPickerDialog } from '../VariantMediaPickerDialog';
import { EditorSection } from '../ui/EditorSection';
import { editorCard, editorInputCell } from '../ui/editorChrome';
import {
  aggregate,
  flattenGroups,
  groupVariants,
  type VariantAggregate,
} from '../variantTree.util';
import { applyBulkPrice, fillDownTargets, type BulkPriceMode } from '../variantBulk.util';
import type { ProductFormValues } from '../productForm.schema';

/**
 * The variation grid's column template, shared by the header, group rows and leaf rows so the
 * three always line up. Expressed once here rather than repeated per row: the design's grid is
 * `grid`, not `table`, because a leaf row has to indent under its parent without the browser's
 * table layout forcing every cell back to the same box.
 */
const GRID_COLUMNS =
  'grid items-center gap-2.5 ' +
  '[grid-template-columns:26px_minmax(120px,1.2fr)_88px_minmax(110px,1fr)_minmax(120px,1fr)_minmax(110px,.9fr)_76px]';

interface VariantsSectionProps {
  mode: 'create' | 'edit';
  /** Needed to build the `PUT .../variants/:variantId/media` URL — the per-variant media
   * picker is disabled entirely without it (mirrors `MediaSection`'s `mode`/`productId` gate). */
  productId?: string;
  /** The product's whole media pool (same `GET /commerce/products/:id` response's `media`
   * field `MediaSection` reads) — the per-variant picker can only choose from it. */
  media?: CommerceProductMedia[];
  /** The fetched product's variants (edit mode only) — used to read the read-only `onHand`
   * figure for the stock column, and (Task 6) each variant's currently-known media
   * assignment for the media button's thumbnail. Never written back to for pricing/stock;
   * those edits go through Task 7's dedicated inventory endpoint. */
  existingVariants?: CommerceVariantDetail[];
}

/**
 * Step 9 — the generated variation table.
 *
 * The option axes that FEED this table live in `OptionsSection` (step 7); the design puts the
 * specs card between the two. Both write the same `options`/`variants` form arrays through
 * `useFormContext`, so the split costs nothing but keeps each file to one job.
 */
export const VariantsSection = ({
  step,
  mode,
  productId,
  media = [],
  existingVariants = [],
}: VariantsSectionProps & { step: number }) => {
  const t = useTranslations('Commerce.Editor.Variants');
  const tv = useTranslations('Commerce.Editor.Validation');
  const form = useFormContext<ProductFormValues>();
  const { can } = usePermissions();
  const canEdit = can('product:edit');

  // One dialog instance, controlled by which row (if any) currently has it open — mirrors the
  // approved mockup's single `modalVariantMedia` reused across every row via `pickerState`,
  // rather than mounting a dialog per row.
  const [mediaPickerIndex, setMediaPickerIndex] = useState<number | null>(null);

  // Selection drives the bulk bar. Keyed by react-hook-form's stable `_vid`, not array index —
  // indexes shift under a regenerate and would silently re-point a selection at other rows.
  const [selectedKeys, setSelectedKeys] = useState<ReadonlySet<string>>(() => new Set());
  const [anchorKey, setAnchorKey] = useState<string | null>(null);
  // Groups start COLLAPSED. That is the performance answer for this table: the backend allows
  // 2000 variations, and with the tree only the expanded group's leaves are ever in the DOM, so
  // a 10-colour x 200-size product renders 10 rows until the merchant opens one. No virtualiser
  // needed for the realistic shape.
  const [expandedKeys, setExpandedKeys] = useState<ReadonlySet<string>>(() => new Set());
  const [bulkPanel, setBulkPanel] = useState<'price' | 'stock' | null>(null);
  const [bulkMode, setBulkMode] = useState<BulkPriceMode>('set');
  const [bulkValue, setBulkValue] = useState('');

  const variantsFieldArray = useFieldArray({
    control: form.control,
    name: 'variants',
    keyName: '_vid',
  });

  // `useFieldArray`'s own `fields` array only reacts to structural changes (append/remove/
  // move/replace) — per-keystroke edits to a field's value (renaming an option, typing a
  // price) don't show up there. `useWatch` is what gives us the live values needed to derive
  // variant labels and to check "is this the last active variant" correctly.
  const watchedOptions = useWatch({ control: form.control, name: 'options' }) ?? [];
  const watchedVariants = useWatch({ control: form.control, name: 'variants' }) ?? [];

  /**
   * Rows in the shape the tree utils want. Derived from `useFieldArray`'s `fields` (stable
   * `_vid` identity) plus the live watched values, so a keystroke that changes a value index
   * regroups the row without waiting for a structural change.
   */
  const treeRows = useMemo(
    () =>
      variantsFieldArray.fields.map((field, index) => ({
        key: field._vid as string,
        index,
        valueIndexes: watchedVariants[index]?.valueIndexes ?? [],
      })),
    [variantsFieldArray.fields, watchedVariants],
  );

  const groups = useMemo(
    () =>
      groupVariants(
        treeRows,
        (row) => row.valueIndexes,
        (watchedOptions[0]?.values ?? []).map((value) => value.value),
        watchedOptions.length,
      ),
    [treeRows, watchedOptions],
  );

  const flatRows = useMemo(() => flattenGroups(groups, expandedKeys), [groups, expandedKeys]);

  /**
   * A group's roll-up for one numeric column.
   *
   * Stock reads `trackInventory === false` as Infinity so an all-untracked group summarises as
   * "نامحدود" rather than as a mixed range, and falls back to the persisted `onHand` in edit
   * mode, where `initialStock` is only present for rows the merchant has actually touched.
   */
  const aggregateOf = (
    rows: Array<{ index: number }>,
    field: 'price' | 'compareAtPrice' | 'stock',
  ): VariantAggregate =>
    aggregate(
      rows.map(({ index }) => {
        const variant = watchedVariants[index];
        if (!variant) return null;
        if (field === 'stock') {
          if (variant.trackInventory === false) return Infinity;
          const persisted = existingVariants.find((item) => item.id === variant.id)?.onHand;
          return variant.initialStock ?? persisted ?? null;
        }
        return variant[field] ?? null;
      }),
    );

  const selectedIndexes = useMemo(
    () => treeRows.filter((row) => selectedKeys.has(row.key)).map((row) => row.index),
    [treeRows, selectedKeys],
  );

  const toggleGroupOpen = (key: string) =>
    setExpandedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  /** Shift-click extends from the last clicked row, matching the design's range select. */
  const toggleRowSelected = (key: string, withShift: boolean) => {
    setSelectedKeys((current) => {
      const next = new Set(current);
      const keys = treeRows.map((row) => row.key);
      if (withShift && anchorKey) {
        const from = keys.indexOf(anchorKey);
        const to = keys.indexOf(key);
        if (from > -1 && to > -1) {
          for (const inRange of keys.slice(Math.min(from, to), Math.max(from, to) + 1)) {
            next.add(inRange);
          }
          return next;
        }
      }
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setAnchorKey(key);
  };

  /** Checking a parent means "every variation under it", so the bar's count stays honest. */
  const toggleGroupSelected = (keys: string[]) =>
    setSelectedKeys((current) => {
      const next = new Set(current);
      const allSelected = keys.length > 0 && keys.every((key) => next.has(key));
      for (const key of keys) {
        if (allSelected) next.delete(key);
        else next.add(key);
      }
      return next;
    });

  const clearSelection = () => {
    setSelectedKeys(new Set());
    setAnchorKey(null);
    setBulkPanel(null);
    setBulkValue('');
  };

  const handleBulkPrice = () => {
    const amount = Number(bulkValue);
    if (!bulkValue || Number.isNaN(amount) || amount < 0) return;
    const selected = new Set(selectedIndexes);
    const current = form.getValues('variants');
    const { rows, changedCount, skippedCount } = applyBulkPrice(
      current.map((variant, index) => ({ variant, index })),
      ({ index }) => selected.has(index),
      ({ variant }) => variant.price ?? null,
      ({ variant, index }, price) => ({ variant: { ...variant, price }, index }),
      bulkMode,
      amount,
    );
    form.setValue(
      'variants',
      rows.map((row) => row.variant),
      { shouldDirty: true },
    );
    toast.success(
      skippedCount > 0
        ? t('bulkPriceAppliedWithSkips', { count: changedCount, skipped: skippedCount })
        : t('bulkPriceApplied', { count: changedCount }),
    );
    setBulkValue('');
  };

  const handleBulkStock = (infinite: boolean) => {
    const amount = Number(bulkValue);
    if (!infinite && (!bulkValue || Number.isNaN(amount) || amount < 0)) return;
    const selected = new Set(selectedIndexes);
    const current = form.getValues('variants');
    form.setValue(
      'variants',
      current.map((variant, index) =>
        selected.has(index)
          ? infinite
            ? { ...variant, trackInventory: false }
            : { ...variant, trackInventory: true, initialStock: amount }
          : variant,
      ),
      { shouldDirty: true },
    );
    toast.success(
      infinite
        ? t('bulkStockInfinite', { count: selected.size })
        : t('bulkStockApplied', { count: selected.size, value: amount }),
    );
    setBulkValue('');
  };

  /**
   * Writes one value across every leaf of a group — the design's parent-row edit.
   * Setting stock this way also re-enables tracking, otherwise the number would be written and
   * then ignored by an untracked variant.
   */
  const applyToGroup = (
    rows: Array<{ index: number }>,
    field: 'price' | 'compareAtPrice' | 'stock',
    value: number,
  ) => {
    const indexes = new Set(rows.map((row) => row.index));
    const current = form.getValues('variants');
    form.setValue(
      'variants',
      current.map((variant, index) => {
        if (!indexes.has(index)) return variant;
        if (field === 'stock') return { ...variant, trackInventory: true, initialStock: value };
        return { ...variant, [field]: value };
      }),
      { shouldDirty: true },
    );
    toast.success(t('groupValueApplied', { count: indexes.size }));
  };

  /** Ctrl/Cmd+D — copy this cell down the rest of its own group, never across groups. */
  const handleFillDown = (
    groupRows: Array<{ index: number }>,
    originIndex: number,
    field: 'price' | 'compareAtPrice',
    value: number,
  ) => {
    const position = groupRows.findIndex((row) => row.index === originIndex);
    const targets = fillDownTargets(groupRows, position);
    if (!targets.length) return;
    const indexes = new Set(targets.map((row) => row.index));
    const current = form.getValues('variants');
    form.setValue(
      'variants',
      current.map((variant, index) =>
        indexes.has(index) ? { ...variant, [field]: value } : variant,
      ),
      { shouldDirty: true },
    );
    toast.success(t('filledDown', { count: indexes.size }));
  };

  /**
   * One variation row. Extracted so the tree render reads as group-or-leaf rather than
   * repeating this prop list inline; `groupRows` is threaded through purely so Ctrl+D knows
   * which rows count as "below this one, in this group".
   */
  const renderLeaf = (
    index: number,
    key: string,
    groupRows: Array<{ index: number }>,
    isInsideBranch: boolean,
  ) => (
    <VariantRow
      key={key}
      index={index}
      mode={mode}
      label={getVariantLabel(watchedVariants[index]?.valueIndexes ?? [])}
      variantId={watchedVariants[index]?.id}
      canEditMedia={canEdit}
      isSelected={selectedKeys.has(key)}
      isIndented={isInsideBranch}
      onToggleSelected={(withShift) => toggleRowSelected(key, withShift)}
      onFillDown={(field, value) => handleFillDown(groupRows, index, field, value)}
      mediaAssignment={
        existingVariants.find((variant) => variant.id === watchedVariants[index]?.id)?.media
      }
      mediaPool={media}
      existingOnHand={
        existingVariants.find((variant) => variant.id === watchedVariants[index]?.id)?.onHand
      }
      deleteBlockedReason={getDeleteBlockedReason(index)}
      isLastActiveVariant={Boolean(watchedVariants[index]?.isActive) && activeVariantCount <= 1}
      onRemove={() => handleRemoveVariant(index)}
      onOpenMediaPicker={() => setMediaPickerIndex(index)}
    />
  );

  const activeVariantCount = watchedVariants.filter((variant) => variant.isActive).length;

  const getVariantLabel = (valueIndexes: number[]) => {
    if (watchedOptions.length === 0) return t('defaultVariantLabel');
    return valueIndexes
      .map((valueIndex, optionIndex) => watchedOptions[optionIndex]?.values[valueIndex]?.value)
      .filter(Boolean)
      .join(' / ');
  };

  // Returns why a variant row's delete button should be blocked, or `null` if deletion is
  // allowed. Checked before the user hits the backend's 400, per the spec's
  // `assertHasLiveVariant` rule (at least one variant must always exist and stay active).
  const getDeleteBlockedReason = (index: number): string | null => {
    if (variantsFieldArray.fields.length <= 1) return tv('atLeastOneActiveVariantRequired');
    const variant = watchedVariants[index];
    if (variant?.isActive && activeVariantCount <= 1) return t('deleteBlockedLastActive');
    return null;
  };

  const handleRemoveVariant = (index: number) => {
    const reason = getDeleteBlockedReason(index);
    if (reason) {
      toast.error(reason);
      return;
    }
    variantsFieldArray.remove(index);
  };

  // `@hookform/resolvers`'s `toNestErrors` nests a whole-array `.superRefine`/`.refine` error
  // (path `variants`) under `errors.variants.root`, NOT directly on `errors.variants` — it
  // does this whenever the array's own item fields (`variants.0.price`, etc.) are also
  // registered, which they always are here. Reading `errors.variants.message` (the old code)
  // is therefore always `undefined`; this safety-net message never rendered. Verified against
  // the installed `@hookform/resolvers/dist/resolvers.mjs`'s `toNestErrors`.
  const arrayLevelError = (
    form.formState.errors.variants as (FieldError & { root?: FieldError }) | undefined
  )?.root?.message;

  // The media picker only ever targets a variant with a real, persisted id — `VariantRow`
  // already disables the button otherwise (see the gating comment there), so this is a
  // defensive re-check, not the primary gate.
  const mediaPickerVariantId =
    mediaPickerIndex !== null ? watchedVariants[mediaPickerIndex]?.id : undefined;

  const allSelected = treeRows.length > 0 && selectedKeys.size === treeRows.length;

  /**
   * Footer health line. `price` is required by the form contract, so "unpriced" means literally
   * zero — which for a live product is almost always an oversight rather than a free giveaway,
   * and is worth naming before the merchant hits save.
   */
  const unpricedCount = watchedVariants.filter((variant) => !variant.price).length;
  const trackedStock = watchedVariants.reduce((total, variant) => {
    if (variant.trackInventory === false) return total;
    const persisted = existingVariants.find((item) => item.id === variant.id)?.onHand;
    return total + (variant.initialStock ?? persisted ?? 0);
  }, 0);

  return (
    <EditorSection
      bare
      step={step}
      title={t('tableCardTitle')}
      hint={t('variantCountBadge', { count: variantsFieldArray.fields.length })}
    >
      {arrayLevelError && (
        <p className="text-destructive mb-2 text-sm" role="alert">
          {arrayLevelError}
        </p>
      )}

      <div className={editorCard}>
        <div className="overflow-x-auto">
          <div role="grid" aria-label={t('tableCardTitle')} className="min-w-[880px]">
            <div
              role="row"
              className={cn(
                GRID_COLUMNS,
                'bg-muted border-lnv text-mut border-b px-4 py-2.5 text-xs font-bold',
              )}
            >
              <input
                type="checkbox"
                aria-label={t('selectAll')}
                data-testid="variant-select-all"
                className="accent-primary size-4 cursor-pointer"
                checked={allSelected}
                onChange={() =>
                  setSelectedKeys(allSelected ? new Set() : new Set(treeRows.map((row) => row.key)))
                }
              />
              <span role="columnheader">{t('Columns.variant')}</span>
              <span role="columnheader">{t('Columns.media')}</span>
              <span role="columnheader">{t('Columns.price')}</span>
              <span role="columnheader">{t('Columns.compareAtPrice')}</span>
              <span role="columnheader">{t('Columns.stock')}</span>
              <span role="columnheader" />
            </div>

            <div role="rowgroup">
              {flatRows.map((entry) =>
                entry.kind === 'group' ? (
                  <VariantGroupRow
                    key={`group-${entry.group.key}`}
                    label={entry.group.label}
                    rowCount={entry.group.rows.length}
                    isOpen={expandedKeys.has(entry.group.key)}
                    isSelected={entry.group.rows.every((row) => selectedKeys.has(row.key))}
                    priceAggregate={aggregateOf(entry.group.rows, 'price')}
                    compareAggregate={aggregateOf(entry.group.rows, 'compareAtPrice')}
                    stockAggregate={aggregateOf(entry.group.rows, 'stock')}
                    canEdit={canEdit}
                    onToggleOpen={() => toggleGroupOpen(entry.group.key)}
                    onToggleSelected={() =>
                      toggleGroupSelected(entry.group.rows.map((row) => row.key))
                    }
                    onApply={(field, value) => applyToGroup(entry.group.rows, field, value)}
                  />
                ) : (
                  renderLeaf(entry.row.index, entry.row.key, entry.group.rows, entry.group.isBranch)
                ),
              )}

              {variantsFieldArray.fields.length === 0 && (
                <div className="text-mut px-4 py-8 text-center text-sm">{t('noVariants')}</div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-muted border-lnv text-mut flex flex-wrap items-center gap-3.5 rounded-b-2xl border-t px-4 py-2.5 text-xs">
          <span>{t('footerCount', { count: variantsFieldArray.fields.length })}</span>
          <span aria-hidden="true">·</span>
          <span className={cn(unpricedCount > 0 && 'text-wtext font-bold')}>
            {unpricedCount > 0
              ? t('footerUnpriced', { count: unpricedCount })
              : t('footerAllPriced')}
          </span>
          <span className="flex-1" />
          <span className="text-foreground font-bold">
            {t('footerStock', { count: formatNumber(trackedStock) })}
          </span>
        </div>
      </div>

      {selectedKeys.size > 0 && canEdit && (
        <div
          data-testid="variant-bulk-bar"
          className="pointer-events-none fixed inset-x-6 bottom-5 z-20 flex justify-center"
        >
          <div className="bg-ink pointer-events-auto flex max-w-full flex-wrap items-center gap-3 rounded-2xl px-3.5 py-2.5 text-white shadow-lg">
            <span className="text-xs font-bold whitespace-nowrap">
              {t('bulkSelected', { count: selectedIndexes.length })}
            </span>
            <span aria-hidden="true" className="h-5 w-px bg-white/20" />

            <div role="group" aria-label={t('bulkGroupLabel')} className="flex flex-wrap gap-1.5">
              {(['price', 'stock'] as const).map((panel) => (
                <button
                  key={panel}
                  type="button"
                  aria-pressed={bulkPanel === panel}
                  data-testid={`variant-bulk-${panel}-toggle`}
                  onClick={() => setBulkPanel(bulkPanel === panel ? null : panel)}
                  className={cn(
                    'h-8 rounded-md border px-3 text-xs font-bold transition-colors',
                    bulkPanel === panel
                      ? 'border-white/50 bg-white/20'
                      : 'border-white/20 hover:bg-white/10',
                  )}
                >
                  {t(panel === 'price' ? 'bulkPrice' : 'bulkStock')}
                </button>
              ))}
            </div>

            {bulkPanel === 'price' && (
              <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-white/10 p-1.5">
                <Select
                  value={bulkMode}
                  onValueChange={(value) => setBulkMode(value as BulkPriceMode)}
                >
                  <SelectTrigger
                    size="sm"
                    className="h-7 w-28 border-0 bg-white/15 text-xs text-white"
                    data-testid="variant-bulk-mode"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="set">{t('bulkModeSet')}</SelectItem>
                    <SelectItem value="increase">{t('bulkModeIncrease')}</SelectItem>
                    <SelectItem value="decrease">{t('bulkModeDecrease')}</SelectItem>
                  </SelectContent>
                </Select>
                <input
                  inputMode="numeric"
                  onInput={onInputP2EHandler}
                  data-testid="variant-bulk-value"
                  aria-label={t('bulkValueLabel')}
                  value={bulkValue}
                  onChange={(e) => setBulkValue(e.target.value)}
                  placeholder={bulkMode === 'set' ? t('bulkPricePlaceholder') : '٪'}
                  className="h-7 w-24 rounded-md bg-white/15 px-2 text-xs text-white outline-none placeholder:text-white/50"
                />
                <button
                  type="button"
                  data-testid="variant-bulk-price-apply"
                  onClick={handleBulkPrice}
                  className="text-ink h-7 rounded-md bg-white px-3 text-xs font-extrabold"
                >
                  {t('bulkApply')}
                </button>
              </div>
            )}

            {bulkPanel === 'stock' && (
              <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-white/10 p-1.5">
                <input
                  inputMode="numeric"
                  onInput={onInputP2EHandler}
                  data-testid="variant-bulk-stock-value"
                  aria-label={t('bulkValueLabel')}
                  value={bulkValue}
                  onChange={(e) => setBulkValue(e.target.value)}
                  className="h-7 w-24 rounded-md bg-white/15 px-2 text-xs text-white outline-none placeholder:text-white/50"
                />
                <button
                  type="button"
                  data-testid="variant-bulk-stock-apply"
                  onClick={() => handleBulkStock(false)}
                  className="text-ink h-7 rounded-md bg-white px-3 text-xs font-extrabold"
                >
                  {t('bulkApply')}
                </button>
                <button
                  type="button"
                  data-testid="variant-bulk-infinite"
                  onClick={() => handleBulkStock(true)}
                  className="h-7 rounded-md border border-white/25 px-2.5 text-xs font-semibold"
                >
                  {t('bulkInfinite')}
                </button>
              </div>
            )}

            <span aria-hidden="true" className="h-5 w-px bg-white/20" />
            <button
              type="button"
              aria-label={t('bulkClear')}
              data-testid="variant-bulk-clear"
              onClick={clearSelection}
              className="grid size-7 place-items-center rounded-md text-white/70 transition-colors hover:bg-white/15 hover:text-white"
            >
              <XIcon className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {productId && mediaPickerVariantId && (
        <VariantMediaPickerDialog
          open={mediaPickerIndex !== null}
          onOpenChange={(open) => {
            if (!open) setMediaPickerIndex(null);
          }}
          productId={productId}
          variantId={mediaPickerVariantId}
          variantLabel={getVariantLabel(
            mediaPickerIndex !== null
              ? (watchedVariants[mediaPickerIndex]?.valueIndexes ?? [])
              : [],
          )}
          pool={media}
          initialAssignment={
            existingVariants.find((variant) => variant.id === mediaPickerVariantId)?.media
          }
        />
      )}
    </EditorSection>
  );
};

type GroupField = 'price' | 'compareAtPrice' | 'stock';

/**
 * One roll-up cell on a parent row. Reads as text until clicked, then becomes an input whose
 * value is written across every leaf in the group.
 *
 * That "click a summary to make the group uniform" gesture is the whole point of the parent row:
 * a merchant with 40 sizes at one price should set it once here, not 40 times below.
 */
const GroupCell = ({
  label,
  summary,
  title,
  isMixed,
  canEdit,
  testId,
  muted,
  onApply,
}: {
  label: string;
  summary: string;
  title: string;
  isMixed: boolean;
  canEdit: boolean;
  testId: string;
  muted?: boolean;
  onApply: (value: number) => void;
}) => {
  const { onFocus } = useSelectOnFocus();
  const [draft, setDraft] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const commit = () => {
    setIsEditing(false);
    const value = Number(draft);
    setDraft('');
    // An empty or negative entry is a cancelled edit, not "set every row to zero" — writing that
    // across a whole group on a stray blur would be unrecoverable without an undo.
    if (draft === '' || Number.isNaN(value) || value < 0) return;
    onApply(value);
  };

  if (isEditing && canEdit) {
    return (
      <input
        autoFocus
        inputMode="numeric"
        onInput={onInputP2EHandler}
        data-testid={`${testId}-input`}
        aria-label={label}
        value={draft}
        onFocus={onFocus}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.currentTarget.blur();
          }
          if (e.key === 'Escape') {
            setDraft('');
            setIsEditing(false);
          }
        }}
        className={cn(editorInputCell, 'h-9 font-bold')}
      />
    );
  }

  return (
    <button
      type="button"
      disabled={!canEdit}
      title={title}
      aria-label={label}
      data-testid={testId}
      onClick={() => setIsEditing(true)}
      className={cn(
        'border-lnv bg-card hover:border-primary hover:bg-tint flex h-9 w-full items-center justify-center gap-1.5 rounded-md border text-xs font-bold transition-colors disabled:pointer-events-none',
        muted && 'text-mut font-semibold',
      )}
    >
      <span dir="ltr" className="tabular-nums">
        {summary}
      </span>
      {isMixed && <span className="text-wtext text-xs font-semibold">●</span>}
    </button>
  );
};

/**
 * A collapsible parent row: one value of the FIRST option, summarising every variation beneath
 * it. Editing a roll-up writes that one value across the whole group.
 */
const VariantGroupRow = ({
  label,
  rowCount,
  isOpen,
  isSelected,
  priceAggregate,
  compareAggregate,
  stockAggregate,
  canEdit,
  onToggleOpen,
  onToggleSelected,
  onApply,
}: {
  label: string;
  rowCount: number;
  isOpen: boolean;
  isSelected: boolean;
  priceAggregate: VariantAggregate;
  compareAggregate: VariantAggregate;
  stockAggregate: VariantAggregate;
  canEdit: boolean;
  onToggleOpen: () => void;
  onToggleSelected: () => void;
  onApply: (field: GroupField, value: number) => void;
}) => {
  const t = useTranslations('Commerce.Editor.Variants');

  /** "—" when nothing is set, one figure when the group agrees, a range when it does not. */
  const summarise = (aggregateValue: VariantAggregate, infiniteLabel?: string) => {
    if (aggregateValue.state === 'empty') return '—';
    if (aggregateValue.state === 'uniform') {
      return aggregateValue.value === Infinity
        ? (infiniteLabel ?? '∞')
        : String(formatNumber(aggregateValue.value));
    }
    const max =
      aggregateValue.max === Infinity
        ? (infiniteLabel ?? '∞')
        : String(formatNumber(aggregateValue.max));
    return `${formatNumber(aggregateValue.min)} – ${max}`;
  };

  return (
    <div
      role="row"
      data-testid={`variant-group-${label}`}
      data-selected={isSelected}
      className={cn(
        GRID_COLUMNS,
        'bg-card border-ln hover:bg-muted border-b px-4 py-2.5 transition-colors',
        isSelected && 'bg-tint2',
      )}
    >
      <input
        type="checkbox"
        aria-label={t('selectGroup', { name: label })}
        data-testid={`variant-group-select-${label}`}
        className="accent-primary size-4 cursor-pointer"
        checked={isSelected}
        onChange={onToggleSelected}
      />

      <div role="gridcell" className="flex min-w-0 items-center gap-2">
        <span className="truncate text-sm font-bold">{label}</span>
        <span className="text-mut flex-none text-xs">
          {t('groupRowCount', { count: rowCount })}
        </span>
      </div>

      <div role="gridcell" />

      <div role="gridcell">
        <GroupCell
          canEdit={canEdit}
          isMixed={priceAggregate.state === 'mixed'}
          label={t('groupPriceLabel', { name: label })}
          title={t('groupPriceTooltip')}
          summary={summarise(priceAggregate)}
          testId={`variant-group-price-${label}`}
          onApply={(value) => onApply('price', value)}
        />
      </div>

      <div role="gridcell">
        <GroupCell
          muted
          canEdit={canEdit}
          isMixed={compareAggregate.state === 'mixed'}
          label={t('groupCompareLabel', { name: label })}
          title={t('groupCompareTooltip')}
          summary={summarise(compareAggregate)}
          testId={`variant-group-compare-${label}`}
          onApply={(value) => onApply('compareAtPrice', value)}
        />
      </div>

      <div role="gridcell">
        <GroupCell
          canEdit={canEdit}
          isMixed={stockAggregate.state === 'mixed'}
          label={t('groupStockLabel', { name: label })}
          title={t('groupStockTooltip')}
          summary={summarise(stockAggregate, t('infiniteShort'))}
          testId={`variant-group-stock-${label}`}
          onApply={(value) => onApply('stock', value)}
        />
      </div>

      <div role="gridcell" className="flex items-center justify-end">
        <button
          type="button"
          aria-expanded={isOpen}
          aria-label={t(isOpen ? 'collapseGroup' : 'expandGroup', { name: label })}
          data-testid={`variant-group-toggle-${label}`}
          onClick={onToggleOpen}
          className="text-mut hover:bg-tint2 hover:text-primary grid size-7 place-items-center rounded-md transition-colors"
        >
          <ChevronDownIcon
            className={cn('size-3.5 transition-transform', !isOpen && '-rotate-90')}
          />
        </button>
      </div>
    </div>
  );
};

const VariantRow = ({
  index,
  mode,
  label,
  variantId,
  canEditMedia,
  isSelected,
  isIndented,
  onToggleSelected,
  onFillDown,
  mediaAssignment,
  mediaPool,
  existingOnHand,
  deleteBlockedReason,
  isLastActiveVariant,
  onRemove,
  onOpenMediaPicker,
}: {
  index: number;
  mode: 'create' | 'edit';
  label: string;
  isSelected: boolean;
  /** Leaf of a collapsible group — indented so the tree structure reads at a glance. */
  isIndented: boolean;
  onToggleSelected: (withShift: boolean) => void;
  /** Ctrl/Cmd+D on a price cell copies it down the rest of THIS row's group. */
  onFillDown: (field: 'price' | 'compareAtPrice', value: number) => void;
  /** The variant's real, persisted backend id — `undefined` for a variant the merchant just
   * added this session (via "regenerate" or otherwise) that has never been saved yet. The
   * media button stays disabled until this exists, since `PUT .../variants/:variantId/media`
   * requires a real id. */
  variantId?: string;
  /** Whether the viewer holds `product:edit` — the per-variant media picker mutates the
   * product's media assignment, so the opening button must stay disabled without it, same
   * gate `VariantMediaPickerDialog#handleSave` enforces on the actual PUT. */
  canEditMedia: boolean;
  mediaAssignment?: CommerceVariantMediaAssignment;
  mediaPool: CommerceProductMedia[];
  existingOnHand?: number;
  deleteBlockedReason: string | null;
  isLastActiveVariant: boolean;
  onRemove: () => void;
  onOpenMediaPicker: () => void;
}) => {
  const t = useTranslations('Commerce.Editor.Variants');
  const form = useFormContext<ProductFormValues>();
  const { onFocus } = useSelectOnFocus();

  const salePrice = useWatch({ control: form.control, name: `variants.${index}.salePrice` });
  const saleEnabled = salePrice !== undefined;
  // Drives the "there is something set in here" tint on the settings button — otherwise a
  // deactivated variation looks identical to a live one once its column is gone.
  const isActiveValue = useWatch({ control: form.control, name: `variants.${index}.isActive` });

  const toggleSale = (enabled: boolean) => {
    if (enabled) {
      form.setValue(`variants.${index}.salePrice`, 0, { shouldDirty: true });
      form.setValue(`variants.${index}.saleStartsAt`, new Date().toISOString(), {
        shouldDirty: true,
      });
    } else {
      form.setValue(`variants.${index}.salePrice`, undefined, { shouldDirty: true });
      form.setValue(`variants.${index}.saleStartsAt`, undefined, { shouldDirty: true });
      form.setValue(`variants.${index}.saleEndsAt`, undefined, { shouldDirty: true });
    }
  };

  // A brand-new variant added this session (via "regenerate" or otherwise) has no real
  // backend id yet — `PUT .../variants/:variantId/media` requires one, so the button stays
  // disabled (with an explanatory tooltip) until the whole product form is saved once, the
  // same rule `MediaSection` applies to the whole Media section pre-save. Lacking
  // `product:edit` disables it the same way, for the same reason `VariantMediaPickerDialog`'s
  // own Save button is disabled without it.
  const isMediaButtonDisabled = !variantId || !canEditMedia;
  const coverMedia = mediaAssignment?.coverMediaId
    ? mediaPool.find((item) => item.id === mediaAssignment.coverMediaId)
    : undefined;
  const coverPreviewUrl = coverMedia
    ? coverMedia.type === 'video'
      ? (coverMedia.posterUrl ?? coverMedia.url)
      : coverMedia.url
    : undefined;
  const mediaButtonTooltip = !variantId
    ? t('mediaUnsavedTooltip')
    : !canEditMedia
      ? t('mediaNoPermissionTooltip')
      : coverMedia
        ? t('mediaEditTooltip')
        : t('mediaAssignTooltip');

  // Only meaningful when both are set and the compare price is genuinely higher — otherwise
  // there is no discount to advertise, and rounding a negative would print "-12٪ off".
  const price = useWatch({ control: form.control, name: `variants.${index}.price` });
  const compareAtPrice = useWatch({
    control: form.control,
    name: `variants.${index}.compareAtPrice`,
  });
  const discountPercent =
    compareAtPrice && price && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : null;

  const trackInventory = useWatch({
    control: form.control,
    name: `variants.${index}.trackInventory`,
  });
  const isUntracked = trackInventory === false;

  return (
    <div
      role="row"
      data-selected={isSelected}
      data-testid={`variant-row-${index}`}
      className={cn(
        GRID_COLUMNS,
        'border-ln bg-muted/40 hover:bg-muted border-b px-4 py-2 transition-colors',
        isSelected && 'bg-tint2',
      )}
    >
      <input
        type="checkbox"
        aria-label={t('selectRow', { name: label })}
        data-testid={`variant-select-${index}`}
        className="accent-primary size-4 cursor-pointer"
        checked={isSelected}
        // Shift-click extends the range from the last clicked row. Read off the native event
        // because React's synthetic change event does not carry modifier keys.
        onClick={(e) => onToggleSelected(e.shiftKey)}
        onChange={() => undefined}
      />

      <div role="gridcell" className={cn('flex min-w-0 items-center gap-2', isIndented && 'ps-5')}>
        {isIndented && (
          // The tree elbow: a corner drawn with two borders, so a leaf reads as belonging to the
          // group above it even when the list is scrolled past that group's own row.
          <span
            aria-hidden="true"
            className="border-lnv mb-1.5 size-2.5 flex-none border-s border-b"
          />
        )}
        <span className="truncate text-xs font-semibold">{label}</span>
      </div>

      <div role="gridcell">
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <button
                type="button"
                disabled={isMediaButtonDisabled}
                onClick={onOpenMediaPicker}
                data-testid={`variant-media-button-${index}`}
                aria-label={t('mediaButtonLabel', { name: label })}
                className={cn(
                  'border-lnv bg-card text-primary relative grid size-10 place-items-center overflow-hidden rounded-md border transition-colors',
                  !coverPreviewUrl && 'border-dashed',
                  !isMediaButtonDisabled && 'hover:border-primary',
                  isMediaButtonDisabled && 'cursor-not-allowed opacity-50',
                )}
              >
                {coverPreviewUrl ? (
                  <Image src={coverPreviewUrl} alt="" fill className="object-cover" sizes="40px" />
                ) : (
                  <ImageIcon size={13} />
                )}
              </button>
            </span>
          </TooltipTrigger>
          <TooltipContent>{mediaButtonTooltip}</TooltipContent>
        </Tooltip>
      </div>

      <div role="gridcell">
        <FormField
          control={form.control}
          name={`variants.${index}.price`}
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormControl>
                <input
                  inputMode="numeric"
                  data-testid={`variant-price-${index}`}
                  onInput={onInputP2EHandler}
                  aria-label={t('priceLabel', { name: label })}
                  placeholder={t('noPrice')}
                  value={formatNumber(field.value ?? 0) ?? ''}
                  onFocus={onFocus}
                  onChange={(e) => field.onChange(e.target.value === '' ? 0 : +e.target.value)}
                  // Ctrl/Cmd+D copies this price down the rest of its own group — the fastest
                  // way to price a size run without touching the next colour.
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
                      e.preventDefault();
                      const value = Number(e.currentTarget.value.replace(/,/g, ''));
                      if (!Number.isNaN(value)) onFillDown('price', value);
                    }
                  }}
                  // An unpriced row is tinted rather than silently blending in: it is the single
                  // most common reason a saved product does not sell.
                  className={cn(
                    editorInputCell,
                    'font-bold',
                    !field.value && 'border-dline bg-dtint',
                  )}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div role="gridcell" className="flex items-center gap-1.5">
        <FormField
          control={form.control}
          name={`variants.${index}.compareAtPrice`}
          render={({ field }) => (
            <FormItem className="min-w-0 flex-1 space-y-0">
              <FormControl>
                <input
                  inputMode="numeric"
                  onInput={onInputP2EHandler}
                  data-testid={`variant-compare-${index}`}
                  aria-label={t('compareLabel', { name: label })}
                  placeholder={t('noCompare')}
                  value={field.value == null ? '' : (formatNumber(field.value) ?? '')}
                  onFocus={onFocus}
                  onChange={(e) =>
                    field.onChange(e.target.value === '' ? undefined : +e.target.value)
                  }
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
                      e.preventDefault();
                      const value = Number(e.currentTarget.value.replace(/,/g, ''));
                      if (!Number.isNaN(value)) onFillDown('compareAtPrice', value);
                    }
                  }}
                  className={cn(editorInputCell, 'text-mut font-semibold')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {discountPercent !== null && (
          <span
            title={t('discountTooltip')}
            data-testid={`variant-discount-${index}`}
            className="bg-dtint text-dtext flex-none rounded-full px-2 py-0.5 text-xs font-bold"
          >
            {t('discountBadge', { percent: discountPercent })}
          </span>
        )}
      </div>

      <div role="gridcell" className="flex items-center gap-1.5">
        {mode === 'create' ? (
          <FormField
            control={form.control}
            name={`variants.${index}.initialStock`}
            render={({ field }) => (
              <FormItem className="min-w-0 flex-1 space-y-0">
                <FormControl>
                  <input
                    inputMode="numeric"
                    onInput={onInputP2EHandler}
                    data-testid={`variant-stock-${index}`}
                    aria-label={t('stockLabel', { name: label })}
                    disabled={isUntracked}
                    placeholder="—"
                    value={
                      isUntracked
                        ? t('infiniteShort')
                        : field.value == null
                          ? ''
                          : (formatNumber(field.value) ?? '')
                    }
                    onFocus={onFocus}
                    onChange={(e) =>
                      field.onChange(e.target.value === '' ? undefined : +e.target.value)
                    }
                    className={editorInputCell}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        ) : (
          // Edit mode: on-hand is owned by the ledger (Task 7's stock endpoint), so it is shown
          // read-only here and adjusted from the Inventory section instead.
          <span
            data-testid={`variant-stock-${index}`}
            title={t('stockReadonlyNote')}
            className="border-ln bg-card text-mut flex h-[34px] min-w-0 flex-1 items-center rounded-md border px-2.5 text-xs tabular-nums"
          >
            {isUntracked ? t('infiniteShort') : formatNumber(existingOnHand ?? 0)}
          </span>
        )}

        <FormField
          control={form.control}
          name={`variants.${index}.trackInventory`}
          render={({ field }) => (
            <button
              type="button"
              aria-pressed={!field.value}
              aria-label={t('infiniteToggleLabel', { name: label })}
              title={t('infiniteToggleLabel', { name: label })}
              data-testid={`variant-infinite-${index}`}
              onClick={() => field.onChange(!field.value)}
              className={cn(
                'border-ln bg-card text-mut grid size-[30px] flex-none place-items-center rounded-md border transition-colors',
                !field.value && 'border-lnv bg-tint2 text-primary',
              )}
            >
              <InfinityIcon className="size-3.5" />
            </button>
          )}
        />
      </div>

      <div role="gridcell" className="flex items-center justify-end gap-1">
        {/* Everything the design's row has no column for — SKU, the sale window, backorder and
            the active flag. They are real, saved fields, so they move behind a per-row popover
            rather than being dropped to fit the layout. */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              data-testid={`variant-more-${index}`}
              aria-label={t('moreSettings', { name: label })}
              title={t('moreSettings', { name: label })}
              className={cn(
                'text-mut hover:bg-tint2 hover:text-primary grid size-7 place-items-center rounded-md transition-colors',
                (saleEnabled || !isActiveValue) && 'bg-tint2 text-primary',
              )}
            >
              <SettingsIcon className="size-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="bg-card flex w-72 flex-col gap-3">
            <FormField
              control={form.control}
              name={`variants.${index}.sku`}
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <span className="text-mut text-xs font-bold">{t('Columns.sku')}</span>
                  <FormControl>
                    <input
                      {...field}
                      data-testid={`variant-sku-${index}`}
                      value={field.value ?? ''}
                      aria-label={t('Columns.sku')}
                      placeholder={t('skuPlaceholder')}
                      className={editorInputCell}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="border-lnv flex items-center justify-between border-t pt-3">
              <span className="text-xs font-semibold">{t('saleToggleLabel')}</span>
              <Switch
                checked={saleEnabled}
                data-testid={`variant-sale-toggle-${index}`}
                onCheckedChange={toggleSale}
              />
            </div>

            {saleEnabled && (
              <>
                <FormField
                  control={form.control}
                  name={`variants.${index}.salePrice`}
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <span className="text-mut text-xs">{t('salePriceLabel')}</span>
                      <FormControl>
                        <input
                          inputMode="numeric"
                          onInput={onInputP2EHandler}
                          aria-label={t('salePriceLabel')}
                          placeholder="۰"
                          value={field.value == null ? '' : (formatNumber(field.value) ?? '')}
                          onFocus={onFocus}
                          onChange={(e) =>
                            field.onChange(e.target.value === '' ? undefined : +e.target.value)
                          }
                          className={editorInputCell}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`variants.${index}.saleStartsAt`}
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <span className="text-mut text-xs">{t('saleStartsAtLabel')}</span>
                      <DatePicker
                        date={field.value ? new Date(field.value) : null}
                        onChange={(date) => field.onChange(date ? date.toISOString() : undefined)}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`variants.${index}.saleEndsAt`}
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <span className="text-mut text-xs">{t('saleEndsAtLabel')}</span>
                      <DatePicker
                        date={field.value ? new Date(field.value) : null}
                        onChange={(date) => field.onChange(date ? date.toISOString() : undefined)}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name={`variants.${index}.allowBackorder`}
              render={({ field }) => (
                <div className="border-lnv flex items-center justify-between border-t pt-3">
                  <span className="text-xs font-semibold">{t('Columns.allowBackorder')}</span>
                  <Switch
                    checked={field.value}
                    data-testid={`variant-backorder-${index}`}
                    onCheckedChange={field.onChange}
                  />
                </div>
              )}
            />

            <FormField
              control={form.control}
              name={`variants.${index}.isActive`}
              render={({ field }) => (
                <div className="border-lnv flex flex-col gap-1 border-t pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{t('Columns.isActive')}</span>
                    <Switch
                      data-testid={`variant-active-${index}`}
                      checked={field.value}
                      disabled={isLastActiveVariant}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                  {isLastActiveVariant && (
                    <span className="text-mut text-xs">{t('deactivateBlockedLastActive')}</span>
                  )}
                </div>
              )}
            />
          </PopoverContent>
        </Popover>

        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <button
                type="button"
                data-testid={`variant-delete-${index}`}
                disabled={Boolean(deleteBlockedReason)}
                onClick={onRemove}
                aria-label={t('deleteVariant')}
                className="text-mut hover:bg-dtint hover:text-dtext grid size-7 place-items-center rounded-md transition-colors disabled:pointer-events-none disabled:opacity-40"
              >
                <XIcon className="size-3.5" />
              </button>
            </span>
          </TooltipTrigger>
          {deleteBlockedReason && <TooltipContent>{deleteBlockedReason}</TooltipContent>}
        </Tooltip>
      </div>
    </div>
  );
};
