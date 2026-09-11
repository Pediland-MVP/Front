'use client';

import useSWR from 'swr';

import type { PaginatedResult } from '@/types/commerce';
import type { OrderListView, OrdersFilters } from '@/types/commerceOrders';

/**
 * `GET /commerce/orders` returns the project's `PaginatedResult` envelope directly (CLAUDE.md §9),
 * NOT a `ResponseMessage` -- so the payload is `{ items, meta }`, not `{ data }`.
 *
 * Built as a plain string rather than `URLSearchParams` because the string IS the SWR cache key:
 * a stable, readable key makes `mutate(key)` from elsewhere predictable.
 */
export function ordersListKey(filters: OrdersFilters): string {
  const parts = [`page=${filters.page}`, `limit=${filters.limit}`];
  if (filters.status) parts.push(`status=${filters.status}`);
  if (filters.search) parts.push(`search=${encodeURIComponent(filters.search)}`);
  if (filters.from) parts.push(`from=${filters.from}`);
  if (filters.to) parts.push(`to=${filters.to}`);
  return `/commerce/orders?${parts.join('&')}`;
}

/**
 * The matching half of `ordersListKey`, kept beside it so the two can never drift: a key builder
 * whose output some other module's hand-written predicate no longer matches is a silent bug, not a
 * loud one.
 *
 * `useCommerceOrder.run()` uses this after every write to invalidate the list (spec §11). It has
 * to be a PREDICATE rather than a literal key, because the list key encodes the seller's whole
 * filter set and SWR's cache legitimately holds several of them at once.
 *
 * The `?` is load-bearing: `orderDetailKey` produces `/commerce/orders/<id>`, which shares the
 * `/commerce/orders` prefix but must NOT be swept up here.
 */
export function isOrdersListKey(key: unknown): boolean {
  return typeof key === 'string' && key.startsWith('/commerce/orders?');
}

/**
 * Plain `useSWR`, not `useSWRImmutable` (which `ProductListPage` uses): orders change under the
 * seller constantly -- the buyer's DM can promote a cart, and another seat can approve one -- so
 * this list must revalidate on focus and reconnect.
 */
export function useCommerceOrders(filters: OrdersFilters) {
  const key = ordersListKey(filters);
  const { data, error, isLoading, mutate } = useSWR<PaginatedResult<OrderListView[]>>(key);

  return {
    orders: data?.items ?? [],
    meta: data?.meta,
    isLoading,
    error,
    mutate,
    key,
  };
}
