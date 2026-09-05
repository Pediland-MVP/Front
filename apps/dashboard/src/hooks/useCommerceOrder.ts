'use client';

import useSWR, { useSWRConfig } from 'swr';

import api from '@/hooks/swr/api-client';
import { isOrdersListKey } from '@/hooks/useCommerceOrders';
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
  const { mutate: globalMutate } = useSWRConfig();

  const run = async (path: string, body?: unknown) => {
    await api.post(`/commerce/orders/${id}/${path}`, body ?? {});
    await mutate();
    /**
     * Spec §11: every order mutation revalidates the detail AND invalidates the list. Revalidating
     * only the detail left the list holding the pre-action status, so a seller who approved an
     * order and hit back saw it still sitting in "در انتظار تایید" until something else happened to
     * trigger a refetch.
     *
     * A key PREDICATE, not `mutate(ordersListKey(filters))`: the list key encodes the seller's
     * whole filter set (page, status, search, date range), this hook has no idea what that set is,
     * and SWR's cache legitimately holds several of them at once (the page they came from, plus
     * whatever they browsed before). `isOrdersListKey` lives next to `ordersListKey` so the
     * builder and the matcher cannot drift apart.
     *
     * Non-fatal on purpose: SWR's `mutate` rejects if the list's revalidation fetch fails, and
     * that failure has nothing to do with whether the write above landed. Without the `.catch`,
     * a successful write followed by a flaky list refetch surfaced as a failure -- an error toast
     * fired and the reject dialog stayed open, inviting the seller to retry an action that had
     * already gone through. The write itself is the only thing allowed to decide success.
     */
    await globalMutate(isOrdersListKey).catch(() => {});
  };

  return {
    order: data?.data,
    isLoading,
    error,
    mutate,
    approve: () => run('approve'),
    reject: (reason: string) => run('reject', { reason }),
    // `{ trackingUrl }` is sent only when one was actually typed -- an explicit `{ trackingUrl:
    // undefined }` body would still be a key the backend has to ignore, and Back's ship route
    // treats a body's *absence* the same as "no link yet", so there is nothing to gain by sending
    // the key unset.
    ship: (trackingUrl?: string) => run('ship', trackingUrl ? { trackingUrl } : undefined),
    complete: () => run('complete'),
    cancel: () => run('cancel', { reason: 'delivery_refused' }),
    markPaid: () => run('mark-paid'),
  };
}
