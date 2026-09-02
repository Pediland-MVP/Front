import { describe, it, expect } from 'vitest';

import { filtersFromParams, DEFAULT_LIMIT } from './OrdersListPage';

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
