'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { mutate } from 'swr';
import { CheckIcon, StarIcon, VideoCameraIcon } from '@phosphor-icons/react/dist/ssr';

import api from '@/hooks/swr/api-client';
import { cn } from '@/lib/utils';
import type {
  CommerceProductDetail,
  CommerceProductMedia,
  CommerceVariantMediaAssignment,
} from '@/types/commerce';
import type { IResponseMessage } from '@/types/responseMessage';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';
import { ButtonLoading } from '@/components/ui-custom/ButtonLoading';

interface VariantMediaPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  variantId: string;
  variantLabel: string;
  /** The product's whole media pool (`GET /commerce/products/:id`'s `media` field) — the
   * variant can only pick from media that already belongs to the product. */
  pool: CommerceProductMedia[];
  /** The variant's currently-known assignment, if any — undefined means "no override known
   * yet" (see the cache-write comment in `handleSave` for why the GET response can't supply
   * this today). */
  initialAssignment?: CommerceVariantMediaAssignment;
}

// Same SWR key `ProductEditorPage.tsx`/`MediaSection.tsx` use for `GET /commerce/products/:id`
// — see MediaSection.tsx's identical constant for why: the shared cache entry, not a
// redundant local fetch, is the single source of truth.
const productDetailKey = (productId: string) => `/commerce/products/${productId}`;

