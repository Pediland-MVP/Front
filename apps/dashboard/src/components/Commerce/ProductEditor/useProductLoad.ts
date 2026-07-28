'use client';

import useSWRImmutable from 'swr/immutable';

import type {
  CommerceCategory,
  CommerceCollectionListItem,
  CommerceProductDetail,
  PaginatedResult,
} from '@/types/commerce';
import type { IResponseMessage } from '@/types/responseMessage';

/**
 * The editor's four reads. Every key is exported, because more than one component revalidates
 * each of them — the category dialog creates a category, the rail creates a collection, the save
 * hook re-reads the detail — and they must all hit the SAME SWR cache entry.
 *
 * No `fetcher` argument anywhere: `SWRProvider` installs the axios fetcher globally
 * (`hooks/swr/api-client.tsx`), so passing one here would be a second, divergent copy.
 */
export const CATEGORIES_KEY = '/commerce/categories';
export const COLLECTIONS_KEY = '/commerce/collections';
export const TAGS_KEY = '/commerce/tags';
export const productDetailKey = (productId: string): string => `/commerce/products/${productId}`;

export interface ProductLoadResult {
  /** `undefined` in create mode — there is nothing to load. */
  product: CommerceProductDetail | undefined;
  categories: CommerceCategory[];
  collections: CommerceCollectionListItem[];
  /**
   * Whether the collections request has SETTLED — answered or failed — as opposed to
   * `collections.length > 0`.
   *
   * The two are not the same thing and the difference is a real bug: a workspace with no
   * collections yet never makes the list non-empty, so a consumer arming on length alone stays
   * armed for the whole session and fires again the moment the merchant creates their first
   * collection — overwriting the selection they just made with the server's (still empty) idea
   * of membership.
   */
  collectionsLoaded: boolean;
  /** Existing tag NAMES across the workspace, for the rail's suggestions. */
  tagPool: string[];
  /** Only the product blocks the form. The pickers fill in when they arrive. */
  isLoading: boolean;
  loadError: unknown;
}

export const useProductLoad = (mode: 'create' | 'edit', productId?: string): ProductLoadResult => {
  // `null` disables the fetch entirely — create mode must not request a product that has no id.
  const detailKey = mode === 'edit' && productId ? productDetailKey(productId) : null;

  const detail = useSWRImmutable<IResponseMessage<CommerceProductDetail>>(detailKey);
  const categories = useSWRImmutable<PaginatedResult<CommerceCategory[]>>(CATEGORIES_KEY);
  const collections =
    useSWRImmutable<PaginatedResult<CommerceCollectionListItem[]>>(COLLECTIONS_KEY);
  // `GET /commerce/tags` answers with the project's list envelope (CLAUDE.md §9) even though the
  // items are bare strings.
  const tags = useSWRImmutable<PaginatedResult<string[]>>(TAGS_KEY);

  return {
    product: detail.data?.data,
    categories: categories.data?.items ?? [],
    collections: collections.data?.items ?? [],
    // A failed read counts as settled: the seed must not wait forever on a request that will
    // never answer, or membership would stay unseeded and Save would diff against nothing.
    collectionsLoaded: collections.data !== undefined || collections.error !== undefined,
    tagPool: tags.data?.items ?? [],
    // Deliberately NOT `||`-ing the four: a slow categories request must not hold the whole form
    // behind a spinner, and a failed one must not read as "this product does not exist".
    isLoading: !!detailKey && detail.isLoading,
    loadError: detail.error,
  };
};
