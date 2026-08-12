'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { UploadIcon } from 'lucide-react';
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
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';

import { cn } from '@/lib/utils';
import e2pNumbers from '@/utils/e2pNumber';

import type { EditorMedia } from '../productEditor.schema';
import { EditorSection } from '../ui/EditorSection';
import { SortableMediaTile } from './SortableMediaTile';

/**
 * One tile in the media pool.
 *
 * `isPending` marks a file picked in CREATE mode: `commerce_product_media.productId` is NOT NULL
 * and the upload endpoint needs an id in its path, so there is nowhere to put the file until
 * `POST /commerce/products` has returned one. It renders from an object URL and the page uploads
 * it right after create (spec, decision 3).
 *
 * Re-exported, NOT redeclared: this file used to carry its own structurally identical copy, and
 * two definitions of the same tile drift the moment a field is added to one of them — silently,
 * because nothing in the type system compares them.
 */
export type { EditorMedia };

/**
 * Step ۴ — the media pool.
 *
 * Deliberately presentational plus a file picker: it never calls the API. Upload, delete and
 * reorder differ between create and edit mode and both need to touch the SWR cache and the
 * variant media ids, so they live in the page (Task 8, extended for reorder). This component only
 * says "the merchant chose these files" / "the merchant wants this one gone" / "the merchant
 * dropped this tile in a new spot".
 */
export const MediaSection = ({
  step = 4,
  productId,
  media,
  isBusy = false,
  onAdd,
  onRemove,
  onReorder,
}: {
  step?: number;
  productId?: string;
  media: EditorMedia[];
  /**
   * An upload, a delete, or a reorder is in flight. In EDIT mode all three are real API calls the
   * page makes on the spot, and they run one at a time — so without this the dropzone, the ✕
   * buttons and the drag handles would keep accepting interactions the page silently drops.
   */
  isBusy?: boolean;
  onAdd: (files: File[]) => void;
  onRemove: (item: EditorMedia) => void;
  onReorder: (newOrder: EditorMedia[]) => void;
}) => {
  const t = useTranslations('Commerce.Editor.Media');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = media.findIndex((item) => item.id === active.id);
    const newIndex = media.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(media, oldIndex, newIndex));
  };

  const take = (list: FileList | null) => {
    if (isBusy) return;
    const files = Array.from(list ?? []);
    if (files.length) onAdd(files);
  };

  const hint = media.length
    ? t('count', { count: e2pNumbers(String(media.length)) })
    : productId
      ? undefined
      : t('pendingHint');

  return (
    <EditorSection step={step} title={t('title')} hint={hint} cardClassName="flex flex-col gap-3.5">
      <div
        role="button"
        tabIndex={isBusy ? -1 : 0}
        aria-disabled={isBusy}
        aria-busy={isBusy}
        data-testid="media-dropzone"
        onDragOver={(e) => {
          e.preventDefault();
          if (!isBusy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          take(e.dataTransfer.files);
        }}
        onClick={() => {
          if (!isBusy) fileRef.current?.click();
        }}
        onKeyDown={(e) => {
          if (isBusy) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileRef.current?.click();
          }
        }}
        className={cn(
          'border-lnv bg-tint rounded-lg border-2 border-dashed px-5 py-6 text-center transition-colors',
          isBusy ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
          dragging && 'border-primary bg-tint2',
        )}
      >
        <div className="border-lnv bg-card text-primary mx-auto mb-2.5 grid size-10 place-items-center rounded-lg border">
          <UploadIcon className="size-4.5" />
        </div>
        <div className="mb-1 text-sm font-bold">{isBusy ? t('busy') : t('dropTitle')}</div>
        <p className="text-mut m-0 text-xs text-pretty">{isBusy ? t('busyHint') : t('dropHint')}</p>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            take(e.target.files);
            // Reset, so picking the SAME file twice in a row still fires a change event.
            e.target.value = '';
          }}
        />
      </div>

      {media.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={media.map((item) => item.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-2.5">
              {media.map((item, index) => (
                <SortableMediaTile
                  key={item.id}
                  item={item}
                  index={index}
                  isCover={index === 0}
                  isBusy={isBusy}
                  removeLabel={t('remove', { name: item.name })}
                  reorderLabel={t('reorderHandle', { name: item.name })}
                  coverLabel={t('cover')}
                  videoLabel={t('video')}
                  pendingLabel={t('pending')}
                  onRemove={onRemove}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </EditorSection>
  );
};
