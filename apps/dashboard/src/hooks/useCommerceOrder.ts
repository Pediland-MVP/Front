'use client';

import useSWR from 'swr';

import api from '@/hooks/swr/api-client';
import type { IResponseMessage } from '@/types/responseMessage';
import type { OrderDetailView } from '@/types/commerceOrders';

export const orderDetailKey = (id: string) => `/commerce/orders/${id}`;

/**
 * One order plus the six writes that move it.
 *
 * Unlike `useShippingOptions` -- which suppresses revalidation because that screen batches a
 * screenful of edits behind one save button -- every write here revalidates immediately. An order
 * action is single-shot and changes which actions are legal next, so the action bar must redraw
 * against the server's answer rather than a guess.
 *
 * `GET :id` returns a `ResponseMessage`, so the payload is under `.data` (the list is not -- see
 * `useCommerceOrders`). The two envelopes genuinely differ; this is not an inconsistency to
 * "clean up".
 */
export function useCommerceOrder(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<IResponseMessage<OrderDetailView>>(
    id ? orderDetailKey(id) : null,
  );

  const run = async (path: string, body?: unknown) => {
    await api.post(`/commerce/orders/${id}/${path}`, body ?? {});
    await mutate();
  };

  return {
    order: data?.data,
    isLoading,
    error,
    mutate,
    approve: () => run('approve'),
    reject: (reason: string) => run('reject', { reason }),
    ship: () => run('ship'),
    complete: () => run('complete'),
    cancel: () => run('cancel', { reason: 'delivery_refused' }),
    markPaid: () => run('mark-paid'),
  };
}
