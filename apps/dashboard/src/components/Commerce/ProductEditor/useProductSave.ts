'use client';

import { useCallback, useState } from 'react';
import { isAxiosError } from 'axios';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { mutate } from 'swr';
import useSWRImmutable from 'swr/immutable';

import api from '@/hooks/swr/api-client';
import { mutateIncludeStringKey } from '@/utils/mutateIncludeStringKey';
import type {
  CommerceCollectionListItem,
  CommerceProductDetail,
  CommerceProductMedia,
  CommerceVariantDetail,
  PaginatedResult,
} from '@/types/commerce';
import type { ExceptionMessage } from '@/types/exceptionMessage';
import type { IResponseMessage } from '@/types/responseMessage';

import { buildCreatePayload, buildUpdatePayload } from './productEditor.mapping';
import type { EditorMedia, ProductFormValues } from './productEditor.schema';
import { COLLECTIONS_KEY, productDetailKey } from './useProductLoad';

/**
 * Saving a product is not one request. It is a fixed sequence, and the order is forced by the
 * schema rather than chosen:
 *
 *   1. the product     — `commerce_product_media.productId` is NOT NULL, so nothing can be
 *                        uploaded before the product row exists;
 *   2. the media files — sequential, because `position` is assigned server-side in ARRIVAL
 *                        order and position 0 is the cover. Parallel posts would make which
 *                        image is the cover depend on network timing;
 *   3. a fresh detail  — the only place the ids of variants created by step 1 exist;
 *   4. variant media   — needs a variant id from step 3 and a media id from step 2;
 *   5. collections     — membership is owned by the COLLECTION side
 *                        (`PUT /commerce/collections/:id` replaces its whole `productIds[]`),
 *                        so it can only be written once the product has an id. Create skips
 *                        this: `collectionIds` rides inside `POST /commerce/products` and is
 *                        written in the same transaction.
 *
 * Only step 1 can fail the save. Everything after it happens against a product that is already
 * committed, so a failure there is reported as a partial success and can be retried in place.
 */

type SaveMode = 'create' | 'edit';

interface UseProductSaveOptions {
  /**
   * Called after an EDIT save with the freshly read detail. The page uses it to
   * `form.reset(...)`: until it does, the form still holds the local keys minted this session
   * for options and values created just now, and a second Save would ask the backend to create
   * all of them again.
   *
   * A callback rather than the hook owning the form, so the hook stays renderable on its own.
   */
  onSaved?: (detail: CommerceProductDetail) => void;
}

export interface UseProductSaveResult {
  save: (values: ProductFormValues) => Promise<void>;
  isSaving: boolean;
}

/** Order-sensitive: `mediaIds[0]` is the variant's cover, so a reorder is a real change. */
const sameIds = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((id, index) => id === b[index]);

/** Identity of a combination, order-INsensitive: the API returns the join in whatever order. */
const selectionKey = (valueIds: readonly string[]): string => [...valueIds].sort().join('|');

/**
 * Pairs the form's variant rows with the variants the server now has.
 *
 * Ids cannot be used directly. A row created this session has no id at all until the save that
 * just ran minted one, and on CREATE even its option-value ids are local keys — the server has
 * never seen them. So:
 *
 * - first, match on the SET of option-value ids. This is exact and survives reordering, and it
 *   is what carries an EDIT where only some rows are new;
 * - then fall back to array position for whatever is left, which is the normal path on CREATE
 *   (the backend inserts variants in payload order, and the payload is built in form order).
 *
 * The fallback runs ONLY when the leftovers line up one-to-one. If they do not — the payload
 * builder drops a row whose selection no longer resolves — nothing is guessed, because assigning
 * one variant's images to another is worse than assigning none.
 */
export const pairVariantRows = (
  rows: ProductFormValues['variants'],
  saved: CommerceVariantDetail[],
): Array<{ row: ProductFormValues['variants'][number]; variant: CommerceVariantDetail }> => {
  const ordered = [...saved].sort((a, b) => a.position - b.position);
  const byKey = new Map<string, CommerceVariantDetail>();
  for (const variant of ordered) byKey.set(selectionKey(variant.optionValueIds), variant);

  const used = new Set<string>();
  const pairs: Array<{
    row: ProductFormValues['variants'][number];
    variant: CommerceVariantDetail;
  }> = [];
  const unmatchedRows: ProductFormValues['variants'] = [];

  for (const row of rows) {
    const match = byKey.get(selectionKey(row.valueIds));
    if (match && !used.has(match.id)) {
      used.add(match.id);
      pairs.push({ row, variant: match });
    } else {
      unmatchedRows.push(row);
    }
  }

  const leftover = ordered.filter((variant) => !used.has(variant.id));
  if (unmatchedRows.length === leftover.length) {
    unmatchedRows.forEach((row, index) => pairs.push({ row, variant: leftover[index] }));
  }

  return pairs;
};

