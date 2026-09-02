import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

// `OrdersListPage` reads/writes the URL through `next/navigation` -- give it a mutable
// `URLSearchParams` handle each test can set before rendering, and spy on `replace`/`push` so
// assertions can check exactly what URL the component pushed.
const { mockReplace, mockPush, searchParamsRef } = vi.hoisted(() => ({
  mockReplace: vi.fn(),
  mockPush: vi.fn(),
  searchParamsRef: { current: new URLSearchParams() },
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
  useSearchParams: () => searchParamsRef.current,
  usePathname: () => '/products/orders',
}));

// `useCommerceOrders` (Task 2) is a separate, already-tested unit -- stub it so these tests only
// exercise `OrdersListPage`'s own filter/URL wiring, not a real fetch.
const { mockUseCommerceOrders } = vi.hoisted(() => ({ mockUseCommerceOrders: vi.fn() }));
vi.mock('@/hooks/useCommerceOrders', () => ({
  useCommerceOrders: (...args: unknown[]) => mockUseCommerceOrders(...args),
}));

import dayjs from 'dayjs';

import messages from '@/messages/fa.json';
import {
  filtersFromParams,
  dateFromIso,
  isoFromDate,
  DEFAULT_LIMIT,
  OrdersListPage,
} from './OrdersListPage';

const searchPlaceholder = messages.Commerce.Orders.searchPlaceholder;

function renderPage() {
  return render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <OrdersListPage />
    </NextIntlClientProvider>,
  );
}

describe('filtersFromParams', () => {
  it('defaults to page 1 and the default limit when the URL is bare', () => {
    expect(filtersFromParams(new URLSearchParams())).toEqual({ page: 1, limit: DEFAULT_LIMIT });
  });

  it('reads every supported filter out of the URL', () => {
    const sp = new URLSearchParams(
      'page=3&status=processing&search=%D8%B9%D9%84%DB%8C&from=2026-08-01&to=2026-08-31',
    );
    expect(filtersFromParams(sp)).toEqual({
      page: 3,
      limit: DEFAULT_LIMIT,
      status: 'processing',
      search: 'علی',
      from: '2026-08-01',
      to: '2026-08-31',
    });
  });

  it('ignores a status that is not a real order status', () => {
    expect(filtersFromParams(new URLSearchParams('status=banana')).status).toBeUndefined();
  });

  it('falls back to page 1 when the page is junk or below 1', () => {
    expect(filtersFromParams(new URLSearchParams('page=0')).page).toBe(1);
    expect(filtersFromParams(new URLSearchParams('page=abc')).page).toBe(1);
  });

  it('never exceeds the API cap of 200', () => {
    expect(filtersFromParams(new URLSearchParams('limit=500')).limit).toBe(200);
  });
});

describe('OrdersListPage search filter', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockPush.mockClear();
    mockUseCommerceOrders.mockReturnValue({
      orders: [],
      meta: undefined,
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
      key: '',
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('typing a search term puts it in the URL and resets page to 1', () => {
    searchParamsRef.current = new URLSearchParams('page=3');
    renderPage();

    const input = screen.getByPlaceholderText(searchPlaceholder);
    fireEvent.change(input, { target: { value: 'علی' } });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // `page=3` is gone -- only `search` remains, matching `filtersFromParams`'s default of 1.
    expect(mockReplace).toHaveBeenCalledWith('/products/orders?search=%D8%B9%D9%84%DB%8C');
  });

  it('clearing the search removes the parameter entirely, not just its value', () => {
    searchParamsRef.current = new URLSearchParams('search=%D8%B9%D9%84%DB%8C');
    renderPage();

    const input = screen.getByPlaceholderText(searchPlaceholder) as HTMLInputElement;
    expect(input.value).toBe('علی');

    fireEvent.change(input, { target: { value: '' } });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mockReplace).toHaveBeenCalledWith('/products/orders?');
    expect(mockReplace).not.toHaveBeenCalledWith('/products/orders?search=');
  });

  it('does not push a URL change on mount when there is nothing to change', () => {
    searchParamsRef.current = new URLSearchParams('page=3');
    renderPage();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mockReplace).not.toHaveBeenCalled();
  });
});

describe('OrdersListPage error state', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockPush.mockClear();
    searchParamsRef.current = new URLSearchParams();
  });

  // `error` and an empty `orders` array look identical from the hook's data shape alone -- a
  // failed fetch also leaves `orders` as `[]`. The error branch must be checked first, or a 403
  // (a KAM without `order:view`) or a 500 renders "no orders yet" instead of a failure notice.
  // This test fails if the two branches are swapped, not just if the error copy is missing.
  it('shows the load-error copy instead of "no orders yet" when the fetch fails', () => {
    mockUseCommerceOrders.mockReturnValue({
      orders: [],
      meta: undefined,
      isLoading: false,
      error: new Error('Request failed with status code 403'),
      mutate: vi.fn(),
      key: '',
    });

    renderPage();

    expect(screen.getByText(messages.Commerce.Orders.loadError)).toBeInTheDocument();
    expect(screen.queryByText(messages.Commerce.Orders.empty.none)).not.toBeInTheDocument();
    expect(screen.queryByText(messages.Commerce.Orders.empty.noneHint)).not.toBeInTheDocument();
  });
});

/**
 * Regression guard for the defect this screen shipped: it imported `packages/ui`'s `DatePicker`,
 * which transitively imports `packages/ui/src/lib/dayjs-jalali`, whose module BODY calls
 * `dayjs.calendar('jalali')` -- a GLOBAL mutation of the shared dayjs default calendar. The old
 * `isoFromDate` used plain `dayjs(...).format('YYYY-MM-DD')`, so `?from=`/`?to=` and the export
 * payload went out as `1405-06-11` instead of `2026-09-02`.
 *
 * The direct import is gone (see `OrdersListPage.tsx`), but the mutation is NOT: the
 * `@/components/ui` BARREL re-exports `./date-picker`, and `OrdersExportDrawer` -- which this
 * screen renders -- imports from that barrel. The first `expect` below pins that, so the test
 * suite states the real state of the world rather than a comfortable one, and so the rest of this
 * block is a test of the fix under the hostile condition it actually runs in, not a clean room.
 */
describe('the date filter speaks Gregorian to the API', () => {
  it('runs in a module graph where dayjs HAS been switched to Jalali globally', () => {
    // Not the fix's job to undo -- `packages/ui`'s barrel owns it, and 24 dashboard files import
    // that barrel. Asserted so a future contributor who fixes it upstream sees this go red and
    // knows this whole block can be simplified.
    expect(dayjs('2026-09-02T00:00:00').format('YYYY-MM-DD')).toBe('1405-06-11');
  });

  it('round-trips an ISO day back to the same Gregorian YYYY-MM-DD anyway', () => {
    const picked = dateFromIso('2026-09-02');
    expect(picked).not.toBeNull();
    // A literal, not a computed expectation. This is the string `ReadOrdersDto` parses; the old
    // dayjs-based helper produced '1405-06-11' here, which 400s or silently matches nothing.
    expect(isoFromDate(picked)).toBe('2026-09-02');
  });

  it('formats an arbitrary Date from its own calendar fields, not through a dayjs plugin', () => {
    expect(isoFromDate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(isoFromDate(null)).toBe('');
    expect(isoFromDate(undefined)).toBe('');
  });
});
