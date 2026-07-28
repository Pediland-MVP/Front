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
 * Local tile id → real media id, for tiles uploaded during THIS save.
 *
 * Cannot zip by raw count against the WHOLE saved pool: on CREATE the pool starts empty, so
 * `detail.media.length` happens to equal the upload count and a plain positional zip works — but
 * on EDIT the product can already have any number of photos, so `detail.media` after the refetch
 * mixes pre-existing rows in with the new ones. Zipping by count there either lines up with the
 * wrong rows or (if the counts disagree, which is the common case) produces an empty map, and an
 * empty map silently drops the new photo's variant assignment with no toast — the exact bug this
 * fixes.
 *
 * So the caller passes `preExistingIds`: every media id that was already in the form's pool
 * BEFORE this save's uploads ran (`values.media` tiles with `isPending: false`). Excluding those
 * from `saved` leaves exactly the rows created by this save, and THOSE can be zipped against
 * `uploadedLocalIds` in upload order — safe because uploads are sequential and `position` is
 * assigned server-side in arrival order, so the first upload is unconditionally the first new row.
 *
 * The guard still applies: if the counts disagree even after excluding the pre-existing ids (an
 * upload failed, or a row landed for some other reason), nothing is guessed — same bail-out
 * stance as `pairVariantRows`.
 *
 * The bail-out is REPORTED, not just taken: an empty map makes `saveVariantMedia` filter every
 * new photo's assignment away at `realIds.has(id)`, and doing that under a plain "تغییرات ذخیره
 * شد" tells the merchant an assignment landed when it did not. `incomplete` routes it into the
 * same warning toast a failed upload uses.
 *
 * Exported for the test and for nothing else — same rule as `pairVariantRows`.
 */
export const buildMediaIdMap = (
  uploadedLocalIds: string[],
  saved: CommerceProductMedia[],
  preExistingIds: ReadonlySet<string>,
): { map: Map<string, string>; incomplete: boolean } => {
  const map = new Map<string, string>();
  if (!uploadedLocalIds.length) return { map, incomplete: false };

  const newRows = [...saved]
    .filter((item) => !preExistingIds.has(item.id))
    .sort((a, b) => a.position - b.position);
  if (uploadedLocalIds.length !== newRows.length) return { map, incomplete: true };

  uploadedLocalIds.forEach((localId, index) => map.set(localId, newRows[index].id));
  return { map, incomplete: false };
};

/**
 * Writes each variant's media assignment, but only where it actually changed — including a
 * change to the empty list, which is how "this variant goes back to the product cover" is
 * expressed. Full-replace semantics: the endpoint takes the complete desired set, never a delta.
 *
 * Each PUT is independent, so ONE failure must not abandon the rest: assign a photo to five rows,
 * have the first 500, and aborting there leaves four rows the merchant explicitly set untouched.
 * The loop keeps going and returns how many failed, so the caller can say so out loud instead of
 * showing a success toast over a partial write.
 */
const saveVariantMedia = async (
  productId: string,
  rows: ProductFormValues['variants'],
  detail: CommerceProductDetail,
  mediaIdMap: Map<string, string>,
): Promise<{ failed: number }> => {
  const realIds = new Set(detail.media.map((item) => item.id));
  let failed = 0;

  for (const { row, variant } of pairVariantRows(rows, detail.variants)) {
    const mediaIds = row.mediaIds
      .map((id) => mediaIdMap.get(id) ?? id)
      // A tile whose upload failed has no server id, so it is dropped instead of 400-ing the PUT.
      .filter((id) => realIds.has(id));

    if (sameIds(mediaIds, variant.media?.selectedMediaIds ?? [])) continue;

    try {
      await api.put(`/commerce/products/${productId}/variants/${variant.id}/media`, {
        mediaIds,
        ...(mediaIds[0] ? { coverMediaId: mediaIds[0] } : {}),
      });
    } catch {
      failed += 1;
    }
  }

  return { failed };
};

/**
 * Brings collection membership in line with the form, one PUT per collection that actually
 * changed. There is no product-scoped "add to collection" route: the only write is
 * `PUT /commerce/collections/:id`, which replaces that collection's ENTIRE `productIds[]`, so
 * each change is a read-modify-write.
 *
 * `collections` MUST be a freshly revalidated list, not the editor's cached one — see the call
 * site. The baseline is what every other product's membership is rebuilt from, so a stale one
 * silently evicts products this editor has never heard of.
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
      let softFailure: 'media' | 'variantMedia' | 'collections' | null = null;
      let mediaFailedCount = 0;
      let variantMediaFailedCount = 0;

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
        // Captured BEFORE the uploads run: this is the basis `buildMediaIdMap` uses to tell a
        // pre-existing photo from one created by this save, not a count comparison — see its
        // header comment for why the count is unsafe on edit.
        const preExistingMediaIds = new Set(
          values.media.filter((tile) => !tile.isPending).map((tile) => tile.id),
        );
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
        // Never fails the SAVE — prices, stock, options and variants are already committed, and
        // calling that "saving failed" would tell the merchant to redo work that is done. But it
        // is not silent either: a swallowed failure under a success toast is how somebody
        // navigates away believing five rows got their photo when the first PUT 500'd.
        try {
          const { map, incomplete } = buildMediaIdMap(
            uploadedLocalIds,
            detail.media,
            preExistingMediaIds,
          );
          const { failed: variantMediaFailed } = await saveVariantMedia(
            targetId,
            values.variants,
            detail,
            map,
          );
          // `incomplete` counts as one: the map bailed out, so EVERY new photo's assignment was
          // filtered away — the rows are not individually knowable, but the merchant must be told
          // it did not land.
          variantMediaFailedCount = variantMediaFailed + (incomplete ? 1 : 0);
        } catch {
          // The pairing itself threw (not one PUT). Same stance: report, do not fail the save.
          variantMediaFailedCount = 1;
        }
        if (variantMediaFailedCount > 0) softFailure = softFailure ?? 'variantMedia';

        // ---- 5. collection membership (edit only). ----
        if (mode === 'edit') {
          try {
            /**
             * Revalidate FIRST, and diff against what comes back.
             *
             * The rail reads `useSWRImmutable(COLLECTIONS_KEY)`, which by definition never
             * revalidates on focus, reconnect or staleness — so the cached `productIds[]` is
             * whatever it was when the editor opened. `PUT /commerce/collections/:id` replaces
             * the WHOLE array, so ticking a collection after somebody else added a different
             * product to it would write that other product straight out of the collection.
             */
            const fresh =
              await mutate<PaginatedResult<CommerceCollectionListItem[]>>(COLLECTIONS_KEY);
            await syncCollections(targetId, values.collectionIds, fresh?.items ?? collections);
            await mutate(COLLECTIONS_KEY);
          } catch {
            softFailure = softFailure ?? 'collections';
          }
        }

        if (softFailure === 'media') {
          toast.warning(t('Toast.savedWithMediaErrors', { count: mediaFailedCount }));
        } else if (softFailure === 'variantMedia') {
          toast.warning(t('Toast.savedWithVariantMediaErrors', { count: variantMediaFailedCount }));
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
