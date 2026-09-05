'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import { Card, CardContent } from '@/components/ui';
import { usePermissions } from '@/hooks/usePermissions';
import { formatNumber } from '@/utils/formatNumber';
import { toJalaliDateTime } from '@/utils/jalali';
import type { OrderDetailView } from '@/types/commerceOrders';

import { EditTrackingDialog } from './dialogs/EditTrackingDialog';
import { OrderStatusBadge } from './OrderStatusBadge';
import { ReceiptStrip } from './ReceiptStrip';
import { orderRowFields } from './orderRowFields';

// The safe fallback for `onUpdateTracking` when a caller doesn't wire a real write path (every
// test in this file except the tracking-row describe block, and both of `OrderDetail.test.tsx`'s
// render sites). Module-scoped so it is one stable function, not a fresh closure per render.
const noopUpdateTracking = async () => false;

interface OrderSummaryRailProps {
  order: OrderDetailView;
  /** The status control, injected so this component stays pure and its test needs no
   *  permissions mock -- same reason `OrderDetail` has always taken `actions` as a node. */
  statusUpdater: ReactNode;
  /** Wired by `OrderDetailPage` to `useCommerceOrder`'s `updateTracking`, with the same
   *  error/toast handling `onAction` uses. Optional, defaulting to a no-op, so every existing
   *  test here -- and `OrderDetail.test.tsx`'s two render sites -- can keep rendering this
   *  component without wiring a real write path. */
  onUpdateTracking?: (trackingUrl: string, notify: boolean) => Promise<boolean>;
}

/**
 * Everything needed to DECIDE, and nothing else.
 *
 * The flat page this replaces ordered its sections the way the data was written, which put the
 * action buttons at the very bottom: approving a payment meant scrolling past the address and
 * every line item first. Here the decision is one block -- what state, how much, paid or not,
 * the receipt to judge, and the control to act -- pinned on desktop and stacked FIRST on a
 * phone.
 */
export function OrderSummaryRail({
  order,
  statusUpdater,
  onUpdateTracking,
}: OrderSummaryRailProps) {
  const t = useTranslations('Commerce.Orders');
  const { can } = usePermissions();
  const { isPaid, paymentMethodKey } = orderRowFields(order);
  const [trackingOpen, setTrackingOpen] = useState(false);

  // A parcel exists only once the order has shipped, AND only when it was ever going to be
  // posted at all -- a پیکاپ order is "ready to collect", not "in transit", and has no carrier
  // link to show or edit.
  const hasParcel =
    (order.status === 'sending' || order.status === 'completed') && order.shippingKind !== 'pickup';

  return (
    <Card className="lg:sticky lg:top-4">
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <OrderStatusBadge status={order.status} />
          <span className="text-lg font-semibold">
            {/* The amount gets its OWN span. React Testing Library's `getByText` matches an
                element's ENTIRE text, so a bare `{formatNumber(...)}` glued next to a nested
                <span> leaves no element whose text is just the amount -- the assertion below
                cannot match it. Both spans stay inline (the parent is a <span>, an inline
                formatting context), so this changes nothing visually. */}
            <span>{formatNumber(order.grandTotal)}</span>{' '}
            <span className="text-muted-foreground text-xs font-medium">{t('card.tooman')}</span>
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground text-xs">{t('detail.placedAt')}</span>
          <span className="text-sm">{toJalaliDateTime(order.placedAt)}</span>
        </div>

        {order.status === 'cancelled' && order.cancelReason && (
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground text-xs">{t('detail.cancelledBecause')}</span>
            <span className="text-sm">{t(`cancelReason.${order.cancelReason}`)}</span>
          </div>
        )}

        <div className="flex flex-col gap-1 border-t pt-3">
          <span className="text-sm">
            {paymentMethodKey ? t(`paymentMethod.${paymentMethodKey}`) : order.paymentMethod}
          </span>
          <span
            className={
              isPaid
                ? 'text-xs text-green-700 dark:text-green-400'
                : 'text-muted-foreground text-xs'
            }
          >
            {isPaid ? t('payment.paid') : t('payment.unpaid')}
          </span>
          {order.paidAt && (
            <span className="text-muted-foreground text-xs">{toJalaliDateTime(order.paidAt)}</span>
          )}
          <ReceiptStrip receipts={order.receipts} />
        </div>

        {hasParcel && (
          <div className="flex items-center justify-between gap-2 border-t pt-3">
            <span className="text-muted-foreground text-xs">{t('detail.trackingLabel')}</span>
            <div className="flex items-center gap-2">
              {order.trackingUrl ? (
                <a
                  data-testid="tracking-link"
                  href={order.trackingUrl}
                  target="_blank"
                  // The url is merchant-supplied and opens in a new tab -- without
                  // noopener/noreferrer the opened page gets a `window.opener` handle back into
                  // this dashboard.
                  rel="noopener noreferrer"
                  dir="ltr"
                  className="text-primary max-w-[140px] truncate text-xs underline"
                >
                  {order.trackingUrl}
                </a>
              ) : (
                <span className="text-muted-foreground text-xs">{t('detail.trackingNone')}</span>
              )}
              {can('order:manage') && (
                <button
                  type="button"
                  data-testid="tracking-edit"
                  onClick={() => setTrackingOpen(true)}
                  className="text-primary shrink-0 text-xs underline"
                >
                  {order.trackingUrl ? t('detail.trackingEdit') : t('detail.trackingAdd')}
                </button>
              )}
            </div>
          </div>
        )}

        {statusUpdater && (
          <div data-testid="status-updater-slot" className="border-t pt-3">
            {statusUpdater}
          </div>
        )}
      </CardContent>

      {hasParcel && (
        <EditTrackingDialog
          open={trackingOpen}
          onOpenChange={setTrackingOpen}
          current={order.trackingUrl ?? null}
          onConfirm={onUpdateTracking ?? noopUpdateTracking}
        />
      )}
    </Card>
  );
}
