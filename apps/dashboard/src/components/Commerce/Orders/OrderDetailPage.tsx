'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { useCommerceOrder } from '@/hooks/useCommerceOrder';
import { usePermissions } from '@/hooks/usePermissions';
import { useShippingDestinations } from '@/hooks/useShippingDestinations';

import { LoaderSpin } from '@/components/ui-custom/LoaderSpin';
import { NoDataError } from '@/components/Global/NoDataError';

import { OrderDetail } from './OrderDetail';
import { OrderStatusUpdater } from './OrderStatusUpdater';
import { hasAnyAction, type OrderActionName } from './orderTransitions';

interface OrderDetailPageProps {
  orderId: string;
}

/**
 * Owns everything `OrderDetail` (pure) and `OrderStatusUpdater` need but do not fetch themselves:
 * the order itself, the city name lookup, and the write handlers.
 */
export function OrderDetailPage({ orderId }: OrderDetailPageProps) {
  const t = useTranslations('Commerce.Orders');
  const t_ec = useTranslations('ERROR_CODES');
  const {
    order,
    isLoading,
    mutate,
    approve,
    reject,
    ship,
    complete,
    cancel,
    markPaid,
    updateTracking,
  } = useCommerceOrder(orderId);
  const { cityById } = useShippingDestinations();
  const { can } = usePermissions();

  /**
   * Matches `OrderStatusUpdater`'s `onAction` signature exactly:
   * (name, reason?, trackingUrl?) => Promise<boolean>. `trackingUrl` is carried only by `ship`,
   * the same way `reason` is carried only by `reject`.
   *
   * `COMMERCE_ORDER_STATUS_CHANGED` means someone else already acted, or the buyer's DM moved
   * this order underneath the page. Toasting alone would leave stale buttons that fail on every
   * retry, so we revalidate: the action bar redraws against the order's real status.
   */
  const onAction = async (
    name: OrderActionName | 'markPaid',
    reason?: string,
    trackingUrl?: string,
  ): Promise<boolean> => {
    const run: Record<OrderActionName | 'markPaid', () => Promise<void>> = {
      approve,
      reject: () => reject(reason ?? ''),
      ship: () => ship(trackingUrl),
      complete,
      cancel,
      markPaid,
    };
    try {
      await run[name]();
      return true;
    } catch (error: any) {
      const code = error?.response?.data?.code;
      /**
       * `code` is only guaranteed on a request that reached the API and came back structured.
       * On a network error (no response at all) `code` is `undefined`, and next-intl's `t_ec`
       * still returns the truthy key path `ERROR_CODES.undefined` for a missing key -- so
       * `t_ec(code) || error?.response?.data?.message` would never reach the server-message
       * fallback and the toast would show that raw key. Branching on `code` first restores the
       * intended fallback.
       *
       * The final `|| t('errors.unknown')` is the transport case: axios attaches no `response` at
       * all when the request never reached the API, so BOTH `code` and `message` are `undefined`
       * and `toast.error(undefined)` rendered an empty toast -- the seller saw a blank box and
       * could not tell whether the action had gone through. `||` (not `??`) also catches a
       * server response with `message: ''`, which is exactly the empty-toast failure this
       * fallback exists to prevent.
       */
      toast.error(code ? t_ec(code) : error?.response?.data?.message || t('errors.unknown'));
      if (code === 'COMMERCE_ORDER_STATUS_CHANGED') await mutate();
      // Reporting the failure is what lets the dialogs stay open and keep the seller's typed
      // reason -- see `OrderActions`' `onAction` docstring.
      return false;
    }
  };

  /**
   * `EditTrackingDialog`'s contract is `(trackingUrl, notify) => Promise<boolean>`, not
   * `onAction`'s `(name, reason?, trackingUrl?)` -- folding it in would need a fake
   * `OrderActionName` for something that isn't a status transition at all (Back's tracking route
   * accepts the write while status is `sending` OR `completed`, not one target status). Same
   * error/toast shape as `onAction` above -- see its comment for why the fallbacks are ordered
   * the way they are.
   */
  const onUpdateTracking = async (trackingUrl: string, notify: boolean): Promise<boolean> => {
    try {
      await updateTracking(trackingUrl, notify);
      return true;
    } catch (error: any) {
      const code = error?.response?.data?.code;
      toast.error(code ? t_ec(code) : error?.response?.data?.message || t('errors.unknown'));
      if (code === 'COMMERCE_ORDER_STATUS_CHANGED') await mutate();
      return false;
    }
  };

  if (isLoading) return <LoaderSpin />;
  if (!order) return <NoDataError />;

  /**
   * `OrderSummaryRail` renders a bordered status-updater slot whenever `statusUpdater` is
   * truthy, and an `<OrderStatusUpdater/>` ELEMENT is truthy even when the component itself
   * renders `null`. So the decision has to happen HERE, before the element exists: a viewer
   * without `order:manage`, or a settled terminal order with no legal action left, gets `null`
   * and no empty slot.
   */
  const showActions = can('order:manage') && hasAnyAction(order);

  return (
    <OrderDetail
      order={order}
      cityName={order.cityId ? (cityById.get(order.cityId)?.name ?? null) : null}
      statusUpdater={
        showActions ? (
          <OrderStatusUpdater order={order} onAction={onAction} disabled={isLoading} />
        ) : null
      }
      onUpdateTracking={onUpdateTracking}
    />
  );
}