/**
 * Uploads the queued files one at a time, in pool order. Returns the LOCAL tile ids that made
 * it, plus the failure count — the caller needs the ids to translate `variants[].mediaIds`, and
 * the count to decide between a success and a warning toast.
 */
const uploadPendingMedia = async (
  productId: string,
  pending: EditorMedia[],
): Promise<{ uploadedLocalIds: string[]; failed: number }> => {
  const uploadedLocalIds: string[] = [];
  let failed = 0;

  for (const tile of pending) {
    if (!tile.file) {
      failed += 1;
      continue;
    }
    const body = new FormData();
    body.append('file', tile.file);
    try {
      await api.post(`/commerce/products/${productId}/media`, body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      uploadedLocalIds.push(tile.id);
    } catch {
      failed += 1;
    }
  }

  return { uploadedLocalIds, failed };
};

/**
 * Local tile id → real media id.
 *
 * The upload endpoint is fire-and-forget from our side, so the link is positional: files went up
 * in pool order and `position` is assigned in arrival order, so the n-th surviving local id is
 * the n-th tile in the saved pool. That reasoning only holds when the counts agree — a create
 * starts from an empty pool, so they normally do. When they do not (an upload failed, or an edit
 * added to a pool that already had tiles) the map stays empty and the unresolvable ids are
 * dropped downstream rather than sent as-is.
 */
const buildMediaIdMap = (
  uploadedLocalIds: string[],
  saved: CommerceProductMedia[],
): Map<string, string> => {
  const map = new Map<string, string>();
  if (!uploadedLocalIds.length) return map;

  const ordered = [...saved].sort((a, b) => a.position - b.position);
  if (uploadedLocalIds.length !== ordered.length) return map;

  uploadedLocalIds.forEach((localId, index) => map.set(localId, ordered[index].id));
  return map;
};

/**
 * Writes each variant's media assignment, but only where it actually changed — including a
 * change to the empty list, which is how "this variant goes back to the product cover" is
 * expressed. Full-replace semantics: the endpoint takes the complete desired set, never a delta.
 */
const saveVariantMedia = async (
  productId: string,
  rows: ProductFormValues['variants'],
  detail: CommerceProductDetail,
  mediaIdMap: Map<string, string>,
): Promise<void> => {
  const realIds = new Set(detail.media.map((item) => item.id));

  for (const { row, variant } of pairVariantRows(rows, detail.variants)) {
    const mediaIds = row.mediaIds
      .map((id) => mediaIdMap.get(id) ?? id)
      // A tile whose upload failed has no server id, so it is dropped instead of 400-ing the PUT.
      .filter((id) => realIds.has(id));

    if (sameIds(mediaIds, variant.media?.selectedMediaIds ?? [])) continue;

    await api.put(`/commerce/products/${productId}/variants/${variant.id}/media`, {
      mediaIds,
      ...(mediaIds[0] ? { coverMediaId: mediaIds[0] } : {}),
    });
  }
};

/**
 * Brings collection membership in line with the form, one PUT per collection that actually
 * changed. There is no product-scoped "add to collection" route: the only write is
 * `PUT /commerce/collections/:id`, which replaces that collection's ENTIRE `productIds[]`, so
 * each change is a read-modify-write against the list this hook already has cached.
 */
const syncCollections = async (
  productId: string,
  desired: readonly string[],
  collections: CommerceCollectionListItem[],
): Promise<void> => {
  const wanted = new Set(desired);

  for (const collection of collections) {
    const isMember = collection.productIds.includes(productId);
    const shouldBeMember = wanted.has(collection.id);
    if (isMember === shouldBeMember) continue;

    const productIds = shouldBeMember
      ? [...collection.productIds, productId]
      : collection.productIds.filter((id) => id !== productId);

    await api.put(`/commerce/collections/${collection.id}`, { productIds });
  }
};

export const useProductSave = (
  mode: SaveMode,
  productId?: string,
  options?: UseProductSaveOptions,
): UseProductSaveResult => {
  const t = useTranslations('Commerce.Editor');
  const t_ec = useTranslations('ERROR_CODES');
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  // Same key the rail reads, so this is the already-fetched cache entry rather than a second
  // request. It is the baseline the membership diff is taken against.
  const { data: collectionsData } =
    useSWRImmutable<PaginatedResult<CommerceCollectionListItem[]>>(COLLECTIONS_KEY);
  const collections = collectionsData?.items ?? [];

  const onSaved = options?.onSaved;

  const save = useCallback(
    async (values: ProductFormValues): Promise<void> => {
      if (mode === 'edit' && !productId) return;

      setIsSaving(true);
      let softFailure: 'media' | 'collections' | null = null;
      let mediaFailedCount = 0;

      try {
        // ---- 1. the product itself. The only step that can fail the save. ----
        let targetId: string;
        if (mode === 'create') {
          const { data } = await api.post<IResponseMessage<{ id: string }>>(
            '/commerce/products',
            buildCreatePayload(values),
          );
          targetId = data.data.id;
        } else {
          targetId = productId as string;
          await api.put(`/commerce/products/${targetId}`, buildUpdatePayload(values));
        }

        // ---- 2. the queued files, one at a time (see the header comment on why). ----
        const pending = values.media.filter((tile) => tile.isPending);
        const { uploadedLocalIds, failed } = pending.length
          ? await uploadPendingMedia(targetId, pending)
          : { uploadedLocalIds: [] as string[], failed: 0 };
        mediaFailedCount = failed;
        if (failed > 0) softFailure = 'media';

        // ---- 3. re-read. Variant ids created by step 1 exist nowhere else. ----
        const { data: detailResponse } = await api.get<IResponseMessage<CommerceProductDetail>>(
          productDetailKey(targetId),
        );
        const detail = detailResponse.data;

        // ---- 4. variant media. ----
        try {
          await saveVariantMedia(
            targetId,
            values.variants,
            detail,
            buildMediaIdMap(uploadedLocalIds, detail.media),
          );
        } catch {
          // Swallowed on purpose. Prices, stock, options and variants are already saved; raising
          // this as "saving failed" would tell the merchant to redo work that is committed. It is
          // an assignment that can be redone from the row's own media button, and the row still
          // shows the product cover meanwhile.
        }

        // ---- 5. collection membership (edit only). ----
        if (mode === 'edit') {
          try {
            await syncCollections(targetId, values.collectionIds, collections);
            await mutate(COLLECTIONS_KEY);
          } catch {
            softFailure = softFailure ?? 'collections';
          }
        }

        if (softFailure === 'media') {
          toast.warning(t('Toast.savedWithMediaErrors', { count: mediaFailedCount }));
        } else if (softFailure === 'collections') {
          toast.warning(t('Toast.collectionsFailed'));
        } else {
          toast.success(mode === 'create' ? t('Toast.created') : t('Toast.updated'));
        }

        // Refresh every cached product list/detail page. Caught, because a revalidation hiccup
        // after a committed write must never be reported as the save failing.
        try {
          await mutate(mutateIncludeStringKey('/commerce/products'));
        } catch {
          // intentionally silent — see above
        }

        if (mode === 'create') {
          router.push(`/products/${targetId}`);
        } else {
          // Reseeds the form from the server so the local keys minted this session become real
          // ids. Without it a second Save re-creates every option and variant.
          onSaved?.(detail);
        }
      } catch (error) {
        const code = isAxiosError(error)
          ? (error.response?.data as ExceptionMessage | undefined)?.code
          : undefined;

        if (code === 'COMMERCE_KIND_LOCKED') {
          // Its own sentence: the generic ERROR_CODES line does not say that the reason is an
          // order already placed against this product, which is the only useful part.
          toast.error(t('Errors.kindLocked'));
        } else if (code) {
          toast.error(t_ec(code));
        } else {
          toast.error(t('Errors.generic'));
        }
      } finally {
        setIsSaving(false);
      }
    },
    [collections, mode, onSaved, productId, router, t, t_ec],
  );

  return { save, isSaving };
};
