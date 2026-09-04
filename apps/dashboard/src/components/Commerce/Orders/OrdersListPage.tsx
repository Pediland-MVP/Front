'use client';

import { DownloadIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import DateObject from 'react-date-object';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import DatePicker from 'react-multi-date-picker';

import { cn } from '@/lib/utils';

import { ItemsPagination } from '@/components/Console/ItemsPagination';
import { NoDataError } from '@/components/Global/NoDataError';
import { Button } from '@/components/ui/button';
import { LoaderSpin } from '@/components/ui-custom/LoaderSpin';
import { SearchInput } from '@/components/ui-custom/SearchInput';
import { usePermissions } from '@/hooks/usePermissions';
import { useCommerceOrders } from '@/hooks/useCommerceOrders';
import { useHeaderFeatures } from '@/lib/stores/useHeaderFeaturesStore';
import type { CommerceOrderStatus, OrdersFilters } from '@/types/commerceOrders';

import { OrderRowCard } from './OrderRowCard';
import { OrdersExportDrawer } from './OrdersExportDrawer';
import { OrdersTable } from './OrdersTable';

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
 * The picker is `react-multi-date-picker`, the same one the three existing export drawers use
 * (`app/(Console)/orders/components/excelExportOrders.drawer.tsx` and its `contacts`/`directs`
 * siblings). It is NOT `packages/ui`'s `DatePicker`, and that is load-bearing, not taste:
 * the `@/components/ui` alias resolves into `packages/ui`, whose `date-picker.tsx` imports
 * `../../lib/dayjs-jalali`, and that module's BODY runs `dayjs.calendar('jalali')` -- a GLOBAL
 * default-calendar mutation on the shared dayjs instance, not a per-instance one. Importing it
 * anywhere in the dashboard silently switched every plain `dayjs()` in the session to Jalali:
 * `?from=`/`?to=` went out as `1405-06-11` instead of `2026-09-02`, and `utils/jalali.ts`
 * (which reads `d.year()/month()/date()` expecting Gregorian and feeds them to `toJalaali`)
 * double-converted and rendered year 784 on the detail screen. Do not reintroduce that import.
 *
 * `from`/`to` therefore travel as plain GREGORIAN `YYYY-MM-DD` strings (what `ReadOrdersDto`
 * expects), formatted from the Date's own local calendar fields rather than through dayjs, so no
 * plugin can change what they mean. `OrdersListPage.test.tsx` pins both halves.
 */
export const dateFromIso = (iso?: string): Date | null =>
  // Local midnight, not `new Date(iso)` (which `Date` parses as UTC midnight) -- keeps the picker
  // showing the exact calendar day that is in the URL, regardless of the browser's UTC offset.
  iso ? new Date(`${iso}T00:00:00`) : null;

const pad2 = (n: number) => String(n).padStart(2, '0');

export const isoFromDate = (date?: Date | null): string =>
  date ? `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}` : '';

/**
 * The picker hands back a `DateObject` on the Persian calendar; `.toDate()` returns the plain
 * Gregorian `Date` for that day, which `isoFromDate` then formats.
 */
const isoFromPicked = (picked: DateObject | DateObject[] | null): string =>
  picked && !Array.isArray(picked) ? isoFromDate(picked.toDate()) : '';

// Matches the height/border of the filter bar's other controls without pulling in `Input`, which
// react-multi-date-picker cannot render as its own input element. `w-full sm:w-32`: on a phone the
// two pickers share a 2-column grid and each fills its cell, instead of being pinned to 128px and
// leaving the row looking half-empty.
const DATE_INPUT_CLASS =
  'border-input bg-card text-foreground h-9 w-full sm:w-32 rounded-md border px-2 text-xs';

interface DateFilterCellProps {
  label: string;
  clearLabel: string;
  value?: string;
  onPick: (iso: string) => void;
}

/**
 * One labelled date picker plus its clear button.
 *
 * The clear button keeps its slot when there is no date (`invisible`, not unmounted). Mounting it
 * only when a date is set made the whole filter row jump sideways by ~28px the moment a date was
 * picked or cleared -- and the button the seller had just aimed at moved out from under the
 * cursor. `aria-hidden`/`tabIndex={-1}` keep the placeholder out of the accessibility tree and the
 * tab order, so it costs nothing when it is not usable.
 *
 * Module-level, not defined inside `OrdersListPage`: a component declared in a render body is a
 * new type on every render, which would unmount and remount the picker (closing its calendar
 * popover) on every keystroke in the search box.
 */
function DateFilterCell({ label, clearLabel, value, onPick }: DateFilterCellProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-1.5">
      <span className="text-muted-foreground shrink-0 text-xs">{label}</span>
      <div className="flex min-w-0 items-center gap-0.5">
        <DatePicker
          value={dateFromIso(value)}
          onChange={(picked) => onPick(isoFromPicked(picked))}
          calendar={persian}
          locale={persian_fa}
          calendarPosition="bottom-right"
          inputClass={DATE_INPUT_CLASS}
          placeholder={label}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('size-7 shrink-0', !value && 'invisible')}
          aria-hidden={!value}
          tabIndex={value ? 0 : -1}
          onClick={() => onPick('')}
        >
          <span className="sr-only">{clearLabel}</span>
          <XIcon className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

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
  const { orders, meta, isLoading, error } = useCommerceOrders(filters);

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

  const { can } = usePermissions();
  const [exportOpen, setExportOpen] = useState(false);

  const setButtons = useHeaderFeatures((s) => s.setButtons);
  const clearButtons = useHeaderFeatures((s) => s.clearButtons);

  // Mirrors `app/(Console)/orders/page.tsx`'s pattern: a page-level action button lives in the
  // console header, wired through `useHeaderFeatures`, not inline in this component's own tree.
  // This does not contradict filters living in the URL (not the header) -- that ruling was about
  // URL-backed filter state specifically, not a one-shot action trigger.
  const HeaderButton = useMemo(
    () =>
      can('order:manage') ? (
        <Button type="button" size="md" onClick={() => setExportOpen(true)}>
          {t('export.title')}
          <DownloadIcon />
        </Button>
      ) : null,
    [can, t],
  );

  useEffect(() => {
    setButtons(HeaderButton);
  }, [HeaderButton, setButtons]);

  useEffect(() => {
    return () => clearButtons();
  }, [clearButtons]);

  // No "you don't have access" screen here: `OrdersCardList.tsx` (the legacy `/orders` list)
  // doesn't render one for `!can('order:view')` either -- it just renders the ordinary empty
  // state because the permission check leaves it nothing to fetch. `useCommerceOrders` (Task 2)
  // has no way to skip its own fetch, so there is nothing left to gate on the client; the API
  // itself is the enforcement point, same as it is for every other endpoint here.

  const listRegion = error ? (
    // Must come before every other branch: a failed fetch leaves `orders` as `[]` AND can leave
    // `isLoading` true on a retry, so without this check a 403 (a KAM without `order:view`) or a
    // 500 would silently render "no orders yet" -- confidently telling a refused seller their shop
    // has no orders -- or a spinner that never resolves, which reads as a hang rather than a
    // failure. `NoDataError` carries the orders-specific copy rather than the generic
    // `ERROR_CODES.FETCH_DATA`, so the seller is told WHAT failed.
    <NoDataError message={t('loadError')} />
  ) : isLoading ? (
    // `orders` is `[]` during the first fetch exactly as it is for a shop with no orders. Without
    // this branch the panel was simply blank until the response landed.
    <LoaderSpin />
  ) : orders.length === 0 ? (
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
    /**
     * Both renderings are always in the DOM and CSS picks one. A `useMediaQuery` hook would paint
     * the wrong layout on the first render and visibly flash. At the default `limit` of 20 this is
     * 40 light rows; the seller-set maximum is 200.
     */
    <>
      <div className="hidden md:block">
        <OrdersTable
          orders={orders}
          onOpen={(orderId) => router.push(`/products/orders/${orderId}`)}
        />
      </div>
      <div className="flex flex-col gap-2 md:hidden">
        {orders.map((order) => (
          <OrderRowCard
            key={order.orderId}
            order={order}
            onOpen={(orderId) => router.push(`/products/orders/${orderId}`)}
          />
        ))}
      </div>
    </>
  );

  /**
   * Three bands. From `md` up only the middle one scrolls: `page.tsx` hands this component a
   * `LayoutCard` with `md:overflow-hidden`, so the filters stay put while the seller pages through
   * orders instead of scrolling away above them, and the pager stays reachable without scrolling
   * to the bottom. `md:min-h-0` on the root and on the list band is what allows that band to
   * shrink below its content height -- without it a flex child refuses to, and the whole column
   * overflows again.
   *
   * Below `md` every band is a plain block and the page scrolls as a whole, which is what
   * `SidebarInset` already does for the rest of the app on a phone. Pinning there would hand the
   * list about one card's worth of height on a short screen.
   */
  return (
    <div className="flex flex-col gap-3 md:h-full md:min-h-0">
      <OrdersExportDrawer open={exportOpen} onOpenChange={setExportOpen} filters={filters} />

      <div className="flex shrink-0 flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <div className="w-full sm:max-w-xs">
            <SearchInput
              value={searchInput}
              onChange={setSearchInput}
              onEffectiveSearchChange={handleEffectiveSearchChange}
              placeholder={t('searchPlaceholder')}
            />
          </div>

          {/* Two equal cells on a phone, natural width from `sm` up. Previously both pickers were
              `w-32` at every size and crowded the search box off the row. */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3">
            <DateFilterCell
              label={t('dateRange.from')}
              clearLabel={t('dateRange.clear')}
              value={filters.from}
              onPick={(iso) => setParam('from', iso)}
            />
            <DateFilterCell
              label={t('dateRange.to')}
              clearLabel={t('dateRange.clear')}
              value={filters.to}
              onPick={(iso) => setParam('to', iso)}
            />
          </div>

          {/* Before this, the only reset lived in the EMPTY state -- so a filtered list that DID
              match something had no way back except unsetting each control one at a time. */}
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground self-start"
            >
              <XIcon className="size-3.5" />
              {t('empty.clearFilters')}
            </Button>
          )}
        </div>

        {/* Six chips wrap to three lines on a phone and eat the viewport. Below `sm` they scroll
            sideways in one row instead; the negative margin lets the row bleed to the card edge so
            the last chip is visibly cut off, which is what signals it scrolls. */}
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
          <Button
            type="button"
            size="sm"
            variant={!filters.status ? 'default' : 'outline'}
            className="shrink-0 rounded-full"
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
              className="shrink-0 rounded-full"
              onClick={() => setParam('status', status)}
            >
              {t(`status.${status}`)}
            </Button>
          ))}
        </div>
      </div>

      {/*
        `-mx-1 px-1` so a card's hover shadow and focus ring are not clipped by the scroll box.

        `min-h-[280px]` matters only on mobile, where this band is a plain auto-height block: the
        loader, the empty state and `NoDataError` all centre themselves with `h-full`, which
        against an auto-height parent collapses to their own content height and leaves them
        crammed against the filter bar. From `md` up the band is a flex child with a real height,
        so the floor is dropped.
      */}
      <div className="-mx-1 min-h-[280px] px-1 md:min-h-0 md:flex-1 md:overflow-y-auto">
        {listRegion}
      </div>

      {!error && (
        <div className="shrink-0 border-t pt-2">
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
      )}
    </div>
  );
}
