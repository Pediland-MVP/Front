// packages/ui/src/automation-builder/Contents/BuyInDirectContent.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFieldArray, useFormContext } from 'react-hook-form';
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { ArrowsOutCardinalIcon } from '@phosphor-icons/react/dist/ssr/ArrowsOutCardinal';
import { ImageIcon } from '@phosphor-icons/react/dist/ssr/Image';
import { TrashSimpleIcon } from '@phosphor-icons/react/dist/ssr/TrashSimple';

import { Button } from '@/components/ui/button';
import { ErrorMessage } from '@/components/ui-custom/ErrorMessage';

import { AutomationContentModeEnum } from '../constants/automationContent.enum';
import type { AutomationFormType } from '../schemas/automationForm';
import type { AutomationBuilderApiClient } from '../types/apiClient';
import type { CommerceProductNamespace } from '../types/commerceProduct';

type BuyInDirectContentProps = {
  index: number;
  mode: AutomationContentModeEnum;
  apiClient: AutomationBuilderApiClient;
};

type BuyInDirectPick = { productId: string; _xid: string };

/**
 * One picked row: draggable (reorder persists as array order, which the backend reads as
 * `position` on save — see `BuyInDirectProductSchema`) with a remove action. Mirrors
 * `ProductContentItem.tsx`'s `useSortable` usage in this same folder — same dnd-kit APIs,
 * same idiom, just a single-column list instead of a grid.
 */
