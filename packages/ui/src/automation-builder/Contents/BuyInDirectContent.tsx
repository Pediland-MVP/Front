// packages/ui/src/automation-builder/Contents/BuyInDirectContent.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';

import { Button } from '@/components/ui/button';
import { ErrorMessage } from '@/components/ui-custom/ErrorMessage';

import { AutomationContentModeEnum } from '../constants/automationContent.enum';
import type { AutomationFormType } from '../schemas/automationForm';
import type { AutomationBuilderApiClient } from '../types/apiClient';
import type { CommerceProductNamespace } from '../types/commerceProduct';
import { BuyInDirectContentItem } from './BuyInDirectContentItem';
import { BuyInDirectContentItemDialog } from './BuyInDirectContentItemDialog';

type BuyInDirectContentProps = {
  index: number;
  mode: AutomationContentModeEnum;
  apiClient: AutomationBuilderApiClient;
};

type BuyInDirectPick = { productId: string; _xid: string };

/** Instagram's carousel cap, matching `ProductContentComp`'s own limit of 10. */
const MAX_PRODUCTS = 10;
/** Seeds the id→product map used to paint the tiles; the dialog pages separately. */
const CATALOG_PAGE_SIZE = 100;

/**
 * Editor for the BUY_IN_DIRECT content type: the merchant picks which commerce products
 * the Instagram-DM shopping flow shows, in the order they should appear. Follows the same
 * `{ mode, index, apiClient }` + `useFieldArray` convention every other content-type editor
 * in this folder uses — NOT a controlled `value`/`onChange` leaf — so it reads and writes
 * `contents.<index>.buyInDirectProducts` (or `reminders.<index>...`) directly against the
 * shared `react-hook-form` instance `AutomationBuilder` owns.
 *
 * The layout is deliberately identical to the فروش content type (`ProductContentComp`):
 * a square-tile grid, a modal picker behind an «انتخاب» tile, hover-to-change, drag to
 * reorder, and the same cap of ten.
 *
 * ONE deliberate implementation difference from `ProductContentComp`. That component keeps
 * a real empty `{}` row in the field array as its add-target and relies on the
 * `products` → `productIds` remap to drop it before submit. This content type has no such
 * remap — form state IS the backend DTO (`{ productId: string }[]`, Task 5), so an empty
 * placeholder row would be POSTed verbatim and rejected. The add tile is therefore a
 * virtual grid cell that is not a field-array entry, and no row exists until a real product
 * is chosen. Same design, no phantom rows.
 *
 * Data shape note: the tiles need `title`/`coverMediaUrl`, which form state does not carry.
 * They are resolved through `productById`, seeded from one catalog fetch and then augmented
 * by whatever the dialog returns — so a product picked from beyond the first
 * `CATALOG_PAGE_SIZE` still paints correctly.
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
  const { fields, append, remove, move, update } = useFieldArray({
    control,
    name: fieldPath as never,
    keyName: '_xid',
  });
  const pickedFields = fields as unknown as BuyInDirectPick[];

  const [catalog, setCatalog] = useState<CommerceProductNamespace.Item[]>([]);
  // Products the dialog handed back that the seed fetch did not include. Kept separate so a
  // later catalog refresh cannot drop a tile's image out from under it.
  const [extraProducts, setExtraProducts] = useState<CommerceProductNamespace.Item[]>([]);
  // Starts `true` (not gating the picker) until the check resolves, then only flips to
  // `false` on a confirmed "no card-to-card" response — a slow/failed check must never
  // block product selection, only inform it. Mirrors `00b3f887`/`b78f6ab4`'s
  // `!!cardToCardData` gate on `ProductListPage.tsx`.
  const [hasCardToCard, setHasCardToCard] = useState(true);

  // `editingIndex === null` means the dialog is adding a new tile; a number means it is
  // replacing that tile. One dialog for the whole grid rather than one per tile.
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // `page` is REQUIRED by `ReadCommerceProductsDto` — it has no `@IsOptional()` and no
    // default, so omitting it 400s with "page must be a number conforming to the specified
    // constraints" and the `.catch` below silently leaves the picker empty. Every other
    // caller of this route sends it (see `ProductListPage.tsx`).
    apiClient
      .get(`/commerce/products?page=1&limit=${CATALOG_PAGE_SIZE}&status=active`)
      .then((res) => {
        if (cancelled) return;
        setCatalog((res.data?.items ?? []) as CommerceProductNamespace.Item[]);
      })
      .catch(() => {
        // Keep the grid unresolved on failure -- mirrors ProductContentItemDialog's swallow.
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

  const productById = useMemo(
    () => new Map([...catalog, ...extraProducts].map((p) => [p.id, p])),
    [catalog, extraProducts],
  );
  const pickedIds = useMemo(() => new Set(pickedFields.map((f) => f.productId)), [pickedFields]);

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

  const openPicker = (index: number | null) => {
    setEditingIndex(index);
    setIsPickerOpen(true);
  };

  const handleSelect = useCallback(
    (product: CommerceProductNamespace.Item) => {
      setExtraProducts((prev) =>
        prev.some((p) => p.id === product.id) ? prev : [...prev, product],
      );
      if (editingIndex === null) {
        append({ productId: product.id } as never);
      } else {
        update(editingIndex, { productId: product.id } as never);
      }
    },
    [append, update, editingIndex],
  );

  const fieldError = (errors as Record<string, any>)?.[arrayName]?.[contentIndex]
    ?.buyInDirectProducts;

  // When replacing a tile, that tile's own product must stay selectable-looking rather than
  // greyed out as "already picked" — it is the one being replaced.
  const pickedIdsForDialog = useMemo(() => {
    if (editingIndex === null) return pickedIds;
    const next = new Set(pickedIds);
    next.delete(pickedFields[editingIndex]?.productId);
    return next;
  }, [pickedIds, pickedFields, editingIndex]);

  return (
    <div className="flex flex-col space-y-3">
      {!hasCardToCard && (
        <div className="border-wline bg-wtint text-wtext rounded-lg border p-3 text-sm">
          <p className="font-bold">{tNoCard('title')}</p>
          <p className="text-muted-foreground mt-1">{tNoCard('description')}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 md:grid-cols-2 lg:grid-cols-3">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={pickedFields.map((f) => f._xid)} strategy={rectSortingStrategy}>
            {pickedFields.map((field, index) => (
              <BuyInDirectContentItem
                key={field._xid}
                id={field._xid}
                productId={field.productId}
                product={productById.get(field.productId)}
                showDragHandle={pickedFields.length > 1}
                onRemove={() => remove(index)}
                onChange={() => openPicker(index)}
                t={t}
              />
            ))}
          </SortableContext>
        </DndContext>

        {pickedFields.length < MAX_PRODUCTS && (
          <div className="relative aspect-square" data-testid="add-product-tile">
            <Button
              className="flex aspect-square h-full w-full items-center justify-center bg-gray-200 p-0 hover:bg-gray-300/90 hover:no-underline"
              type="button"
              variant="link"
              onClick={() => openPicker(null)}
            >
              {t('select')}
            </Button>
          </div>
        )}
      </div>

      {pickedFields.length === MAX_PRODUCTS && <ErrorMessage>{t('limit')}</ErrorMessage>}

      {fieldError && <ErrorMessage>{t('selection_required')}</ErrorMessage>}

      <BuyInDirectContentItemDialog
        isOpen={isPickerOpen}
        onOpenChange={setIsPickerOpen}
        pickedIds={pickedIdsForDialog}
        onSelect={handleSelect}
        apiClient={apiClient}
      />
    </div>
  );
};
