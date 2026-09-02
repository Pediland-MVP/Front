import { describe, it, expect } from 'vitest';

import { orderDetailKey } from './useCommerceOrder';
import { isOrdersListKey, ordersListKey } from './useCommerceOrders';

describe('ordersListKey', () => {
  it('always carries page and limit', () => {
    expect(ordersListKey({ page: 1, limit: 20 })).toBe('/commerce/orders?page=1&limit=20');
  });

  it('adds only the filters that are set', () => {
    expect(ordersListKey({ page: 2, limit: 20, status: 'awaiting_review' })).toBe(
      '/commerce/orders?page=2&limit=20&status=awaiting_review',
    );
  });

  it('url-encodes the search term so a space or & cannot break the query', () => {
    expect(ordersListKey({ page: 1, limit: 20, search: 'علی رضایی' })).toBe(
      `/commerce/orders?page=1&limit=20&search=${encodeURIComponent('علی رضایی')}`,
    );
  });

  it('omits an empty search rather than sending search=', () => {
    expect(ordersListKey({ page: 1, limit: 20, search: '' })).toBe(
      '/commerce/orders?page=1&limit=20',
    );
  });

  it('carries the date range', () => {
    expect(ordersListKey({ page: 1, limit: 20, from: '2026-08-01', to: '2026-08-31' })).toBe(
      '/commerce/orders?page=1&limit=20&from=2026-08-01&to=2026-08-31',
    );
  });
});

/**
 * I1: every order write invalidates the list, using this predicate rather than a literal key --
 * `useCommerceOrder` has no idea which filter set the seller is looking at, and SWR's cache holds
 * several at once. The builder and the matcher live in the same file precisely so this contract
 * can be asserted; a drift between them would be a silent staleness bug, not a loud failure.
 */
describe('isOrdersListKey matches exactly what ordersListKey builds', () => {
  it.each([
    { page: 1, limit: 20 },
    { page: 2, limit: 20, status: 'awaiting_review' as const },
    { page: 1, limit: 200, search: 'علی رضایی' },
    { page: 1, limit: 20, from: '2026-08-01', to: '2026-08-31' },
    {
      page: 4,
      limit: 50,
      status: 'completed' as const,
      search: '0912',
      from: '2026-08-01',
      to: '2026-08-31',
    },
  ])('matches the key for %o', (filters) => {
    expect(isOrdersListKey(ordersListKey(filters))).toBe(true);
  });

  /**
   * The `?` in the prefix is load-bearing: a detail key shares the `/commerce/orders` prefix, and
   * sweeping it into the list invalidation would refetch the very request that just resolved.
   */
  it('does not match a detail key, which shares the same prefix', () => {
    expect(isOrdersListKey(orderDetailKey('c0ffee'))).toBe(false);
    expect(isOrdersListKey('/commerce/orders')).toBe(false);
  });

  it('ignores non-string keys rather than throwing on them', () => {
    expect(isOrdersListKey(null)).toBe(false);
    expect(isOrdersListKey(undefined)).toBe(false);
    expect(isOrdersListKey(['/commerce/orders?page=1'])).toBe(false);
  });
});
