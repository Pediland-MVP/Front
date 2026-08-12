'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVerticalIcon, XIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { EditorMedia } from '../productEditor.schema';

/**
 * One tile in the media pool, now sortable. Split out of `MediaSection.tsx` for the same reason
 * `SortableFieldItem.tsx` is split out of `FormCustomFields.tsx`: `useSortable` must be called
 * once per draggable item, inside that item, not in the parent that maps over all of them.
 *
 * The drag handle is a SEPARATE element from the existing ✕ remove button — spreading
 * `{...attributes} {...listeners}` on the whole tile would make it fight the remove button for
 * the same pointerdown.
 */
export const SortableMediaTile = ({
  item,
  index,
  isCover,
  isBusy,
  removeLabel,
  reorderLabel,
  coverLabel,
  videoLabel,
  pendingLabel,
  onRemove,
}: {
  item: EditorMedia;
  index: number;
  isCover: boolean;
  isBusy: boolean;
  removeLabel: string;
  reorderLabel: string;
  coverLabel: string;
  videoLabel: string;
  pendingLabel: string;
  onRemove: (item: EditorMedia) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.id,
    disabled: isBusy,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex flex-col gap-1.5">
      <div
        title={item.name}
        data-testid={`media-tile-${item.id}`}
        className={cn(
          'border-ln bg-muted relative aspect-square overflow-hidden rounded-lg border',
          item.isPending && 'opacity-70',
        )}
      >
        {item.type === 'video' ? (
          <video
            src={item.url}
            poster={item.posterUrl ?? undefined}
            muted
            className="h-full w-full object-cover"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.url} alt={item.name} className="h-full w-full object-cover" />
        )}

        {/* Cover is positional, not a flag: whatever sits at index 0 is `position` 0. */}
        {isCover && (
          <span className="bg-ink absolute end-1.5 top-1.5 rounded-md px-2 py-px text-xs font-bold text-white">
            {coverLabel}
          </span>
        )}

        {item.type === 'video' && (
          <span className="bg-ink absolute end-1.5 bottom-1.5 rounded-md px-1.5 py-px text-xs font-bold text-white">
            {videoLabel}
          </span>
        )}

        {item.isPending && (
          <span className="bg-ink/80 absolute inset-x-0 bottom-0 py-0.5 text-center text-xs font-bold text-white">
            {pendingLabel}
          </span>
        )}

        {/* Listeners are omitted entirely while busy, not just visually disabled — this is what
            stops a drag from starting mid-upload/mid-delete/mid-reorder. */}
        {!isBusy && (
          <div
            {...attributes}
            {...listeners}
            aria-label={reorderLabel}
            data-testid={`media-drag-${item.id}`}
            className="hover:bg-dtint absolute start-1.5 bottom-1.5 grid size-6 cursor-grab touch-none place-items-center rounded-full bg-white/90 text-black transition-colors active:cursor-grabbing"
          >
            <GripVerticalIcon className="size-3.5" />
          </div>
        )}

        <button
          type="button"
          disabled={isBusy}
          aria-label={removeLabel}
          data-testid={`media-remove-${item.id}`}
          onClick={() => onRemove(item)}
          className="hover:bg-dtint hover:text-dtext absolute start-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-white/90 text-black transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          <XIcon className="size-3" />
        </button>
      </div>
      <div dir="ltr" className="text-mut truncate text-start text-xs">
        {item.name}
      </div>
    </div>
  );
};
