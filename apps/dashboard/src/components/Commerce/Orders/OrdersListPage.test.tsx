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

const copy = messages.Commerce.Orders;
const searchPlaceholder = copy.searchPlaceholder;

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

describe('OrdersListPage loading state', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockPush.mockClear();
    searchParamsRef.current = new URLSearchParams();
  });

  /**
   * `orders` is `[]` while the first fetch is still in flight, exactly as it is for a shop with no
   * orders. The page used to render nothing at all in that window -- the empty state is guarded on
   * `!isLoading`, and there was no loading branch -- so opening the screen showed a blank panel
   * until the response landed. Assert the spinner is up AND that neither empty-state copy leaks.
   */
  it('shows a spinner instead of a blank panel while the first fetch is in flight', () => {
    mockUseCommerceOrders.mockReturnValue({
      orders: [],
      meta: undefined,
      isLoading: true,
      error: undefined,
      mutate: vi.fn(),
      key: '',
    });

    renderPage();

    // `Spinner` renders a `Loader2Icon` with `role="status"` -- no test id, so this is the handle.
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText(messages.Commerce.Orders.empty.none)).not.toBeInTheDocument();
    expect(screen.queryByText(messages.Commerce.Orders.empty.noMatch)).not.toBeInTheDocument();
  });

  /**
   * The error branch must still win over the loading branch: SWR keeps `isLoading` true on a
   * retrying request that has already failed once, and a spinner that never resolves reads as a
   * hang rather than a failure.
   */
  it('prefers the load error over the spinner when the fetch has already failed', () => {
    mockUseCommerceOrders.mockReturnValue({
      orders: [],
      meta: undefined,
      isLoading: true,
      error: new Error('boom'),
      mutate: vi.fn(),
      key: '',
    });

    renderPage();

    expect(screen.getByText(messages.Commerce.Orders.loadError)).toBeInTheDocument();
  });
});

describe('OrdersListPage filter clearing', () => {
  /**
   * A NON-EMPTY result set is load-bearing for this block. The empty state renders its own
   * `empty.clearFilters` button, so with `orders: []` these tests would pass against the old code
   * and prove nothing -- the point is that a filtered list WITH results also gets a reset.
   */
  const oneOrder = {
    orderId: 'o1',
    status: 'processing',
    cancelReason: null,
    kind: 'physical',
    lines: [
      {
        variantId: 'v1',
        productId: 'p1',
        title: 'شال',
        options: [],
        imageUrl: null,
        unitPrice: 1000,
        compareAtPrice: null,
        quantity: 1,
        lineTotal: 1000,
      },
    ],
    itemsTotal: 1000,
    shippingTotal: 0,
    grandTotal: 1000,
    paymentMethod: 'card_to_card',
    recipientName: 'علی رضایی',
    mobile: null,
    cityId: null,
    address: null,
    plate: null,
    unit: null,
    postalcode: null,
    placedAt: '2026-09-02T10:00:00.000Z',
    shippingTitle: null,
    shippingKind: null,
    shippingSettlement: null,
    paidAt: null,
    createDate: '2026-09-02T10:00:00.000Z',
  };

  beforeEach(() => {
    mockReplace.mockClear();
    mockPush.mockClear();
    mockUseCommerceOrders.mockReturnValue({
      orders: [oneOrder],
      meta: undefined,
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
      key: '',
    });
  });

  /**
   * The only way to drop a status/date filter used to be to unset each control one at a time, or
   * to reach the empty state's own clear button -- which does not exist when the filters DO match
   * something. A filtered list with results therefore had no reset.
   */
  it('offers a clear-all control in the filter bar whenever a filter is active', () => {
    searchParamsRef.current = new URLSearchParams('status=processing');
    renderPage();

    fireEvent.click(
      screen.getByRole('button', { name: messages.Commerce.Orders.empty.clearFilters }),
    );

    expect(mockReplace).toHaveBeenCalledWith('/products/orders');
  });

  it('hides the clear-all control when no filter is set', () => {
    searchParamsRef.current = new URLSearchParams('page=2');
    renderPage();

    expect(
      screen.queryByRole('button', { name: messages.Commerce.Orders.empty.clearFilters }),
    ).not.toBeInTheDocument();
  });
});

describe('OrdersListPage list rendering', () => {
  // Same shape `OrdersTable.test.tsx`/`OrderRowCard.test.tsx` use for `OrderListView` -- both
  // renderings must be able to consume it without the mock hiding a real type mismatch.
  const oneOrder = {
    orderId: 'o1',
    status: 'processing',
    cancelReason: null,
    kind: 'physical',
    lines: [
      {
        variantId: 'v1',
        productId: 'p1',
        title: 'شال',
        options: [],
        imageUrl: null,
        unitPrice: 1000,
        compareAtPrice: null,
        quantity: 1,
        lineTotal: 1000,
      },
    ],
    itemsTotal: 1000,
    shippingTotal: 0,
    grandTotal: 1000,
    paymentMethod: 'card_to_card',
    recipientName: 'علی رضایی',
    mobile: null,
    cityId: null,
    address: null,
    plate: null,
    unit: null,
    postalcode: null,
    placedAt: '2026-09-02T10:00:00.000Z',
    shippingTitle: null,
    shippingKind: null,
    shippingSettlement: null,
    paidAt: null,
    createDate: '2026-09-02T10:00:00.000Z',
    receiptUrl: null,
    receiptCount: 0,
  };

  beforeEach(() => {
    mockReplace.mockClear();
    mockPush.mockClear();
    searchParamsRef.current = new URLSearchParams();
    mockUseCommerceOrders.mockReturnValue({
      orders: [oneOrder],
      meta: undefined,
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
      key: '',
    });
  });

  it('renders the table and the row-card list, one per breakpoint', async () => {
    renderPage();
    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: copy.table.openOrder }).length).toBeGreaterThan(0);
  });

  it('renders both breakpoint renderings, so neither is dropped', async () => {
    renderPage();
    await screen.findByRole('table');
    // Both `OrdersTable` and `OrderRowCard` render a `role="button"` with the same
    // `table.openOrder` label for one order -- exactly two means both are mounted, CSS just
    // picks which one is visible. One would mean the other rendering got dropped.
    expect(screen.getAllByRole('button', { name: copy.table.openOrder })).toHaveLength(2);
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
