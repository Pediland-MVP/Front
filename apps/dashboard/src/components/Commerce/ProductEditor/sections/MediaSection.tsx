'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { mutate } from 'swr';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  SortableContext,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DotsSixVerticalIcon } from '@phosphor-icons/react/dist/ssr';
import { XIcon } from 'lucide-react';

import api from '@/hooks/swr/api-client';
import { usePermissions } from '@/hooks/usePermissions';
import type { CommerceProductDetail, CommerceProductMedia } from '@/types/commerce';
import type { IResponseMessage } from '@/types/responseMessage';

import { EditorSection } from '../ui/EditorSection';
import { MediaDropzone } from '../ui/MediaDropzone';

interface MediaSectionProps {
  step: number;
  mode: 'create' | 'edit';
  productId?: string;
  media: CommerceProductMedia[];
  /** Create mode only — files chosen before the product exists. Owned by `ProductEditorPage`. */
  pendingFiles?: File[];
  onPendingFilesChange?: (files: File[]) => void;
}

/**
 * Create mode. `POST /commerce/products/:id/media` needs a product id in the path and
 * `commerce_product_media.productId` is NOT NULL, so there is nowhere to put a file until the
 * product row exists. Rather than creating a throwaway draft product (which litters the list
 * when the form is abandoned), the files are held in memory here and uploaded by
 * `ProductEditorPage` immediately after `POST /commerce/products` returns the new id.
 *
 * Array order is upload order, which becomes `position` — so index 0 is the cover image.
 */
const PendingMediaPicker = ({
  step,
  files,
  onChange,
}: {
  step: number;
  files: File[];
  onChange: (files: File[]) => void;
}) => {
  const t = useTranslations('Commerce.Editor.Media');
  const { can } = usePermissions();
  const canCreate = can('product:create');

  // Object URLs are recreated whenever the file list changes and revoked on the way out;
  // without the cleanup every re-pick leaks a blob for the lifetime of the page.
  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files],
  );
  useEffect(() => {
    return () => previews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [previews]);

  return (
    <EditorSection
      step={step}
      title={t('title')}
      hint={files.length ? t('countHint', { count: files.length }) : t('pendingHint')}
      cardClassName="flex flex-col gap-3.5"
    >
      {canCreate && <MediaDropzone onFiles={(selected) => onChange([...files, ...selected])} />}

      {previews.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-2.5">
          {previews.map((preview, index) => (
            <div key={`${preview.file.name}-${index}`} className="flex flex-col gap-1.5">
              <div
                className="border-ln relative aspect-square overflow-hidden rounded-lg border"
                data-testid={`pending-media-${index}`}
              >
                {preview.file.type.startsWith('video/') ? (
                  <video src={preview.url} className="h-full w-full object-cover" muted />
                ) : (
                  // Plain <img>: the src is a local blob: URL, which next/image cannot optimise.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview.url}
                    alt={preview.file.name}
                    className="h-full w-full object-cover"
                  />
                )}
                {index === 0 && (
                  <span className="bg-ink absolute end-1.5 top-1.5 rounded-md px-2 py-px text-xs font-bold text-white">
                    {t('cover')}
                  </span>
                )}
                <button
                  type="button"
                  aria-label={t('delete')}
                  data-testid={`pending-media-remove-${index}`}
                  className="hover:bg-dtint hover:text-dtext absolute start-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-white/90 text-black transition-colors"
                  onClick={() => onChange(files.filter((_, i) => i !== index))}
                >
                  <XIcon className="size-3" />
                </button>
              </div>
              <div className="text-mut truncate text-start text-xs" dir="ltr">
                {preview.file.name}
              </div>
            </div>
          ))}
        </div>
      )}
    </EditorSection>
  );
};

// Same SWR key `ProductEditorPage.tsx` uses for `GET /commerce/products/:id`. Every mutation
// below (upload/reorder/delete) revalidates THIS key instead of keeping a local `media`
// array — that keeps the cache the single source of truth (see Task 4 brief, "Architecture,
// resolved"), and it's also how a freshly-uploaded file gets a real, resolved `url`: the
// upload endpoint's own POST response has no resolved url at all.
const productDetailKey = (productId: string) => `/commerce/products/${productId}`;

