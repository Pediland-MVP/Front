'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useFormContext, useWatch } from 'react-hook-form';

import { cn } from '@/lib/utils';
import e2pNumbers from '@/utils/e2pNumber';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';

import { topKeyOf } from '../variant/variantTree.util';
import type { VariantMediaTarget } from '../variant/VariantLeafRow';
import { posterOf, type ProductFormValues } from '../productEditor.schema';

/** Re-exported, not redeclared — `variant/VariantLeafRow` owns the one definition. */
export type { VariantMediaTarget };

export const VariantMediaPickerDialog = ({
  target,
  onClose,
}: {
  target: VariantMediaTarget | null;
  onClose: () => void;
}) => {
  const t = useTranslations('Commerce.Editor.MediaPicker');
  const { control, setValue } = useFormContext<ProductFormValues>();
  const media = useWatch({ control, name: 'media' }) ?? [];
  const variants = useWatch({ control, name: 'variants' }) ?? [];

  const indexes = useMemo(() => {
    if (!target) return [];
    if (target.kind === 'row') return variants[target.index] ? [target.index] : [];
    return variants.reduce<number[]>((acc, variant, index) => {
      if (topKeyOf(variant.valueIds) === target.key) acc.push(index);
      return acc;
    }, []);
  }, [target, variants]);

  /**
   * The tiles reflect the FIRST target's list. For a group that is the leader row, which is
   * enough: a group edit always writes the whole selection to every leaf, so after the first
   * click they all agree anyway.
   */
  const current = indexes.length ? (variants[indexes[0]]?.mediaIds ?? []) : [];

  const write = (next: string[]) => {
    for (const index of indexes) {
      // A FRESH array per row. Writing one shared reference would alias every leaf's mediaIds
      // onto the same array, so a later single-row edit would silently change all of them.
      setValue(`variants.${index}.mediaIds`, [...next], { shouldDirty: true });
    }
  };

  const toggle = (mediaId: string) =>
    write(
      current.includes(mediaId)
        ? current.filter((id) => id !== mediaId)
        : // Appended, never inserted: pick ORDER is the contract — index 0 is this variant's
          // cover, so the first thing clicked stays the cover until it is deselected.
          [...current, mediaId],
    );

  return (
    <Dialog
      open={target !== null}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{target?.kind === 'group' ? t('titleGroup') : t('titleRow')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        {media.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <div className="mb-1.5 text-sm font-bold">{t('emptyTitle')}</div>
            <p className="text-mut text-xs">{t('emptyBody')}</p>
          </div>
        ) : (
          <div className="grid max-h-[52vh] grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-2.5 overflow-y-auto">
            {media.map((item) => {
              const order = current.indexOf(item.id);
              const isPicked = order >= 0;
              // A video's own url is the video FILE — `next/image` renders it as a broken tile.
              // Draw its poster frame when the backend resolved one, and fall back to a real
              // `<video>` element when it did not (a file queued in create mode has neither an
              // upload nor a poster yet).
              const poster = posterOf(item);
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={isPicked}
                  aria-label={item.name}
                  title={item.name}
                  data-testid={`variant-media-tile-${item.id}`}
                  onClick={() => toggle(item.id)}
                  className={cn(
                    'bg-card relative aspect-square overflow-hidden rounded-lg border-2 transition-colors',
                    isPicked ? 'border-primary' : 'border-ln hover:border-lnv',
                  )}
                >
                  {/*
                    `unoptimized`: in CREATE mode a tile's url is a blob: object URL for a file
                    that has not been uploaded yet, and the Next image optimizer cannot fetch
                    one.
                  */}
                  {poster ? (
                    <Image
                      src={poster}
                      alt={item.name}
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="104px"
                    />
                  ) : (
                    <video
                      src={item.url}
                      muted
                      aria-hidden="true"
                      className="absolute inset-0 size-full object-cover"
                    />
                  )}

                  {item.type === 'video' && (
                    <span className="bg-dark absolute start-1 bottom-1 rounded px-1.5 text-xs font-bold text-white">
                      {t('video')}
                    </span>
                  )}

                  {isPicked && (
                    <span
                      data-testid={`variant-media-order-${item.id}`}
                      className="bg-primary text-primary-foreground absolute end-1 top-1 grid size-5 place-items-center rounded-full text-xs font-extrabold"
                    >
                      {e2pNumbers(String(order + 1))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="border-lnv flex items-center gap-2.5 border-t pt-3">
          <span className="text-mut flex-1 text-xs" data-testid="variant-media-hint">
            {target?.kind === 'group' ? t('hintGroup') : t('hintRow')}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            data-testid="variant-media-clear"
            onClick={() => write([])}
          >
            {t('clear')}
          </Button>
          <Button type="button" size="sm" onClick={onClose}>
            {t('done')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
