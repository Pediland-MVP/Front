'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useFormContext, useWatch } from 'react-hook-form';
import useSWRImmutable from 'swr/immutable';

import { cn } from '@/lib/utils';
import e2pNumbers from '@/utils/e2pNumber';
import type { CommerceCategory, PaginatedResult } from '@/types/commerce';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';

import { discountPercent } from '../variant/variantTree.util';
import { formatAmount } from '../utils/editorNumber.util';
import { markdownToPlainText } from '../utils/markdown.util';
import { posterOf, type EditorMedia, type ProductFormValues } from '../productEditor.schema';

/** Same key `useProductLoad` fills, so this is a shared cache read, not a second fetch. */
const CATEGORIES_KEY = '/commerce/categories';

/** The design shows at most six thumbnails under the main image. */
const THUMB_LIMIT = 6;

interface PreviewAxis {
  key: string;
  name: string;
  values: Array<{ key: string; label: string; colorHex?: string }>;
}

/**
 * An approximation of the storefront card, built from the LIVE form — nothing here is fetched
 * about the product, so it reflects unsaved edits, which is the whole point of the button.
 *
 * It is also the only place in the editor that answers "does this actually hang together?": the
 * variant grid shows a table, this shows what a customer would see for one combination.
 */
export const PreviewDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const t = useTranslations('Commerce.Editor.Preview');
  // The breadcrumb arrow is a per-locale decision (it points the other way in an RTL path), so it
  // is a translation value, not a glyph typed into a .tsx — same key the editor shell reads.
  const tCategory = useTranslations('Commerce.Editor.Category');
  const { control } = useFormContext<ProductFormValues>();
  // The whole form, on purpose: the preview touches title, description, category, media, the
  // base seeds, every axis and every variant. Watching each one separately would be a dozen
  // subscriptions for a surface that re-renders as a unit anyway. `useWatch` types the bare
  // form as deep-partial; the defaults are always present, so the cast is safe here.
  const values = useWatch({ control }) as ProductFormValues;

  const [pickedValues, setPickedValues] = useState<Record<string, string>>({});
  const [pickedMediaId, setPickedMediaId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    // Re-open always starts from the first combination and the cover image, rather than from
    // whatever was left selected before an axis was edited underneath it.
    setPickedValues({});
    setPickedMediaId(null);
  }, [open]);

  const { data: categoriesData } =
    useSWRImmutable<PaginatedResult<CommerceCategory[]>>(CATEGORIES_KEY);

  const categoryPath = useMemo(() => {
    const list = categoriesData?.items ?? [];
    const node = list.find((category) => category.id === values.categoryId);
    if (!node) return null;
    const parent = node.parentId
      ? list.find((category) => category.id === node.parentId)
      : undefined;
    return parent ? `${parent.name}${tCategory('pathSeparator')}${node.name}` : node.name;
  }, [categoriesData, tCategory, values.categoryId]);

  const axes: PreviewAxis[] = useMemo(
    () =>
      (values.options ?? [])
        .filter((option) => option.values.length > 0)
        .map((option) => ({
          key: option.id ?? option.localKey,
          name: option.name.trim() || t('axisFallback'),
          values: option.values.map((value) => ({
            // `id ?? localKey` — the same key a variant row stores in `valueIds`, which is what
            // makes the lookup below work for an axis value typed this session.
            key: value.id ?? value.localKey,
            label: value.value,
            colorHex: value.colorHex,
          })),
        })),
    [values.options, t],
  );

  const selection = axes.map((axis) => pickedValues[axis.key] ?? axis.values[0]?.key ?? '');

  const variants = values.variants ?? [];
  const row = useMemo(() => {
    // No axes at all: the product has exactly one implicit variation, and that is the row.
    if (!axes.length) return variants[0] ?? null;
    return (
      variants.find(
        (variant) =>
          variant.valueIds.length === selection.length &&
          variant.valueIds.every((valueId, index) => valueId === selection[index]),
      ) ?? null
    );
    // `selection` is derived fresh each render; join it so the memo keys on its CONTENT.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [axes.length, variants, selection.join('|')]);

  const price = row ? row.price : (values.basePrice ?? null);
  const compare = row ? row.compare : (values.baseCompare ?? null);
  const stock = row ? (row.infinite ? Infinity : row.stock) : (values.baseStock ?? null);
  const off = discountPercent(price, compare);

  const media: EditorMedia[] = values.media ?? [];
  const pool = useMemo(() => {
    const byId = new Map(media.map((item) => [item.id, item]));
    const assigned = row
      ? (row.mediaIds ?? [])
          .map((id) => byId.get(id))
          .filter((item): item is EditorMedia => item !== undefined)
      : [];
    // A variant with its own media replaces the pool; one without falls back to the product's,
    // which is exactly what the storefront does.
    return assigned.length ? assigned : media;
  }, [media, row]);

  const main = pool.find((item) => item.id === pickedMediaId) ?? pool[0] ?? null;
  const thumbs = pool.slice(0, THUMB_LIMIT);
  // A video's `url` is the video file; `next/image` draws it as a broken tile. Prefer the poster
  // frame the backend resolved, and fall back to a real `<video>` when there is none.
  const mainPoster = main ? posterOf(main) : null;

  const stockText =
    stock === Infinity
      ? t('stockAvailable')
      : stock == null
        ? t('stockUnset')
        : stock === 0
          ? t('stockOut')
          : t('stockCount', { count: e2pNumbers(String(stock)) });
  const isStockBad = stock == null || stock === 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 grid-cols-1 items-start gap-5 overflow-y-auto sm:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
          <div className="flex flex-col gap-2">
            <div className="border-ln bg-muted relative aspect-square w-full overflow-hidden rounded-lg border">
              {main && mainPoster ? (
                // `unoptimized` for the same reason the media picker needs it: a create-mode
                // tile's url is a blob: object URL the Next optimizer cannot fetch.
                <Image
                  src={mainPoster}
                  alt={main.name}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="240px"
                />
              ) : main ? (
                <video
                  src={main.url}
                  muted
                  aria-label={main.name}
                  className="absolute inset-0 size-full object-cover"
                />
              ) : (
                <span className="text-mut absolute inset-0 grid place-items-center text-xs">
                  {t('noMedia')}
                </span>
              )}
              {off != null && (
                <span
                  data-testid="preview-off"
                  className="bg-destructive absolute start-2 top-2 rounded px-1.5 py-0.5 text-xs font-extrabold text-white"
                >
                  {t('offBadge', { percent: e2pNumbers(String(off)) })}
                </span>
              )}
            </div>

            {thumbs.length > 1 && (
              <div className="flex flex-wrap gap-1.5">
                {thumbs.map((item) => {
                  const poster = posterOf(item);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={main?.id === item.id}
                      aria-label={item.name}
                      data-testid={`preview-thumb-${item.id}`}
                      onClick={() => setPickedMediaId(item.id)}
                      className={cn(
                        'bg-card relative size-11 overflow-hidden rounded-md border-2',
                        main?.id === item.id ? 'border-primary' : 'border-ln',
                      )}
                    >
                      {poster ? (
                        <Image
                          src={poster}
                          alt={item.name}
                          fill
                          unoptimized
                          className="object-cover"
                          sizes="44px"
                        />
                      ) : (
                        <video
                          src={item.url}
                          muted
                          aria-hidden="true"
                          className="absolute inset-0 size-full object-cover"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-3.5">
            <div>
              <div className="text-mut mb-1 text-xs" data-testid="preview-category">
                {categoryPath ?? t('noCategory')}
              </div>
              <h3
                data-testid="preview-title"
                className="text-secondary text-lg font-extrabold text-pretty"
              >
                {values.title?.trim() || t('untitled')}
              </h3>
            </div>

            <div className="flex flex-wrap items-baseline gap-2.5">
              <span
                data-testid="preview-price"
                className="text-xl font-extrabold whitespace-nowrap"
              >
                {price == null ? t('noPrice') : t('priceWithUnit', { amount: formatAmount(price) })}
              </span>
              {off != null && compare != null && (
                <span
                  data-testid="preview-compare"
                  className="text-mut text-sm whitespace-nowrap line-through"
                >
                  {t('priceWithUnit', { amount: formatAmount(compare) })}
                </span>
              )}
            </div>

            <div
              data-testid="preview-stock"
              className={cn('text-xs font-bold', isStockBad ? 'text-dtext' : 'text-emerald-600')}
            >
              {stockText}
            </div>

            {axes.map((axis) => (
              <div key={axis.key} className="flex flex-col gap-2">
                <div className="text-mut text-xs font-bold">{axis.name}</div>
                <div className="flex flex-wrap gap-2">
                  {axis.values.map((value) => {
                    const isOn = (pickedValues[axis.key] ?? axis.values[0]?.key) === value.key;
                    return (
                      <button
                        key={value.key}
                        type="button"
                        aria-pressed={isOn}
                        data-testid={`preview-value-${value.key}`}
                        onClick={() =>
                          setPickedValues((current) => ({ ...current, [axis.key]: value.key }))
                        }
                        className={cn(
                          'bg-card inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition-colors',
                          isOn ? 'border-primary bg-tint2 text-primary' : 'border-ln',
                        )}
                      >
                        {value.colorHex && (
                          <span
                            aria-hidden="true"
                            style={{ backgroundColor: value.colorHex }}
                            className="size-3 flex-none rounded-full border border-black/15"
                          />
                        )}
                        <span>{value.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <p
              data-testid="preview-description"
              className="text-mut text-sm leading-relaxed whitespace-pre-line"
            >
              {markdownToPlainText(values.description ?? '') || t('noDescription')}
            </p>

            {/* Disabled on purpose — this is a preview, not a storefront. */}
            <Button type="button" disabled data-testid="preview-add-to-cart" className="h-11">
              {t('addToCart')}
            </Button>
          </div>
        </div>

        <div className="border-lnv flex items-center gap-2.5 border-t pt-3">
          <span className="text-mut flex-1 text-xs" data-testid="preview-footer">
            {row ? t('footerVariant') : t('footerFallback')}
          </span>
          <Button type="button" size="sm" variant="outline" onClick={onClose}>
            {t('close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
