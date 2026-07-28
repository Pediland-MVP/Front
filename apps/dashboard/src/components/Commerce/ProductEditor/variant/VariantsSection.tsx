'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFormContext, useFormState, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { Checkbox } from '@/components/ui';

import type { ProductFormValues } from '../productEditor.schema';
import { formatCount } from '../utils/editorNumber.util';
import { topKeyOf } from './variantTree.util';
import { axesOfOptions, useVariantSyncContext, type VariantRow } from './useVariantSync';
import { BulkBar } from './BulkBar';
import { VariantGroupRow } from './VariantGroupRow';
import { VariantLeafRow, type VariantMediaItem, type VariantMediaTarget } from './VariantLeafRow';
import type { VariantCellField } from './VariantNumberCell';

export type { VariantMediaItem, VariantMediaTarget };

export interface VariantsSectionProps {
  media: VariantMediaItem[];
  /** The picker dialog itself is Task 9 — this section only says what it was opened for. */
  onOpenPicker: (target: VariantMediaTarget) => void;
}

interface Group {
  key: string;
  label: string;
  colorHex?: string | null;
  indexes: number[];
}

/**
 * Step ۹ — the variant grid.
 *
 * Selection, expansion and the bulk mode are `useState`: they are UI, not product data, and
 * putting them in the form would make every checkbox click dirty the form.
 *
 * Note what this component does NOT watch: the variant values. It reads `fields` (which only
 * change when a row is added or removed) for the tree shape, and each group/leaf subscribes to
 * its own paths. The footer is a separate component for the same reason — it is the one thing
 * that genuinely needs every row, so it re-renders alone.
 */
