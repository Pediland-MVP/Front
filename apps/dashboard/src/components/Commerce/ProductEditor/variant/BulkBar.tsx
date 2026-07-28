'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import { toast } from 'sonner';

// CLAUDE.md §18: every numeric input is a TEXT input whose keystrokes go through the Persian→
// English cleaner. `parseAmount` would convert on apply anyway, but without this the merchant
// SEES the raw ۱۵۰٬۰۰۰ they typed and the separators they pasted, while the value applied is a
// silently different, cleaned number.
import { onInputP2EHandler } from '@/utils/p2eNumber';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui';

import type { ProductFormValues } from '../productEditor.schema';
import { formatCount, parseAmount } from '../utils/editorNumber.util';
import type { VariantMediaItem } from './VariantLeafRow';

export interface BulkBarProps {
  /** Form indexes of the selected leaves, in grid order. Empty ⇒ the bar is not rendered. */
  selectedIndexes: number[];
  media: VariantMediaItem[];
  onClear: () => void;
  /** Deletion is routed up: only `useVariantSync` may remove rows (it also suppresses them). */
  onDelete: (indexes: number[]) => void;
}

type BulkTab = 'price' | 'stock' | 'media' | null;
type PriceMode = 'set' | 'inc' | 'dec';

/** Percentage results land on a round number a merchant would actually print on a label. */
const roundToThousand = (value: number): number => Math.round(value / 1000) * 1000;

