'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import { Card, CardContent } from '@/components/ui';
import { formatNumber } from '@/utils/formatNumber';
import { toJalaliDateTime } from '@/utils/jalali';
import type { OrderDetailView } from '@/types/commerceOrders';

import { OrderStatusBadge } from './OrderStatusBadge';
import { ReceiptStrip } from './ReceiptStrip';
import { orderRowFields } from './orderRowFields';

interface OrderSummaryRailProps {
  order: OrderDetailView;
  /** The status control, injected so this component stays pure and its test needs no
   *  permissions mock -- same reason `OrderDetail` has always taken `actions` as a node. */
  statusUpdater: ReactNode;
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
export function OrderSummaryRail({ order, statusUpdater }: OrderSummaryRailProps) {
  const t = useTranslations('Commerce.Orders');
  const { isPaid, paymentMethodKey } = orderRowFields(order);

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

        {statusUpdater && <div className="border-t pt-3">{statusUpdater}</div>}
      </CardContent>
    </Card>
  );
}
