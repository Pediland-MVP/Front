// packages/ui/src/automation-builder/Contents/BuyInDirectContentItemDialog.tsx
'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageIcon } from '@phosphor-icons/react/dist/ssr/Image';
import type { AxiosResponse } from 'axios';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';

import type { AutomationBuilderApiClient } from '../types/apiClient';
import type { CommerceProductNamespace } from '../types/commerceProduct';

const PAGE_SIZE = 50;
/** Keystrokes settle before a request goes out; `search` is server-side, not a local filter. */
const SEARCH_DEBOUNCE_MS = 300;

export type BuyInDirectContentItemDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** Ids already picked elsewhere in this content — shown greyed out and not selectable. */
  pickedIds: Set<string>;
  onSelect: (product: CommerceProductNamespace.Item) => void;
  apiClient: AutomationBuilderApiClient;
};

/**
 * Commerce-product picker for the BUY_IN_DIRECT tile grid. Deliberately the same dialog
 * shape as `ProductContentItemDialog` (the فروش picker) — 3-column grid of `h-56` image
 * cards with a title/price overlay, infinite scroll, one close button — so the two content
 * types read as one design.
 *
 * Three differences, all forced by the data rather than chosen:
 *  - it reads `/commerce/products` (the new catalog) instead of the legacy `/products`;
 *  - it adds a search field, because a commerce catalog is not bounded the way the legacy
 *    product list is, and `ReadCommerceProductsDto` already accepts `search` server-side;
 *  - `coverMediaUrl` is nullable here, so every image is guarded — `next/image` throws on a
 *    null `src`, where the legacy picker could assume `images[0].url` exists.
 */
export const BuyInDirectContentItemDialog = ({
  isOpen,
  onOpenChange,
  pickedIds,
  onSelect,
  apiClient,
}: BuyInDirectContentItemDialogProps) => {
  const t = useTranslations('Automations.Contents.BuyInDirect.Dialog');

  const [products, setProducts] = useState<CommerceProductNamespace.Item[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const fetchProducts = useCallback(
    async (pageNumber: number, query: string, replace: boolean) => {
      // `page` is REQUIRED by `ReadCommerceProductsDto` — see the 2026-09-03 addendum in
      // `knowledge/updates/2026-08-31-buyInDirectAutomationContent.update.md`. Omitting it
      // 400s, and this `.catch` would swallow that into an empty-looking catalog.
      const params = new URLSearchParams({
        page: String(pageNumber),
        limit: String(PAGE_SIZE),
        status: 'active',
      });
      if (query) params.set('search', query);

      await apiClient
        .get(`/commerce/products?${params.toString()}`)
        .then((res: AxiosResponse<CommerceProductNamespace.GET>) => {
          const items = res.data?.items ?? [];
          setProducts((prev) => (replace ? items : [...prev, ...items]));
          // Trust the item count, not `meta.totalPages`: a short page is the only reliable
          // "that was the last one" signal across both envelope shapes.
          setHasMore(items.length === PAGE_SIZE);
          setPage(pageNumber + 1);
        })
        .catch(() => {
          // Stop paging rather than looping on a failing request. The grid shows whatever
          // arrived; the `empty` message covers the nothing-arrived case.
          setHasMore(false);
        })
        .finally(() => {
          setHasLoadedOnce(true);
        });
    },
    [apiClient],
  );

  // Debounce the search box. Runs while closed too, which is harmless — the fetch effect
  // below is what gates on `isOpen`.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [search]);

  // One effect owns every fetch: opening the dialog and changing the query are the same
  // event as far as the list is concerned — reset to page 1 and replace, never append.
  useEffect(() => {
    if (!isOpen) return;
    setProducts([]);
    setHasMore(true);
    setHasLoadedOnce(false);
    void fetchProducts(1, debouncedSearch, true);
  }, [isOpen, debouncedSearch, fetchProducts]);

  // A stale query must not survive into the next open.
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setDebouncedSearch('');
    }
  }, [isOpen]);

  const priceLabel = (product: CommerceProductNamespace.Item) => {
    if (product.minPrice === null) return null;
    const min = product.minPrice.toLocaleString('en-US');
    // A variant product spans a range; showing only the floor would understate it, so say
    // "from". `en-US` keeps the digits ASCII, matching the dashboard's `formatNumber`.
    return product.maxPrice !== null && product.maxPrice !== product.minPrice
      ? t('price_from', { price: min })
      : t('price', { price: min });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[50rem]">
        <DialogHeader>
          <DialogTitle>{t('select_product')}</DialogTitle>
          <DialogDescription>{t('select_product_description')}</DialogDescription>
        </DialogHeader>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('search_placeholder')}
          aria-label={t('search_placeholder')}
          className="border-wline w-full rounded-md border px-3 py-1.5 text-sm"
        />

        <InfiniteScroll
          dataLength={products.length}
          next={() => fetchProducts(page, debouncedSearch, false)}
          hasMore={hasMore}
          loader={<></>}
          endMessage={
            hasLoadedOnce && products.length > 0 ? (
              <p className="text-muted-foreground mt-4 text-center text-sm">{t('no_more')}</p>
            ) : (
              <></>
            )
          }
          scrollableTarget="buyInDirectScrollableDiv"
        >
          <div
            className="grid w-full grid-cols-3 gap-4"
            id="buyInDirectScrollableDiv"
            style={{ maxHeight: '60vh', overflowY: 'auto' }}
          >
            {!hasLoadedOnce ? (
              Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="col-span-1">
                  <Skeleton className="relative h-56 w-full" />
                </div>
              ))
            ) : products.length === 0 ? (
              <p className="text-muted-foreground col-span-3 py-8 text-center text-sm">
                {t('empty')}
              </p>
            ) : (
              products.map((product) => {
                const isPicked = pickedIds.has(product.id);
                return (
                  <button
                    type="button"
                    key={product.id}
                    disabled={isPicked}
                    aria-label={product.title}
                    onClick={() => {
                      onSelect(product);
                      onOpenChange(false);
                    }}
                    className="relative col-span-1 h-56 w-full overflow-hidden rounded-sm bg-black disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {product.coverMediaUrl ? (
                      <Image
                        src={product.coverMediaUrl}
                        alt={product.title}
                        width={300}
                        height={0}
                        className="h-full w-full object-cover duration-150 hover:opacity-80"
                      />
                    ) : (
                      <ImageIcon
                        className="absolute inset-0 m-auto text-gray-600"
                        size={40}
                        aria-hidden
                      />
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-black/50 px-2 py-1 text-start">
                      <div className="truncate text-sm font-bold text-white">{product.title}</div>
                      {priceLabel(product) && (
                        <div className="text-sm text-white">{priceLabel(product)}</div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </InfiniteScroll>

        <DialogFooter className="flex items-center justify-center gap-x-2">
          <Button type="button" onClick={() => onOpenChange(false)}>
            {t('close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
