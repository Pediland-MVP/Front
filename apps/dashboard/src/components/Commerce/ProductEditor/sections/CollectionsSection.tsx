'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { mutate } from 'swr';
import useSWRImmutable from 'swr/immutable';

import api from '@/hooks/swr/api-client';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import { toggleProductInCollectionMembership } from '@/utils/commerce/toggleProductInCollection';
import type { CommerceCollectionListItem, PaginatedResult } from '@/types/commerce';

import { Badge, Card, CardContent, CardHeader, CardTitle, FormField } from '@/components/ui';
import { LoaderSpin } from '@/components/ui-custom/LoaderSpin';

import type { ProductFormValues } from '../productForm.schema';

interface CollectionsSectionProps {
  mode: 'create' | 'edit';
  productId?: string;
}

// `GET /commerce/collections` returns a synthetic single page (`PaginatedResult`, per project
// convention for array responses — see CLAUDE.md §9) — there is no product-scoped "add to
// collection" endpoint, only `PUT /commerce/collections/:id`, which replaces the collection's
// ENTIRE `productIds[]`. Every chip toggle here is a read-modify-write against this same
// cached list: read the collection's current `productIds` from the cache, compute the new
// full array via `toggleProductInCollectionMembership`, PUT it back, then revalidate this
// exact key so every chip's active state reflects the authoritative result.
const collectionsKey = '/commerce/collections';

/**
 * Create mode. There is no product id yet, so membership cannot be written through
 * `PUT /commerce/collections/:id`. Instead the picked ids go into the form's `collectionIds`
 * and ride along in `POST /commerce/products`, which writes the membership rows inside the
 * same transaction as the product — so a product is never briefly visible outside the
 * collections the user chose, and a failed create leaves no membership behind.
 */
const PendingCollectionsPicker = ({
  collections,
  isLoading,
  hasError,
}: {
  collections: CommerceCollectionListItem[];
  isLoading: boolean;
  hasError: boolean;
}) => {
  const t = useTranslations('Commerce.Editor.Collections');
  const { can } = usePermissions();
  const { control } = useFormContext<ProductFormValues>();

  return (
    <FormField
      control={control}
      name="collectionIds"
      render={({ field }) => (
        <Card>
          <CardHeader>
            <CardTitle>{t('title')}</CardTitle>
            <p className="text-muted-foreground text-sm">{t('description')}</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoaderSpin />
            ) : hasError ? (
              <p className="text-destructive text-sm">{t('loadError')}</p>
            ) : collections.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t('empty')}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {collections.map((collection) => {
                  const isMember = field.value.includes(collection.id);
                  return (
                    <button
                      key={collection.id}
                      type="button"
                      disabled={!can('product:create')}
                      data-testid={`collection-chip-${collection.id}`}
                      aria-pressed={isMember}
                      onClick={() =>
                        field.onChange(
                          isMember
                            ? field.value.filter((id) => id !== collection.id)
                            : [...field.value, collection.id],
                        )
                      }
                    >
                      <Badge variant={isMember ? 'default' : 'secondary'}>{collection.name}</Badge>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    />
  );
};

/**
 * Collections-membership editor only — category assignment is a single `categoryId` field
 * on the product, handled entirely by `BasicInfoSection` (spec correction: this section's
 * title mentions "categories" for historical reasons, its actual scope is collections only).
 */
export const CollectionsSection = ({ mode, productId }: CollectionsSectionProps) => {
  const t = useTranslations('Commerce.Editor.Collections');
  const { can } = usePermissions();
  const canEdit = can('product:edit');
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  // Fetched in BOTH modes: create mode offers the same list, it just records the choice in
  // the form (`PendingCollectionsPicker`) instead of PUTting each collection, because there
  // is no product id to put into a collection's `productIds[]` yet.
  const {
    data: collectionsData,
    error: collectionsError,
    isLoading: isCollectionsLoading,
  } = useSWRImmutable<PaginatedResult<CommerceCollectionListItem[]>>(collectionsKey);

  if (mode !== 'edit' || !productId) {
    return (
      <PendingCollectionsPicker
        collections={collectionsData?.items ?? []}
        isLoading={isCollectionsLoading}
        hasError={!!collectionsError}
      />
    );
  }

  const collections = collectionsData?.items ?? [];

  const setPending = (collectionId: string, isPending: boolean) => {
    setPendingIds((current) => {
      const next = new Set(current);
      if (isPending) next.add(collectionId);
      else next.delete(collectionId);
      return next;
    });
  };

  const handleToggle = async (collection: CommerceCollectionListItem) => {
    // Defense-in-depth: the backend already enforces `product:edit` on
    // `PUT /commerce/collections/:id`, but the request must never even fire when the viewer
    // lacks the permission — every chip is also disabled for the same case below.
    if (!canEdit) return;

    const wasMember = collection.productIds.includes(productId);
    const productIds = toggleProductInCollectionMembership(collection, productId);

    setPending(collection.id, true);
    try {
      // Full-replace semantics: always PUT the complete desired `productIds[]`, never a delta
      // and never just this product's id alone — the backend has no product-scoped
      // "add/remove" endpoint (see the `collectionsKey` comment above).
      await api.put(`/commerce/collections/${collection.id}`, { productIds });
      toast.success(wasMember ? t('removeSuccess') : t('addSuccess'));
    } catch {
      // Only the PUT failing is a real save error — a hiccup in the revalidating `mutate`
      // below must not be misreported as this failing (matches
      // `AdjustStockDialog#handleSubmit`/`VariantMediaPickerDialog#handleSave`'s convention).
      toast.error(wasMember ? t('removeError') : t('addError'));
    } finally {
      // Caught here (not left to the nested `finally` alone) so a revalidation-fetch hiccup
      // can never (a) get misreported as the PUT itself failing — the toast above already
      // fired independently of this — or (b) strand this chip in a permanent pending state.
      // Both are the exact two bugs this pattern exists to avoid.
      try {
        await mutate(collectionsKey);
      } catch {
        // intentionally silent — see comment above
      } finally {
        setPending(collection.id, false);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <p className="text-muted-foreground text-sm">{t('description')}</p>
      </CardHeader>
      <CardContent>
        {isCollectionsLoading ? (
          <LoaderSpin />
        ) : collectionsError ? (
          <p className="text-destructive text-sm">{t('loadError')}</p>
        ) : collections.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('empty')}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {collections.map((collection) => {
              const isMember = collection.productIds.includes(productId);
              const isPending = pendingIds.has(collection.id);
              return (
                <button
                  key={collection.id}
                  type="button"
                  disabled={isPending || !canEdit}
                  data-testid={`collection-chip-${collection.id}`}
                  aria-pressed={isMember}
                  onClick={() => handleToggle(collection)}
                  className={cn(isPending && 'pointer-events-none opacity-60')}
                >
                  <Badge variant={isMember ? 'default' : 'secondary'}>{collection.name}</Badge>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
