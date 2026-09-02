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

import messages from '@/messages/fa.json';
import { filtersFromParams, DEFAULT_LIMIT, OrdersListPage } from './OrdersListPage';

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
