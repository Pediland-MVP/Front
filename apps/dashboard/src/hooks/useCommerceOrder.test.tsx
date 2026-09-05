import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { SWRConfig } from 'swr';

const { post, patch } = vi.hoisted(() => ({ post: vi.fn(), patch: vi.fn() }));
vi.mock('@/hooks/swr/api-client', () => ({ default: { post, patch } }));

import { useCommerceOrder } from './useCommerceOrder';
import { useCommerceOrders } from './useCommerceOrders';

const LIST_KEY = '/commerce/orders?page=1&limit=20';
const DETAIL_KEY = '/commerce/orders/o1';

/**
 * I1 / spec §11: "every order mutation revalidates the detail AND invalidates the list."
 *
 * Driven through the real SWR cache rather than by spying on `mutate`: what actually matters is
 * that the LIST endpoint is refetched, and only an end-to-end assertion on the fetcher can show
 * that. Both hooks are mounted together, which is the real situation -- the seller opens a detail
 * from a list that is still in cache behind them, acts, and navigates back.
 */
describe('useCommerceOrder invalidates the orders list after a write', () => {
  const fetcher = vi.fn(async (key: string) =>
    key.includes('?') ? { items: [], meta: {} } : { data: { orderId: 'o1' } },
  );

  const wrapper = ({ children }: { children: ReactNode }) => (
    <SWRConfig
      value={{ fetcher, provider: () => new Map(), dedupingInterval: 0, revalidateOnFocus: false }}
    >
      {children}
    </SWRConfig>
  );

  const mountBoth = () =>
    renderHook(
      () => ({
        list: useCommerceOrders({ page: 1, limit: 20 }),
        detail: useCommerceOrder('o1'),
      }),
      { wrapper },
    );

  beforeEach(() => {
    post.mockReset().mockResolvedValue({ data: {} });
    patch.mockReset().mockResolvedValue({ data: {} });
    fetcher.mockClear();
  });

  it('refetches BOTH the detail and the list after approve', async () => {
    const { result } = mountBoth();
    await waitFor(() => expect(fetcher).toHaveBeenCalledWith(LIST_KEY));
    await waitFor(() => expect(fetcher).toHaveBeenCalledWith(DETAIL_KEY));
    fetcher.mockClear();

    await act(async () => {
      await result.current.detail.approve();
    });

    expect(post).toHaveBeenCalledWith('/commerce/orders/o1/approve', {});
    // The detail redraws the action bar against the server's answer...
    await waitFor(() => expect(fetcher).toHaveBeenCalledWith(DETAIL_KEY));
    // ...and the list is invalidated too, so going back does not show the pre-action status.
    await waitFor(() => expect(fetcher).toHaveBeenCalledWith(LIST_KEY));
  });

  it('does the same for every other write, not just approve', async () => {
    const { result } = mountBoth();
    await waitFor(() => expect(fetcher).toHaveBeenCalledWith(LIST_KEY));

    for (const [label, run] of [
      ['reject', () => result.current.detail.reject('رسید ناخواناست')],
      ['ship', () => result.current.detail.ship()],
      ['complete', () => result.current.detail.complete()],
      ['cancel', () => result.current.detail.cancel()],
      ['markPaid', () => result.current.detail.markPaid()],
    ] as const) {
      fetcher.mockClear();
      await act(async () => {
        await run();
      });
      await waitFor(() => expect(fetcher).toHaveBeenCalledWith(LIST_KEY), {
        timeout: 2000,
      });
      expect(label).toBeTruthy();
    }

    expect(post).toHaveBeenNthCalledWith(1, '/commerce/orders/o1/reject', {
      reason: 'رسید ناخواناست',
    });
    expect(post).toHaveBeenNthCalledWith(4, '/commerce/orders/o1/cancel', {
      reason: 'delivery_refused',
    });
    expect(post).toHaveBeenNthCalledWith(5, '/commerce/orders/o1/mark-paid', {});
  });

  /**
   * `updateTracking` PATCHes (a correction, not a status transition) while every other write
   * above POSTs -- this pins that it still revalidates both keys the same way the rest do.
   */
  it('PATCHes for updateTracking, and still revalidates both keys', async () => {
    const { result } = mountBoth();
    await waitFor(() => expect(fetcher).toHaveBeenCalledWith(LIST_KEY));
    fetcher.mockClear();

    await act(async () => {
      await result.current.detail.updateTracking('https://tracking.post.ir/abc', true);
    });

    expect(patch).toHaveBeenCalledWith('/commerce/orders/o1/tracking', {
      trackingUrl: 'https://tracking.post.ir/abc',
      notify: true,
    });
    expect(post).not.toHaveBeenCalled();
    await waitFor(() => expect(fetcher).toHaveBeenCalledWith(DETAIL_KEY));
    await waitFor(() => expect(fetcher).toHaveBeenCalledWith(LIST_KEY));
  });
});