export function VariantsSection({ media, onOpenPicker }: VariantsSectionProps) {
  const t = useTranslations('Commerce.Editor.Variants');
  const { control, getValues, setValue, setFocus } = useFormContext<ProductFormValues>();
  const { fields, removeRows } = useVariantSyncContext();

  // Both memoised so `groups` below is not rebuilt on every single render. A fresh `axes` array
  // per render leaks into `groups`, into `orderedKeys`, and into the error-expansion effect's
  // dependency list — see the `setExpanded` updater there for what that costs.
  const watchedOptions = useWatch({ control, name: 'options' });
  const options = useMemo(() => watchedOptions ?? [], [watchedOptions]);
  const axes = useMemo(() => axesOfOptions(options), [options]);

  const labels = useMemo(() => {
    const map = new Map<string, { label: string; hex?: string | null }>();
    options.forEach((option) =>
      option.values.forEach((value) => {
        if (value.id) map.set(value.id, { label: value.value, hex: value.colorHex ?? null });
      }),
    );
    return map;
  }, [options]);

  const labelOf = (valueId: string) => labels.get(valueId)?.label ?? '—';

  const groups = useMemo<Group[]>(() => {
    const byKey = new Map<string, number[]>();
    fields.forEach((field, index) => {
      const key = topKeyOf(field.valueIds ?? []);
      const bucket = byKey.get(key);
      if (bucket) bucket.push(index);
      else byKey.set(key, [index]);
    });

    // Follow the first axis's own value order, so deleting and re-adding a colour does not
    // shuffle the table under the merchant.
    const order = new Map((axes[0]?.values ?? []).map((value, position) => [value.id, position]));
    return [...byKey.entries()]
      .map(([key, indexes]) => ({
        key,
        label: key === 'all' ? t('soloLabel') : labelOf(key),
        colorHex: labels.get(key)?.hex ?? null,
        indexes,
      }))
      .sort((a, b) => (order.get(a.key) ?? 0) - (order.get(b.key) ?? 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields, labels, axes]);

  const [expanded, setExpanded] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const anchorRef = useRef<string | null>(null);

  /** Row keys in grid order — the order shift-click ranges and Enter navigation follow. */
  const orderedKeys = useMemo(
    () => groups.flatMap((group) => group.indexes.map((index) => fields[index]?.key ?? '')),
    [groups, fields],
  );

  const indexByKey = useMemo(() => {
    const map = new Map<string, number>();
    fields.forEach((field, index) => map.set(field.key, index));
    return map;
  }, [fields]);

  const selectedSet = new Set(selectedKeys);
  const selectedIndexes = orderedKeys
    .filter((key) => selectedSet.has(key))
    .map((key) => indexByKey.get(key))
    .filter((index): index is number => index != null);

  // A zod issue on a collapsed row would otherwise be invisible: open its group so the red cell
  // and `setFocus` (Task 8) land somewhere the merchant can see.
  const { errors } = useFormState({ control, name: 'variants' });
  // The failing row indexes as a plain string, NOT the `errors` object. `setError` MUTATES
  // `formState.errors` in place, so its reference does not change when a new issue appears —
  // an effect keyed on `errors` would never re-run. Reading it during render is also what
  // registers the `useFormState` subscription that gets us re-rendered at all.
  const failingRows = Object.keys(errors?.variants ?? {}).join(',');
  useEffect(() => {
    if (!failingRows) return;
    const failing = failingRows.split(',').map(Number);
    const keys = groups
      .filter((group) => group.indexes.length > 1 && group.indexes.some((i) => failing.includes(i)))
      .map((group) => group.key);
    if (!keys.length) return;
    setExpanded((current) => {
      const next = [...new Set([...current, ...keys])];
      // Return the SAME array when nothing new opened. React bails out of a state update only on
      // `Object.is`, so a fresh array here schedules a render, which re-runs this effect, which
      // builds another fresh array — forever, for as long as any variant has an error.
      return next.length === current.length ? current : next;
    });
  }, [failingRows, groups]);

  if (!fields.length) return null;

  const toggleRow = (rowKey: string, shiftKey: boolean) => {
    if (shiftKey && anchorRef.current) {
      const from = orderedKeys.indexOf(anchorRef.current);
      const to = orderedKeys.indexOf(rowKey);
      if (from > -1 && to > -1) {
        const range = orderedKeys.slice(Math.min(from, to), Math.max(from, to) + 1);
        setSelectedKeys((current) => [...new Set([...current, ...range])]);
        anchorRef.current = rowKey;
        return;
      }
    }
    setSelectedKeys((current) =>
      current.includes(rowKey) ? current.filter((key) => key !== rowKey) : [...current, rowKey],
    );
    anchorRef.current = rowKey;
  };

  /** Checking a parent means "all of its variations" — the bar then reports the real leaf count. */
  const toggleGroup = (groupKey: string) => {
    const group = groups.find((item) => item.key === groupKey);
    if (!group) return;
    const keys = group.indexes.map((index) => fields[index]?.key ?? '');
    const allOn = keys.every((key) => selectedSet.has(key));
    setSelectedKeys((current) =>
      allOn ? current.filter((key) => !keys.includes(key)) : [...new Set([...current, ...keys])],
    );
    anchorRef.current = null;
  };

  const toggleAll = () => {
    setSelectedKeys((current) => (current.length === orderedKeys.length ? [] : [...orderedKeys]));
    anchorRef.current = null;
  };

  const handleDelete = (indexes: number[]) => {
    const keys = indexes.map((index) => fields[index]?.key ?? '');
    removeRows([...indexes].sort((a, b) => a - b));
    setSelectedKeys((current) => current.filter((key) => !keys.includes(key)));
    toast.success(
      indexes.length === 1
        ? t('deletedOne')
        : t('deletedMany', { count: formatCount(indexes.length) }),
    );
  };

  /** Only rows that are actually on screen take part — a collapsed group's children do not. */
  const visibleIndexes = groups.flatMap((group) =>
    group.indexes.length === 1 || expanded.includes(group.key) ? group.indexes : [],
  );

  const navigate = (index: number, field: VariantCellField, direction: 1 | -1) => {
    const position = visibleIndexes.indexOf(index);
    const next = visibleIndexes[position + direction];
    if (next == null) return;
    setFocus(`variants.${next}.${field}`, { shouldSelect: true });
  };

  const fillDown = (index: number, field: VariantCellField) => {
    const group = groups.find((item) => item.indexes.includes(index));
    if (!group) return;
    const targets = group.indexes.slice(group.indexes.indexOf(index));
    if (targets.length < 2) return;
    const value = getValues(`variants.${index}.${field}`) as number | null;
    targets.forEach((target) =>
      setValue(`variants.${target}.${field}`, value, { shouldDirty: true }),
    );
    toast.success(t('filledDown', { count: formatCount(targets.length) }));
  };

  const fullLabel = (valueIds: string[]) =>
    valueIds.length ? valueIds.map(labelOf).join('، ') : t('soloLabel');

  const leafLabel = (valueIds: string[]) =>
    valueIds.length > 1 ? valueIds.slice(1).map(labelOf).join(' · ') : fullLabel(valueIds);

  return (
    <>
      <div className="bg-card border-ln rounded-xl border shadow-xs">
        <div className="overflow-x-auto">
          <div role="grid" aria-label={t('gridLabel')} className="min-w-[900px]">
            <div
              data-vg="1"
              data-head="1"
              role="row"
              className="bg-muted border-lnv text-mut border-b px-4 py-2.5 text-xs font-bold"
            >
              <Checkbox
                checked={selectedKeys.length > 0 && selectedKeys.length === orderedKeys.length}
                aria-label={t('selectAll')}
                onClick={toggleAll}
              />
              <span role="columnheader">{t('colType')}</span>
              <span role="columnheader">{t('colMedia')}</span>
              <span role="columnheader">{t('colPrice')}</span>
              <span role="columnheader">{t('colCompare')}</span>
              <span role="columnheader">{t('colStock')}</span>
              <span role="columnheader" />
            </div>

            <div role="rowgroup">
              {groups.map((group) => {
                const keys = group.indexes.map((index) => fields[index]?.key ?? '');
                const allSelected = keys.every((key) => selectedSet.has(key));

                // RULE: a group with exactly one leaf has no expander — the leaf IS the row.
                if (group.indexes.length === 1) {
                  const index = group.indexes[0];
                  const field = fields[index];
                  return (
                    <VariantLeafRow
                      key={field.key}
                      index={index}
                      rowKey={field.key}
                      asTopRow
                      label={group.label}
                      ariaLabel={fullLabel(field.valueIds ?? [])}
                      selected={selectedSet.has(field.key)}
                      media={media}
                      onToggleSelect={toggleRow}
                      onOpenPicker={onOpenPicker}
                      onDelete={(target) => handleDelete([target])}
                      onNavigate={navigate}
                      onFillDown={fillDown}
                    />
                  );
                }

                return (
                  <div key={group.key}>
                    <VariantGroupRow
                      groupKey={group.key}
                      label={group.label}
                      colorHex={group.colorHex}
                      childIndexes={group.indexes}
                      expanded={expanded.includes(group.key)}
                      selected={allSelected}
                      media={media}
                      onToggleExpand={(key) =>
                        setExpanded((current) =>
                          current.includes(key)
                            ? current.filter((item) => item !== key)
                            : [...current, key],
                        )
                      }
                      onToggleSelect={toggleGroup}
                      onOpenPicker={onOpenPicker}
                    />
                    {expanded.includes(group.key) &&
                      group.indexes.map((index) => {
                        const field = fields[index];
                        return (
                          <VariantLeafRow
                            key={field.key}
                            index={index}
                            rowKey={field.key}
                            label={leafLabel(field.valueIds ?? [])}
                            ariaLabel={fullLabel(field.valueIds ?? [])}
                            selected={selectedSet.has(field.key)}
                            media={media}
                            onToggleSelect={toggleRow}
                            onOpenPicker={onOpenPicker}
                            onDelete={(target) => handleDelete([target])}
                            onNavigate={navigate}
                            onFillDown={fillDown}
                          />
                        );
                      })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <VariantsFooter />
      </div>

      <BulkBar
        selectedIndexes={selectedIndexes}
        media={media}
        onClear={() => setSelectedKeys([])}
        onDelete={handleDelete}
      />
    </>
  );
}

/**
 * Its own component on purpose: the totals are the only thing on this screen that needs every
 * row, so an unscoped `useWatch` here re-renders one `<div>` per keystroke instead of the table.
 */
function VariantsFooter() {
  const t = useTranslations('Commerce.Editor.Variants');
  const { control } = useFormContext<ProductFormValues>();
  const rows = (useWatch({ control, name: 'variants' }) ?? []) as VariantRow[];

  const noPrice = rows.filter((row) => row.price == null).length;
  const totalStock = rows.reduce((sum, row) => sum + (row.infinite ? 0 : (row.stock ?? 0)), 0);

  return (
    <div className="bg-muted border-lnv text-mut flex flex-wrap items-center gap-3.5 rounded-b-xl border-t px-4 py-3 text-xs">
      <span>{t('footerCount', { count: formatCount(rows.length) })}</span>
      <span aria-hidden="true">·</span>
      <span>
        {noPrice > 0 ? t('footerHealthBad', { count: formatCount(noPrice) }) : t('footerHealthOk')}
      </span>
      <span className="flex-1" />
      <span className="text-foreground font-bold">
        {t('footerStock', { count: formatCount(totalStock) })}
      </span>
    </div>
  );
}
