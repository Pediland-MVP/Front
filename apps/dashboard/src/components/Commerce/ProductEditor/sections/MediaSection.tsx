'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { UploadIcon, XIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import e2pNumbers from '@/utils/e2pNumber';

import { EditorSection } from '../ui/EditorSection';

/**
 * One tile in the media pool.
 *
 * `isPending` marks a file picked in CREATE mode: `commerce_product_media.productId` is NOT NULL
 * and the upload endpoint needs an id in its path, so there is nowhere to put the file until
 * `POST /commerce/products` has returned one. It renders from an object URL and the page uploads
 * it right after create (spec, decision 3).
 */
export interface EditorMedia {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video';
  isPending: boolean;
  file?: File;
}

/**
 * Step ۴ — the media pool.
 *
 * Deliberately presentational plus a file picker: it never calls the API. Upload and delete
 * differ between create and edit mode and both need to touch the SWR cache and the variant media
 * ids, so they live in the page (Task 8). This component only says "the merchant chose these
 * files" / "the merchant wants this one gone".
 */
export const MediaSection = ({
  step = 4,
  productId,
  media,
  onAdd,
  onRemove,
}: {
  step?: number;
  productId?: string;
  media: EditorMedia[];
  onAdd: (files: File[]) => void;
  onRemove: (item: EditorMedia) => void;
}) => {
  const t = useTranslations('Commerce.Editor.Media');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const take = (list: FileList | null) => {
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
        tabIndex={0}
        data-testid="media-dropzone"
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          take(e.dataTransfer.files);
        }}
        onClick={() => fileRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileRef.current?.click();
          }
        }}
        className={cn(
          'border-lnv bg-tint cursor-pointer rounded-lg border-2 border-dashed px-5 py-6 text-center transition-colors',
          dragging && 'border-primary bg-tint2',
        )}
      >
        <div className="border-lnv bg-card text-primary mx-auto mb-2.5 grid size-10 place-items-center rounded-lg border">
          <UploadIcon className="size-4.5" />
        </div>
        <div className="mb-1 text-sm font-bold">{t('dropTitle')}</div>
        <p className="text-mut m-0 text-xs text-pretty">{t('dropHint')}</p>
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
        <div className="grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-2.5">
          {media.map((item, index) => (
            <div key={item.id} className="flex flex-col gap-1.5">
              <div
                title={item.name}
                data-testid={`media-tile-${item.id}`}
                className={cn(
                  'border-ln bg-muted relative aspect-square overflow-hidden rounded-lg border',
                  item.isPending && 'opacity-70',
                )}
              >
                {item.type === 'video' ? (
                  <video src={item.url} muted className="h-full w-full object-cover" />
                ) : (
                  // Plain <img>: a pending tile's src is a local blob: URL, which next/image
                  // cannot optimise, and mixing the two components per tile buys nothing.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt={item.name} className="h-full w-full object-cover" />
                )}

                {/* Cover is positional, not a flag: whatever sits at index 0 is `position` 0. */}
                {index === 0 && (
                  <span className="bg-ink absolute end-1.5 top-1.5 rounded-md px-2 py-px text-xs font-bold text-white">
                    {t('cover')}
                  </span>
                )}

                {item.type === 'video' && (
                  <span className="bg-ink absolute end-1.5 bottom-1.5 rounded-md px-1.5 py-px text-xs font-bold text-white">
                    {t('video')}
                  </span>
                )}

                {item.isPending && (
                  <span className="bg-ink/80 absolute inset-x-0 bottom-0 py-0.5 text-center text-xs font-bold text-white">
                    {t('pending')}
                  </span>
                )}

                <button
                  type="button"
                  aria-label={t('remove', { name: item.name })}
                  data-testid={`media-remove-${item.id}`}
                  onClick={() => onRemove(item)}
                  className="hover:bg-dtint hover:text-dtext absolute start-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-white/90 text-black transition-colors"
                >
                  <XIcon className="size-3" />
                </button>
              </div>
              <div dir="ltr" className="text-mut truncate text-start text-xs">
                {item.name}
              </div>
            </div>
          ))}
        </div>
      )}
    </EditorSection>
  );
};
