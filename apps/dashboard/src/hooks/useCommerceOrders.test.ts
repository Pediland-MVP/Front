import { describe, it, expect } from 'vitest';

import { ordersListKey } from './useCommerceOrders';

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
