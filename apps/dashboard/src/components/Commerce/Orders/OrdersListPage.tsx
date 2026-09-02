'use client';

import dayjs from 'dayjs';
import { XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ItemsPagination } from '@/components/Console/ItemsPagination';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { SearchInput } from '@/components/ui-custom/SearchInput';
import { useCommerceOrders } from '@/hooks/useCommerceOrders';
import type { CommerceOrderStatus, OrdersFilters } from '@/types/commerceOrders';

import { OrderCard } from './OrderCard';

export const DEFAULT_LIMIT = 20;

const STATUSES: readonly CommerceOrderStatus[] = [
  'awaiting_review',
  'processing',
  'sending',
  'completed',
  'cancelled',
];

const isStatus = (v: string | null): v is CommerceOrderStatus =>
  v !== null && (STATUSES as readonly string[]).includes(v);

/**
 * `from`/`to` travel as plain `YYYY-MM-DD` strings (what `ReadOrdersDto` expects), but the shared
 * `DatePicker` (`@befroosh/ui`) speaks `Date`. Building the `Date` from a local-midnight string
 * (not `new Date(iso)`, which `Date` parses as UTC midnight) keeps the picker showing the exact
 * calendar day that is in the URL, regardless of the browser's UTC offset.
 */
const dateFromIso = (iso?: string): Date | null => (iso ? new Date(`${iso}T00:00:00`) : null);
const isoFromDate = (date?: Date | null): string => (date ? dayjs(date).format('YYYY-MM-DD') : '');

/**
 * Filters live in the URL, not in `useState` (which is what `ProductListPage` does). Tapping an
 * order navigates to /products/orders/[id]; with local state, every "back" would silently throw
 * away the seller's filters and page position. It also makes a filtered list shareable.
 *
 * `limit` is clamped to 200 because `ReadOrdersDto` caps it there -- a hand-edited URL should
 * degrade to the cap, not 400.
 */
export function filtersFromParams(sp: URLSearchParams): OrdersFilters {
  const rawPage = Number(sp.get('page'));
  const rawLimit = Number(sp.get('limit'));
  const status = sp.get('status');
  const search = sp.get('search');
  const from = sp.get('from');
  const to = sp.get('to');

  return {
    page: Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1,
    limit:
      Number.isFinite(rawLimit) && rawLimit >= 1
        ? Math.min(Math.floor(rawLimit), 200)
        : DEFAULT_LIMIT,
    ...(isStatus(status) && { status }),
    ...(search && { search }),
    ...(from && { from }),
    ...(to && { to }),
  };
}

/**
 * `/products/orders` -- the merchant's view of orders placed through the new commerce flow
 * (buy-in-direct). A second, pre-existing "سفارشات" entry (`/orders`) keeps showing legacy
 * orders until a future data migration; the two coexist on purpose.
 */
export function OrdersListPage() {
  const t = useTranslations('Commerce.Orders');
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const filters = useMemo(() => filtersFromParams(new URLSearchParams(sp.toString())), [sp]);
  const { orders, meta, isLoading } = useCommerceOrders(filters);

  // The URL only gets the debounced, >=2-char "effective" search (see `SearchInput`) -- every
  // keystroke still needs somewhere to live locally, or the input would visibly lag the URL.
  const [searchInput, setSearchInput] = useState(filters.search ?? '');
  useEffect(() => {
    setSearchInput(filters.search ?? '');
  }, [filters.search]);

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(sp.toString());

      // Any filter other than `page` itself resets pagination -- otherwise a seller on page 5
      // who picks a status lands on a page that may no longer exist for the new filter set.
      if (key !== 'page') {
        next.delete('page');
      }

      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }

      router.replace(`${pathname}?${next.toString()}`);
    },
    [sp, pathname, router],
  );

  const clearFilters = useCallback(() => {
    router.replace(pathname);
  }, [pathname, router]);

  // `SearchInput` fires `onEffectiveSearchChange` on mount too (its debounce effect always runs
  // once after the first render, matched value or not) -- without this guard, just opening the
  // page would immediately `router.replace` and silently strip any `page`/other params already
  // in the URL before the seller typed a single character.
  const handleEffectiveSearchChange = useCallback(
    (effective: string) => {
      if (effective === (filters.search ?? '')) {
        return;
      }
      setParam('search', effective);
    },
    [filters.search, setParam],
  );

  const hasActiveFilters = Boolean(filters.status || filters.search || filters.from || filters.to);

  // No "you don't have access" screen here: `OrdersCardList.tsx` (the legacy `/orders` list)
  // doesn't render one for `!can('order:view')` either -- it just renders the ordinary empty
  // state because the permission check leaves it nothing to fetch. `useCommerceOrders` (Task 2)
  // has no way to skip its own fetch, so there is nothing left to gate on the client; the API
  // itself is the enforcement point, same as it is for every other endpoint here.

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={searchInput}
          onChange={setSearchInput}
          onEffectiveSearchChange={handleEffectiveSearchChange}
          placeholder={t('searchPlaceholder')}
        />

        <div className="flex items-center gap-1">
          <span className="text-muted-foreground text-xs">{t('dateRange.from')}</span>
          <DatePicker
            date={dateFromIso(filters.from)}
            onChange={(date) => setParam('from', isoFromDate(date))}
          />
          {filters.from && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setParam('from', '')}
            >
              <span className="sr-only">{t('dateRange.clear')}</span>
              <XIcon className="size-3.5" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <span className="text-muted-foreground text-xs">{t('dateRange.to')}</span>
          <DatePicker
            date={dateFromIso(filters.to)}
            onChange={(date) => setParam('to', isoFromDate(date))}
          />
          {filters.to && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setParam('to', '')}
            >
              <span className="sr-only">{t('dateRange.clear')}</span>
              <XIcon className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={!filters.status ? 'default' : 'outline'}
          className="rounded-full"
          onClick={() => setParam('status', '')}
        >
          {t('status.all')}
        </Button>
        {STATUSES.map((status) => (
          <Button
            key={status}
            type="button"
            size="sm"
            variant={filters.status === status ? 'default' : 'outline'}
            className="rounded-full"
            onClick={() => setParam('status', status)}
          >
            {t(`status.${status}`)}
          </Button>
        ))}
      </div>

      <div className="flex-1">
        {!isLoading && orders.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            {hasActiveFilters ? (
              <>
                <div className="text-muted-foreground text-sm">{t('empty.noMatch')}</div>
                <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
                  {t('empty.clearFilters')}
                </Button>
              </>
            ) : (
              <>
                <div className="text-muted-foreground text-sm">{t('empty.none')}</div>
                <div className="text-muted-foreground text-xs">{t('empty.noneHint')}</div>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {orders.map((order) => (
              <OrderCard
                key={order.orderId}
                order={order}
                onOpen={(orderId) => router.push(`/products/orders/${orderId}`)}
              />
            ))}
          </div>
        )}
      </div>

      <ItemsPagination
        serverPage={meta?.currentPage}
        serverPerPage={meta?.itemsPerPage}
        serverTotalPages={meta?.totalPages}
        serverItemCount={meta?.itemCount}
        totalCount={meta?.totalItems}
        isLoading={isLoading}
        onPageChange={(p) => setParam('page', String(p))}
        onLimitChange={(l) => setParam('limit', String(l))}
      />
    </div>
  );
}
