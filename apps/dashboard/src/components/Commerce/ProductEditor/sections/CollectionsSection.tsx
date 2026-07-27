'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';
import { mutate } from 'swr';
import useSWRImmutable from 'swr/immutable';
import { CheckIcon } from 'lucide-react';

import api from '@/hooks/swr/api-client';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import { toggleProductInCollectionMembership } from '@/utils/commerce/toggleProductInCollection';
import type { CommerceCollectionListItem, PaginatedResult } from '@/types/commerce';
import type { ExceptionMessage } from '@/types/exceptionMessage';

import { FormField } from '@/components/ui';
import { LoaderSpin } from '@/components/ui-custom/LoaderSpin';

import { EditorRailCard } from '../ui/EditorSection';
import { editorAddButtonSm, editorInputSm } from '../ui/editorChrome';
import type { ProductFormValues } from '../productForm.schema';

interface CollectionsSectionProps {
  mode: 'create' | 'edit';
  productId?: string;
}

// `GET /commerce/collections` returns a synthetic single page (`PaginatedResult`, per project
// convention for array responses — see CLAUDE.md §9) — there is no product-scoped "add to
// collection" endpoint, only `PUT /commerce/collections/:id`, which replaces the collection's
// ENTIRE `productIds[]`. Every row toggle here is a read-modify-write against this same
// cached list: read the collection's current `productIds` from the cache, compute the new
// full array via `toggleProductInCollectionMembership`, PUT it back, then revalidate this
// exact key so every row's checked state reflects the authoritative result.
const collectionsKey = '/commerce/collections';

/** Matches the backend's `@Length(1, 100)` on the collection name. */
const NAME_LIMIT = 100;

const matches = (collection: CommerceCollectionListItem, query: string) =>
  collection.name.toLowerCase().includes(query.trim().toLowerCase());

/**
 * One selectable collection row: a drawn checkbox, the name, and the live product count.
 *
 * The box is a `<span>` inside the button rather than a real `<input type=checkbox>` because the
 * whole row is the hit target; `aria-pressed` on the button is what actually carries the state
 * to assistive tech.
 */
const CollectionRow = ({
  name,
  count,
  checked,
  disabled,
  testId,
  onToggle,
}: {
  name: string;
  count: number;
  checked: boolean;
  disabled: boolean;
  testId: string;
  onToggle: () => void;
}) => (
  <button
    type="button"
    disabled={disabled}
    aria-pressed={checked}
    data-testid={testId}
    onClick={onToggle}
    className={cn(
      'hover:bg-tint flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-start text-xs transition-colors',
      disabled && 'pointer-events-none opacity-60',
    )}
  >
    <span
      aria-hidden="true"
      className={cn(
        'border-lnv grid size-4 flex-none place-items-center rounded-[4px] border transition-colors',
        checked ? 'bg-primary border-primary text-white' : 'bg-card text-transparent',
      )}
    >
      <CheckIcon className="size-2.5" strokeWidth={3} />
    </span>
    <span className="min-w-0 flex-1 truncate font-semibold">{name}</span>
    <span className="text-mut flex-none">{count}</span>
  </button>
);

/**
 * Shared search box + scrolling list + inline create, used by both modes. The two modes differ
 * only in what "toggle" means — form state vs an API call — so that is the single injected prop.
 */