export function BulkBar({ selectedIndexes, media, onClear, onDelete }: BulkBarProps) {
  const t = useTranslations('Commerce.Editor.Bulk');
  const { setValue, getValues } = useFormContext<ProductFormValues>();

  const [tab, setTab] = useState<BulkTab>(null);
  const [priceMode, setPriceMode] = useState<PriceMode>('set');
  const [value, setInputValue] = useState('');
  const [confirming, setConfirming] = useState(false);

  if (!selectedIndexes.length) return null;

  const applyPrice = () => {
    const amount = parseAmount(value);
    if (amount == null) return;

    let changed = 0;
    let skipped = 0;
    selectedIndexes.forEach((index) => {
      const name = `variants.${index}.price` as const;
      if (priceMode === 'set') {
        setValue(name, amount, { shouldDirty: true });
        changed += 1;
        return;
      }
      const current = getValues(name) as number | null;
      // A percentage of "no price" is not zero — it is nothing. Skip and report it, rather
      // than inventing a 0-tooman variant the storefront would happily sell.
      if (current == null) {
        skipped += 1;
        return;
      }
      const factor = priceMode === 'inc' ? 1 + amount / 100 : 1 - amount / 100;
      setValue(name, roundToThousand(current * factor), { shouldDirty: true });
      changed += 1;
    });

    toast.success(
      skipped
        ? t('priceAppliedSkipped', { count: formatCount(changed), skipped: formatCount(skipped) })
        : t('priceApplied', { count: formatCount(changed) }),
    );
  };

  const applyStock = () => {
    const amount = parseAmount(value);
    if (amount == null) return;
    selectedIndexes.forEach((index) => {
      setValue(`variants.${index}.stock`, amount, { shouldDirty: true });
      setValue(`variants.${index}.infinite`, false, { shouldDirty: true });
    });
    toast.success(
      t('stockApplied', {
        count: formatCount(selectedIndexes.length),
        value: formatCount(amount),
      }),
    );
  };

  const applyInfinite = () => {
    selectedIndexes.forEach((index) => {
      setValue(`variants.${index}.infinite`, true, { shouldDirty: true });
      setValue(`variants.${index}.stock`, null, { shouldDirty: true });
    });
    toast.success(t('infiniteApplied', { count: formatCount(selectedIndexes.length) }));
  };

  const assignMedia = (mediaId: string) => {
    selectedIndexes.forEach((index) =>
      setValue(`variants.${index}.mediaIds`, [mediaId], { shouldDirty: true }),
    );
    toast.success(t('mediaApplied', { count: formatCount(selectedIndexes.length) }));
  };

  const clearMedia = () => {
    selectedIndexes.forEach((index) =>
      setValue(`variants.${index}.mediaIds`, [], { shouldDirty: true }),
    );
    toast.success(t('mediaCleared', { count: formatCount(selectedIndexes.length) }));
  };

  const tabButton = (id: Exclude<BulkTab, null>, label: string) => (
    <button
      type="button"
      data-bulk="1"
      aria-pressed={tab === id}
      onClick={() => setTab(tab === id ? null : id)}
      className="h-8 rounded-md border border-white/20 bg-transparent px-3 text-xs font-bold text-white"
    >
      {label}
    </button>
  );

  return (
    <div className="pointer-events-none fixed inset-x-6 bottom-5 z-20 flex justify-center">
      <div className="bg-ink pointer-events-auto flex max-w-full flex-wrap items-center gap-3 rounded-xl px-3.5 py-3 text-white shadow-lg">
        <span className="text-xs font-bold whitespace-nowrap">
          {t('selection', { count: formatCount(selectedIndexes.length) })}
        </span>
        <span aria-hidden="true" className="h-[22px] w-px bg-white/20" />

        <div
          role="group"
          aria-label={t('groupLabel')}
          className="flex flex-wrap items-center gap-2"
        >
          {tabButton('price', t('price'))}
          {tabButton('stock', t('stock'))}
          {tabButton('media', t('media'))}
        </div>

        {tab === 'price' && (
          <div className="flex flex-wrap items-center gap-1.5 rounded-md bg-white/10 p-1.5">
            {/* A native select on purpose: it is what the design uses, it needs no portal inside
                a fixed dark bar, and it is directly drivable in tests. */}
            <select
              aria-label={t('modeAria')}
              value={priceMode}
              onChange={(event) => setPriceMode(event.target.value as PriceMode)}
              className="h-7 rounded-md border-none bg-white/15 px-1.5 text-xs text-white"
            >
              <option value="set">{t('modeSet')}</option>
              <option value="inc">{t('modeInc')}</option>
              <option value="dec">{t('modeDec')}</option>
            </select>
            <input
              type="text"
              inputMode="numeric"
              dir="ltr"
              aria-label={t('valueAria')}
              placeholder={t('valuePlaceholder')}
              value={value}
              onInput={onInputP2EHandler}
              onChange={(event) => setInputValue(event.target.value)}
              className="h-7 w-24 rounded-md border-none bg-white/15 px-2 text-xs text-white"
            />
            <button
              type="button"
              onClick={applyPrice}
              className="bg-primary text-ink h-7 rounded-md px-3 text-xs font-extrabold"
            >
              {t('apply')}
            </button>
            {priceMode !== 'set' && <span className="text-xs text-white/70">{t('rounding')}</span>}
          </div>
        )}

        {tab === 'stock' && (
          <div className="flex flex-wrap items-center gap-1.5 rounded-md bg-white/10 p-1.5">
            <input
              type="text"
              inputMode="numeric"
              dir="ltr"
              aria-label={t('countAria')}
              placeholder={t('countPlaceholder')}
              value={value}
              onInput={onInputP2EHandler}
              onChange={(event) => setInputValue(event.target.value)}
              className="h-7 w-24 rounded-md border-none bg-white/15 px-2 text-xs text-white"
            />
            <button
              type="button"
              onClick={applyStock}
              className="bg-primary text-ink h-7 rounded-md px-3 text-xs font-extrabold"
            >
              {t('apply')}
            </button>
            <button
              type="button"
              onClick={applyInfinite}
              className="h-7 rounded-md border border-white/25 bg-transparent px-2.5 text-xs font-semibold text-white"
            >
              {t('infinite')}
            </button>
          </div>
        )}

        {tab === 'media' && (
          <div className="flex flex-wrap items-center gap-1.5 rounded-md bg-white/10 p-1.5">
            {media.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => assignMedia(item.id)}
                aria-label={item.name}
                title={item.name}
                className="relative size-[30px] overflow-hidden rounded-md border border-white/30 bg-transparent p-0"
              >
                {item.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt="" className="absolute inset-0 size-full object-cover" />
                )}
              </button>
            ))}
            <button
              type="button"
              onClick={clearMedia}
              className="h-[30px] rounded-md border border-white/25 bg-transparent px-2.5 text-xs font-semibold text-white"
            >
              {t('clear')}
            </button>
          </div>
        )}

        <span aria-hidden="true" className="h-[22px] w-px bg-white/20" />
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="h-8 rounded-md border border-red-400/50 bg-red-400/15 px-3 text-xs font-bold text-red-200"
        >
          {t('delete')}
        </button>
        <button
          type="button"
          onClick={onClear}
          aria-label={t('clearSelection')}
          className="grid size-[30px] place-items-center rounded-md border-none bg-transparent p-0 text-white/70"
        >
          ✕
        </button>
      </div>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('confirmDeleteTitle', { count: formatCount(selectedIndexes.length) })}
            </AlertDialogTitle>
            <AlertDialogDescription>{t('confirmDeleteBody')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirming(false);
                onDelete(selectedIndexes);
              }}
            >
              {t('confirmDeleteOk', { count: formatCount(selectedIndexes.length) })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