export const MediaSection = ({
  step,
  mode,
  productId,
  media,
  pendingFiles = [],
  onPendingFilesChange,
}: MediaSectionProps) => {
  const t = useTranslations('Commerce.Editor.Media');
  const { can } = usePermissions();
  const canEdit = can('product:edit');
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const sortedMedia = [...media].sort((a, b) => a.position - b.position);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Direct `mode`/`productId` checks (not a derived boolean) so TS narrows `productId` from
  // `string | undefined` to `string` for the rest of the component.
  if (mode !== 'edit' || !productId) {
    return (
      <PendingMediaPicker
        step={step}
        files={pendingFiles}
        onChange={onPendingFilesChange ?? (() => {})}
      />
    );
  }

  const uploadOne = async (file: File, index: number, total: number) => {
    const formData = new FormData();
    formData.append('file', file);
    await api.post(`/commerce/products/${productId}/media`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (!event.total) return;
        const filePortion = event.loaded / event.total;
        setProgress(Math.round(((index + filePortion) / total) * 100));
      },
    });
  };

  const handleFilesSelected = async (files: File[]) => {
    // Defense-in-depth: the backend already enforces `product:edit` on
    // `POST /commerce/products/:id/media`, but the request must never even fire when the
    // viewer lacks the permission — same convention as every other mutation gated below.
    if (!canEdit || files.length === 0) return;

    setIsUploading(true);
    setProgress(0);

    // One request per file — the endpoint accepts a single `file` per call — but still
    // await the whole batch (via allSettled, so one failure doesn't abort the rest) before
    // revalidating and toasting once, per the brief.
    const results = await Promise.allSettled(
      files.map((file, index) => uploadOne(file, index, files.length)),
    );

    setIsUploading(false);
    setProgress(0);

    await mutate(productDetailKey(productId));

    const failedCount = results.filter((result) => result.status === 'rejected').length;
    if (failedCount === 0) {
      toast.success(t('uploadSuccess'));
    } else {
      toast.error(t('uploadError'));
    }
  };

  const handleDelete = async (mediaId: string) => {
    if (!canEdit) return;
    try {
      await api.delete(`/commerce/products/${productId}/media/${mediaId}`);
      toast.success(t('deleteSuccess'));
    } catch {
      toast.error(t('deleteError'));
    } finally {
      await mutate(productDetailKey(productId));
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!canEdit) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedMedia.findIndex((item) => item.id === active.id);
    const newIndex = sortedMedia.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(sortedMedia, oldIndex, newIndex);
    const mediaIds = reordered.map((item) => item.id);
    const key = productDetailKey(productId);

    // Optimistic re-render for instant feedback: write the reordered list straight into the
    // shared SWR cache entry (NOT a local `useState`) with `revalidate: false` so it doesn't
    // race the PATCH below with a premature refetch. The final `mutate(key)` after the PATCH
    // settles revalidates for real, so the authoritative order always wins.
    await mutate(
      key,
      (current: IResponseMessage<CommerceProductDetail> | undefined) =>
        current && {
          ...current,
          data: {
            ...current.data,
            media: reordered.map((item, index) => ({ ...item, position: index })),
          },
        },
      { revalidate: false },
    );

    try {
      await api.patch(`/commerce/products/${productId}/media`, { mediaIds });
    } catch {
      toast.error(t('reorderError'));
    } finally {
      await mutate(key);
    }
  };

  return (
    <EditorSection
      step={step}
      title={t('title')}
      hint={sortedMedia.length ? t('countHint', { count: sortedMedia.length }) : undefined}
      cardClassName="flex flex-col gap-3.5"
    >
      {canEdit && (
        <MediaDropzone
          onFiles={handleFilesSelected}
          isUploading={isUploading}
          progress={progress}
        />
      )}

      {sortedMedia.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={sortedMedia.map((item) => item.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-2.5">
              {sortedMedia.map((item) => (
                <MediaTile
                  key={item.id}
                  item={item}
                  coverLabel={t('cover')}
                  deleteLabel={t('delete')}
                  videoLabel={t('videoBadge')}
                  onDelete={handleDelete}
                  canEdit={canEdit}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </EditorSection>
  );
};

const MediaTile = ({
  item,
  coverLabel,
  deleteLabel,
  videoLabel,
  onDelete,
  canEdit,
}: {
  item: CommerceProductMedia;
  coverLabel: string;
  deleteLabel: string;
  videoLabel: string;
  onDelete: (mediaId: string) => void;
  canEdit: boolean;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.id,
    disabled: !canEdit,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // The cover badge is implicit — whichever tile currently sits at `position === 0` — there
  // is no separate `isCover` flag on `CommerceProductMedia`.
  const isCover = item.position === 0;
  // Video media never embeds/plays inline here — only its resolved `posterUrl` renders, same
  // tile treatment as an image.
  const previewUrl = item.type === 'video' ? (item.posterUrl ?? item.url) : item.url;

  return (
    <div ref={setNodeRef} style={style} className="flex flex-col gap-1.5">
      <div className="bg-muted border-ln relative aspect-square overflow-hidden rounded-lg border">
        <Image
          src={previewUrl}
          alt={item.alt ?? ''}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 160px"
        />

        {isCover && (
          <span className="bg-ink absolute end-1.5 top-1.5 z-10 rounded-md px-2 py-px text-xs font-bold text-white">
            {coverLabel}
          </span>
        )}

        {item.type === 'video' && (
          <span className="bg-ink absolute end-1.5 bottom-1.5 z-10 rounded-md px-1.5 py-px text-xs font-bold text-white">
            {videoLabel}
          </span>
        )}

        {canEdit && (
          <button
            type="button"
            aria-label={deleteLabel}
            data-testid={`media-remove-${item.id}`}
            className="hover:bg-dtint hover:text-dtext absolute start-1.5 top-1.5 z-10 grid size-6 place-items-center rounded-full bg-white/90 text-black transition-colors"
            onClick={() => onDelete(item.id)}
          >
            <XIcon className="size-3" />
          </button>
        )}

        {canEdit && (
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="absolute start-1.5 bottom-1.5 z-10 grid size-6 cursor-grab touch-none place-items-center rounded-md bg-black/45 text-white active:cursor-grabbing"
          >
            <DotsSixVerticalIcon size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