const CollectionsPanel = ({
  collections,
  isLoading,
  hasError,
  isMember,
  onToggle,
  canEdit,
  pendingIds,
}: {
  collections: CommerceCollectionListItem[];
  isLoading: boolean;
  hasError: boolean;
  isMember: (collection: CommerceCollectionListItem) => boolean;
  onToggle: (collection: CommerceCollectionListItem) => void;
  canEdit: boolean;
  pendingIds?: ReadonlySet<string>;
}) => {
  const t = useTranslations('Commerce.Editor.Collections');
  const t_ec = useTranslations('ERROR_CODES');
  const { can } = usePermissions();
  // Creating a collection is `product:edit`, which is NOT the same permission as the
  // `product:create` that lets someone add a product — so the create row is hidden rather than
  // left to 403 after the user has typed a name.
  const canCreate = can('product:edit');

  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const visible = query.trim() ? collections.filter((c) => matches(c, query)) : collections;
  const selectedCount = collections.filter(isMember).length;

  const create = async () => {
    const name = draft.trim();
    if (!name) return;
    setIsCreating(true);
    try {
      await api.post(collectionsKey, { name });
      await mutate(collectionsKey);
      setDraft('');
      toast.success(t('createSuccess'));
    } catch (error) {
      const code = isAxiosError(error)
        ? (error.response?.data as ExceptionMessage | undefined)?.code
        : undefined;
      toast.error(code ? t_ec(code) : t('createError'));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <EditorRailCard
      title={t('title')}
      count={selectedCount || undefined}
      footer={
        canCreate && (
          <div className="flex gap-1.5">
            <input
              value={draft}
              maxLength={NAME_LIMIT}
              data-testid="collection-create-input"
              aria-label={t('newCollection')}
              placeholder={t('newCollectionPlaceholder')}
              onChange={(e) => setDraft(e.target.value)}
              // Enter creates without submitting the surrounding product form.
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return;
                e.preventDefault();
                void create();
              }}
              className={editorInputSm}
            />
            <button
              type="button"
              disabled={isCreating}
              data-testid="collection-create-add"
              onClick={() => void create()}
              className={editorAddButtonSm}
            >
              {t('add')}
            </button>
          </div>
        )
      }
    >
      {isLoading ? (
        <LoaderSpin />
      ) : hasError ? (
        <p className="text-destructive text-xs">{t('loadError')}</p>
      ) : collections.length === 0 ? (
        <p className="text-mut text-xs">{t('empty')}</p>
      ) : (
        <>
          <input
            value={query}
            data-testid="collection-search"
            aria-label={t('search')}
            placeholder={t('searchPlaceholder')}
            onChange={(e) => setQuery(e.target.value)}
            className={editorInputSm}
          />
          <div
            role="group"
            aria-label={t('title')}
            className="-mx-1 flex max-h-[246px] flex-col gap-0.5 overflow-y-auto px-1"
          >
            {visible.map((collection) => (
              <CollectionRow
                key={collection.id}
                name={collection.name}
                count={collection.productCount}
                checked={isMember(collection)}
                disabled={!canEdit || (pendingIds?.has(collection.id) ?? false)}
                testId={`collection-chip-${collection.id}`}
                onToggle={() => onToggle(collection)}
              />
            ))}
          </div>
          {visible.length === 0 && <p className="text-mut px-1 text-xs">{t('noSearchMatch')}</p>}
        </>
      )}
    </EditorRailCard>
  );
};

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
  const { can } = usePermissions();
  const { control } = useFormContext<ProductFormValues>();

  return (
    <FormField
      control={control}
      name="collectionIds"
      render={({ field }) => (
        <CollectionsPanel
          collections={collections}
          isLoading={isLoading}
          hasError={hasError}
          canEdit={can('product:create')}
          isMember={(collection) => field.value.includes(collection.id)}
          onToggle={(collection) =>
            field.onChange(
              field.value.includes(collection.id)
                ? field.value.filter((id) => id !== collection.id)
                : [...field.value, collection.id],
            )
          }
        />
      )}
    />
  );
};

/**
 * Collections-membership editor only — category assignment is a single `categoryId` field
 * on the product, handled entirely by `CategorySection`.
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
    // lacks the permission — every row is also disabled for the same case below.
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
      // fired independently of this — or (b) strand this row in a permanent pending state.
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
    <CollectionsPanel
      collections={collectionsData?.items ?? []}
      isLoading={isCollectionsLoading}
      hasError={!!collectionsError}
      canEdit={canEdit}
      pendingIds={pendingIds}
      isMember={(collection) => collection.productIds.includes(productId)}
      onToggle={(collection) => void handleToggle(collection)}
    />
  );
};
