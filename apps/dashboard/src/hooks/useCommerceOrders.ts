'use client';

import useSWR from 'swr';

import type { PaginatedResult } from '@/types/commerce';
import type { OrderView, OrdersFilters } from '@/types/commerceOrders';

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
 * Plain `useSWR`, not `useSWRImmutable` (which `ProductListPage` uses): orders change under the
 * seller constantly -- the buyer's DM can promote a cart, and another seat can approve one -- so
 * this list must revalidate on focus and reconnect.
 */
export function useCommerceOrders(filters: OrdersFilters) {
  const key = ordersListKey(filters);
  const { data, error, isLoading, mutate } = useSWR<PaginatedResult<OrderView[]>>(key);

  return {
    orders: data?.items ?? [],
    meta: data?.meta,
    isLoading,
    error,
    mutate,
    key,
  };
}
