'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { useCommerceOrder } from '@/hooks/useCommerceOrder';
import { useShippingDestinations } from '@/hooks/useShippingDestinations';

import { LoaderSpin } from '@/components/ui-custom/LoaderSpin';
import { NoDataError } from '@/components/Global/NoDataError';

import { OrderActions } from './OrderActions';
import { OrderDetail } from './OrderDetail';
import type { OrderActionName } from './orderTransitions';

interface OrderDetailPageProps {
  orderId: string;
}

/**
 * Owns everything `OrderDetail` (pure) and `OrderActions` need but do not fetch themselves: the
 * order itself, the city name lookup, and the write handlers.
 */
export function OrderDetailPage({ orderId }: OrderDetailPageProps) {
  const t_ec = useTranslations('ERROR_CODES');
  const { order, isLoading, mutate, approve, reject, ship, complete, cancel, markPaid } =
    useCommerceOrder(orderId);
  const { cityById } = useShippingDestinations();

  /**
   * Matches `OrderActions`' `onAction` signature exactly: (name, reason?) => Promise<void>.
   *
   * `COMMERCE_ORDER_STATUS_CHANGED` means someone else already acted, or the buyer's DM moved
   * this order underneath the page. Toasting alone would leave stale buttons that fail on every
   * retry, so we revalidate: the action bar redraws against the order's real status.
   */
  const onAction = async (name: OrderActionName | 'markPaid', reason?: string) => {
    const run: Record<OrderActionName | 'markPaid', () => Promise<void>> = {
      approve,
      reject: () => reject(reason ?? ''),
      ship,
      complete,
      cancel,
      markPaid,
    };
    try {
      await run[name]();
    } catch (error: any) {
      const code = error?.response?.data?.code;
      /**
       * `code` is only guaranteed on a request that reached the API and came back structured.
       * On a network error (no response at all) `code` is `undefined`, and next-intl's `t_ec`
       * still returns the truthy key path `ERROR_CODES.undefined` for a missing key -- so
       * `t_ec(code) || error?.response?.data?.message` would never reach the server-message
       * fallback and the toast would show that raw key. Branching on `code` first restores the
       * intended fallback.
       */
      toast.error(code ? t_ec(code) : error?.response?.data?.message);
      if (code === 'COMMERCE_ORDER_STATUS_CHANGED') await mutate();
    }
  };

  if (isLoading) return <LoaderSpin />;
  if (!order) return <NoDataError />;

  return (
    <OrderDetail
      order={order}
      cityName={order.cityId ? (cityById.get(order.cityId)?.name ?? null) : null}
      actions={<OrderActions order={order} onAction={onAction} disabled={isLoading} />}
    />
  );
}