export const VariantMediaPickerDialog = ({
  open,
  onOpenChange,
  productId,
  variantId,
  variantLabel,
  pool,
  initialAssignment,
}: VariantMediaPickerDialogProps) => {
  const t = useTranslations('Commerce.Editor.VariantMedia');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [coverId, setCoverId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Re-seed the working selection from the variant's currently-known assignment every time the
  // dialog opens for a (possibly different) variant — mirrors the approved mockup's
  // `openVariantMediaPicker`, which re-reads `row.media` fresh on every open rather than
  // carrying over the previous variant's picker state.
  useEffect(() => {
    if (!open) return;
    setSelectedIds(initialAssignment?.selectedMediaIds ?? []);
    setCoverId(initialAssignment?.coverMediaId ?? null);
  }, [open, variantId, initialAssignment]);

  const toggleSelected = (mediaId: string) => {
    setSelectedIds((current) => {
      if (!current.includes(mediaId)) return [...current, mediaId];
      // Deselecting the current cover clears the cover too — a tile that isn't part of the
      // assignment can't stay flagged as its cover.
      if (coverId === mediaId) setCoverId(null);
      return current.filter((id) => id !== mediaId);
    });
  };

  // Star click: auto-selects the tile if it wasn't already selected, then toggles cover status
  // — clicking the star on the CURRENT cover clears the cover (stays selected), clicking it on
  // any other tile makes that tile the new cover. Exactly the mockup's `pool-tile .star`
  // handler, adapted to React state instead of direct DOM mutation.
  const toggleCover = (mediaId: string) => {
    setSelectedIds((current) => (current.includes(mediaId) ? current : [...current, mediaId]));
    setCoverId((current) => (current === mediaId ? null : mediaId));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const key = productDetailKey(productId);

    // Optimistic re-render for instant feedback: write the desired assignment straight into
    // the shared SWR cache entry (NOT a local `useState`) with `revalidate: false` so it
    // doesn't race the PUT below with a premature refetch — same convention as Task 4's
    // MediaSection#handleDragEnd. The final `mutate(key)` after the PUT settles revalidates
    // for real (`GET /commerce/products/:id` returns this field since Back commit
    // `869261f8`), so the authoritative assignment always wins.
    await mutate(
      key,
      (current: IResponseMessage<CommerceProductDetail> | undefined) =>
        current && {
          ...current,
          data: {
            ...current.data,
            variants: current.data.variants.map((variant) =>
              variant.id === variantId
                ? { ...variant, media: { selectedMediaIds: selectedIds, coverMediaId: coverId } }
                : variant,
            ),
          },
        },
      { revalidate: false },
    );

    try {
      // Full-replace semantics: always send the complete desired set, never a delta. An empty
      // `selectedIds` is itself the "clear the override, fall back to the product's cover"
      // action — no separate reset affordance needed.
      await api.put(`/commerce/products/${productId}/variants/${variantId}/media`, {
        mediaIds: selectedIds,
        ...(coverId && { coverMediaId: coverId }),
      });
      toast.success(t('saveSuccess'));
      onOpenChange(false);
    } catch {
      // Only a PUT failure is a real save error — a hiccup in the revalidating `mutate` below
      // must not report the save itself as failed (that mutate runs in `finally`, decoupled
      // from this signal, matching MediaSection#handleDragEnd's convention).
      toast.error(t('saveError'));
    } finally {
      // A rejection here is caught (not just contained by nested finally): the optimistic
      // write above already reflects the just-saved assignment, so a revalidation hiccup
      // isn't a save failure — a later natural refetch reconciles it. Without this catch,
      // the rejection would both skip `setIsSaving(false)` (permanently stranding the Save
      // button in a loading state, since the dialog is never remounted between opens) and
      // surface as an unhandled promise rejection.
      try {
        await mutate(key);
      } catch {
        // intentionally silent — see comment above
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{variantLabel}</DialogDescription>
        </DialogHeader>

        <p className="text-muted-foreground text-sm">{t('description')}</p>

        {pool.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('emptyPool')}</p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {pool.map((item) => (
              <MediaPoolTile
                key={item.id}
                item={item}
                isSelected={selectedIds.includes(item.id)}
                isCover={coverId === item.id}
                onToggleSelected={() => toggleSelected(item.id)}
                onToggleCover={() => toggleCover(item.id)}
                selectLabel={t('selectMedia')}
                coverLabel={t('setCover')}
              />
            ))}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <ButtonLoading type="button" isLoading={isSaving} onClick={handleSave}>
            {t('save')}
          </ButtonLoading>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const MediaPoolTile = ({
  item,
  isSelected,
  isCover,
  onToggleSelected,
  onToggleCover,
  selectLabel,
  coverLabel,
}: {
  item: CommerceProductMedia;
  isSelected: boolean;
  isCover: boolean;
  onToggleSelected: () => void;
  onToggleCover: () => void;
  selectLabel: string;
  coverLabel: string;
}) => {
  // Video media never embeds/plays inline here — only its resolved `posterUrl` renders, same
  // rule `MediaSection.tsx`'s tile follows.
  const previewUrl = item.type === 'video' ? (item.posterUrl ?? item.url) : item.url;

  return (
    <div
      role="button"
      tabIndex={0}
      data-testid={`media-pool-tile-${item.id}`}
      onClick={onToggleSelected}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggleSelected();
        }
      }}
      className={cn(
        'bg-muted relative aspect-square cursor-pointer overflow-hidden rounded-lg border-2',
        isSelected ? 'border-primary' : 'border-transparent',
      )}
    >
      <Image
        src={previewUrl}
        alt={item.alt ?? ''}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 33vw, 25vw"
      />

      {item.type === 'video' && (
        <span className="absolute bottom-1.5 left-1.5 z-10 flex size-5 items-center justify-center rounded bg-black/50 text-white">
          <VideoCameraIcon size={12} weight="fill" />
        </span>
      )}

      <span
        className={cn(
          'absolute top-1.5 right-1.5 z-10 flex size-5 items-center justify-center rounded border-2 border-white/85 bg-black/15',
          isSelected && 'bg-primary border-primary',
        )}
        aria-label={selectLabel}
      >
        {isSelected && <CheckIcon size={11} weight="bold" className="text-white" />}
      </span>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleCover();
        }}
        aria-label={coverLabel}
        data-testid={`media-pool-tile-star-${item.id}`}
        className={cn(
          'absolute top-1.5 left-1.5 z-10 flex size-6 items-center justify-center rounded-full bg-black/35 text-white',
          isCover && 'bg-amber-400 text-amber-950',
        )}
      >
        <StarIcon size={13} weight={isCover ? 'fill' : 'regular'} />
      </button>
    </div>
  );
};
