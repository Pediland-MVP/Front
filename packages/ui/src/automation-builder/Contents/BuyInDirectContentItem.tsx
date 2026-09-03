// packages/ui/src/automation-builder/Contents/BuyInDirectContentItem.tsx
'use client';

import { cn } from '@/lib/utils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { ArrowsOutCardinalIcon } from '@phosphor-icons/react/dist/ssr/ArrowsOutCardinal';
import { ImageIcon } from '@phosphor-icons/react/dist/ssr/Image';
import { TrashSimpleIcon } from '@phosphor-icons/react/dist/ssr/TrashSimple';

import type { CommerceProductNamespace } from '../types/commerceProduct';

type BuyInDirectContentItemProps = {
  /** The field array's `_xid` — the dnd-kit sortable id, NOT the product id. */
  id: string;
  productId: string;
  /** Resolved from the parent's catalog map; `undefined` until that fetch lands. */
  product: CommerceProductNamespace.Item | undefined;
  /** Drag is meaningless with a single tile, so the handle only appears from two up. */
  showDragHandle: boolean;
  onRemove: () => void;
  onChange: () => void;
  t: (key: string) => string;
};

/**
 * One picked product, rendered as the same square tile the فروش content type uses
 * (`ProductContentItem`): cover image, a hover gradient revealing «تعویض», and a floating
 * top bar carrying the drag handle and the delete button.
 *
 * Two guards the فروش tile does not need. `coverMediaUrl` is nullable on a commerce
 * product, and `next/image` throws on a null `src`, so a product with no media falls back
 * to a placeholder. And `product` itself is `undefined` until the parent's catalog fetch
 * resolves (form state stores only `{ productId }`), so the tile must render a sane
 * skeleton-ish state rather than assuming the lookup hit.
 */
export const BuyInDirectContentItem = ({
  id,
  productId,
  product,
  showDragHandle,
  onRemove,
  onChange,
  t,
}: BuyInDirectContentItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('group relative')}
      data-testid="picked-product"
      data-xid={id}
      data-productid={productId}
    >
      <div className="absolute top-0 right-0 z-50 flex w-full items-center justify-between">
        {showDragHandle ? (
          <Button
            size="icon"
            variant={'link'}
            className="cursor-move touch-none text-white transition-opacity group-hover:opacity-100 lg:opacity-0"
            type="button"
            aria-label={t('reorder')}
            {...attributes}
            {...listeners}
          >
            <ArrowsOutCardinalIcon className="size-5" />
          </Button>
        ) : (
          // Keeps the trash button pinned to the same edge whether or not the handle shows.
          <span />
        )}

        <Button
          variant="link"
          size="icon"
          className="hover:text-destructive text-white"
          type="button"
          aria-label={t('remove')}
          onClick={onRemove}
        >
          <TrashSimpleIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative aspect-square">
        {product?.coverMediaUrl ? (
          <Image
            src={product.coverMediaUrl}
            alt={product.title || t('cover_image_alt')}
            width={250}
            height={0}
            className="aspect-square rounded-lg object-cover"
          />
        ) : (
          <div className="flex aspect-square h-full w-full items-center justify-center rounded-lg bg-gray-200">
            <ImageIcon className="text-gray-400" size={32} aria-hidden />
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-linear-to-t from-black to-transparent opacity-0 duration-150 group-hover:opacity-100">
          <Button
            type="button"
            size="sm"
            className="text-white hover:no-underline"
            variant={'link'}
            onClick={onChange}
          >
            {t('change')}
          </Button>
        </div>
      </div>

      {/* The فروش tile shows no caption, but its products are recognisable by photo alone.
          A commerce catalogue routinely carries several near-identical covers, and a product
          with no media would otherwise be an anonymous grey square. */}
      <p className="text-muted-foreground mt-1 truncate text-center text-xs">
        {product?.title ?? ''}
      </p>
    </div>
  );
};