function PickedProductRow({
  id,
  productId,
  product,
  onRemove,
  t,
}: {
  id: string;
  productId: string;
  product: CommerceProductNamespace.Item | undefined;
  onRemove: () => void;
  t: (key: string) => string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid="picked-product"
      data-xid={id}
      className="border-wline flex items-center gap-2 rounded-lg border p-2"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-move touch-none text-gray-400 hover:text-gray-600"
        aria-label={t('reorder')}
      >
        <ArrowsOutCardinalIcon size={16} />
      </button>

      <div className="relative size-10 shrink-0 overflow-hidden rounded bg-gray-100">
        {product?.coverMediaUrl ? (
          <img
            src={product.coverMediaUrl}
            alt={product.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <ImageIcon className="m-auto h-full text-gray-300" size={18} />
        )}
      </div>

      <div className="flex-1 truncate text-sm font-medium">{product?.title ?? productId}</div>

      <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label={t('remove')}>
        <TrashSimpleIcon className="text-destructive" size={16} />
      </Button>
    </div>
  );
}

/**
 * Editor for the BUY_IN_DIRECT content type (Task 12): the merchant picks which commerce
 * products the Instagram-DM shopping flow shows, in the order they should appear. Follows
 * the same `{ mode, index, apiClient }` + `useFieldArray` convention every other
 * content-type editor in this folder uses (`ProductContentComp` is the closest sibling) —
 * NOT a controlled `value`/`onChange` leaf — so it reads/writes
 * `contents.<index>.buyInDirectProducts` (or `reminders.<index>...`) directly against the
 * shared `react-hook-form` instance `AutomationBuilder` owns.
 *
 * Data shape note: form state already matches the backend DTO exactly
 * (`{ productId: string }[]`, Task 5) — unlike the legacy PRODUCT type, no
 * `products` -> `productIds` remap is needed anywhere before submit.
 */
export const BuyInDirectContent = ({
  index: contentIndex,
  mode,
  apiClient,
}: BuyInDirectContentProps) => {
  const t = useTranslations('Automations.Contents.BuyInDirect');
  const tNoCard = useTranslations('Commerce.List.NoCardToCard');

  const arrayName = mode === AutomationContentModeEnum.AUTOMATION ? 'contents' : 'reminders';
  const fieldPath = `${arrayName}.${contentIndex}.buyInDirectProducts`;

  const {
    control,
    formState: { errors },
  } = useFormContext<AutomationFormType>();

  // `keyName: '_xid'` avoids react-hook-form injecting its own synthetic `id` into each
  // `{ productId }` row (its default `keyName`) — same reason `ProductContentComp` uses it,
  // just defensive here too: nothing should ever end up in the submitted payload besides
  // the one field `BuyInDirectProductDto` declares.
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: fieldPath as never,
    keyName: '_xid',
  });
  const pickedFields = fields as unknown as BuyInDirectPick[];

  const [catalog, setCatalog] = useState<CommerceProductNamespace.Item[]>([]);
  // Starts `true` (not gating the picker) until the check resolves, then only flips to
  // `false` on a confirmed "no card-to-card" response — a slow/failed check must never
  // block product selection, only inform it. Mirrors `00b3f887`/`b78f6ab4`'s
  // `!!cardToCardData` gate on `ProductListPage.tsx`.
  const [hasCardToCard, setHasCardToCard] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;

    apiClient
      .get('/commerce/products?limit=100&status=active')
      .then((res) => {
        if (cancelled) return;
        setCatalog((res.data?.items ?? []) as CommerceProductNamespace.Item[]);
      })
      .catch(() => {
        // Keep the picker empty on failure -- mirrors ProductContentItemDialog's swallow.
      });

    apiClient
      .get('/payments/cardToCard')
      .then((res) => {
        if (!cancelled) setHasCardToCard(Boolean(res.data));
      })
      .catch(() => {
        // Fail open: a broken check must not block picking products.
      });

    return () => {
      cancelled = true;
    };
  }, [apiClient]);

  const productById = useMemo(() => new Map(catalog.map((p) => [p.id, p])), [catalog]);
  const pickedIds = useMemo(() => new Set(pickedFields.map((f) => f.productId)), [pickedFields]);
  const filteredCatalog = useMemo(() => {
    const query = search.trim();
    return query ? catalog.filter((p) => p.title.includes(query)) : catalog;
  }, [catalog, search]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = pickedFields.findIndex((f) => f._xid === active.id);
    const newIndex = pickedFields.findIndex((f) => f._xid === over.id);
    if (oldIndex !== -1 && newIndex !== -1) move(oldIndex, newIndex);
  };

  const fieldError = (errors as Record<string, any>)?.[arrayName]?.[contentIndex]
    ?.buyInDirectProducts;

  return (
    <div className="flex flex-col gap-4">
      {!hasCardToCard && (
        <div className="border-wline bg-wtint text-wtext rounded-lg border p-3 text-sm">
          <p className="font-bold">{tNoCard('title')}</p>
          <p className="text-muted-foreground mt-1">{tNoCard('description')}</p>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-semibold">{t('pickedTitle')}</p>

        {pickedFields.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('emptyHint')}</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={pickedFields.map((f) => f._xid)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2">
                {pickedFields.map((field, idx) => (
                  <PickedProductRow
                    key={field._xid}
                    id={field._xid}
                    productId={field.productId}
                    product={productById.get(field.productId)}
                    onRemove={() => remove(idx)}
                    t={t}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {fieldError && <ErrorMessage>{t('emptyHint')}</ErrorMessage>}
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">{t('pickerTitle')}</p>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="border-wline mb-2 w-full rounded-md border px-3 py-1.5 text-sm"
        />

        {filteredCatalog.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('pickerEmpty')}</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {filteredCatalog.map((product) => {
              const isPicked = pickedIds.has(product.id);
              return (
                <Button
                  key={product.id}
                  type="button"
                  variant="outline"
                  disabled={isPicked}
                  onClick={() => append({ productId: product.id })}
                  className="h-auto justify-start gap-2 p-2 text-start font-normal"
                >
                  <div className="relative size-8 shrink-0 overflow-hidden rounded bg-gray-100">
                    {product.coverMediaUrl ? (
                      <img
                        src={product.coverMediaUrl}
                        alt={product.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="m-auto h-full text-gray-300" size={16} />
                    )}
                  </div>
                  <span className="truncate">{product.title}</span>
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
