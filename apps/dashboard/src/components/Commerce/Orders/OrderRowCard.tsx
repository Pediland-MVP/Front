'use client';

import { useTranslations } from 'next-intl';
import { memo } from 'react';

import { Card, CardContent } from '@/components/ui';
import { formatNumber } from '@/utils/formatNumber';
import { toJalaliDate } from '@/utils/jalali';
import type { OrderListView } from '@/types/commerceOrders';

import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderThumbs } from './OrderThumbs';
import { orderRowFields } from './orderRowFields';

interface OrderRowCardProps {
  order: OrderListView;
  onOpen: (orderId: string) => void;
}

/**
 * The same order as `OrdersTable`, below `md`.
 *
 * A six-column table does not fit a phone, and the two usual escapes both cost the seller
 * something: horizontal scroll hides the status they are looking for behind a sideways drag, and
 * dropping columns loses the paid/unpaid signal and the date the list is sorted by. This keeps
 * every fact and rearranges it instead.
 *
 * `role="button"` on a div rather than a real `<button>` wrapper: `OrderThumbs` renders its own
 * button for the receipt, and a `<button>` inside a `<button>` is invalid HTML -- the parser
 * auto-closes the outer one, so the markup a browser builds is not the markup written. Same
 * pattern `OrdersTable` uses for its `<tr>`, and it keeps the row keyboard reachable.
 */
const OrderRowCardComponent = ({ order, onOpen }: OrderRowCardProps) => {
  const t = useTranslations('Commerce.Orders');
  const { firstLine, extraLines, isPaid, paymentMethodKey } = orderRowFields(order);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={t('table.openOrder')}
      onClick={() => onOpen(order.orderId)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen(order.orderId);
        }
      }}
      className="w-full cursor-pointer text-right"
    >
      <Card className="gap-0 p-0 transition-shadow hover:shadow-md">
        <CardContent className="flex items-start gap-3 p-3">
          <OrderThumbs order={order} />

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-start justify-between gap-2">
              {/*
               * `card.itemCount`/`+N` sibling issue from `OrdersTable`: RTL's `getByText` matches
               * an element's ENTIRE text, so the title and the "+N" chip cannot share one span --
               * but a `flex-col` parent around two such spans stacks them onto separate lines and
               * silently drops the intended " " separator. Here both live in ONE inline `<span>`
               * (default `display: inline`), with the chip as a nested `<span>`: each is still its
               * own text node for `getByText`, and they read on the same line because neither
               * sibling forces a line break.
               */}
              <span className="text-secondary line-clamp-1 text-sm font-semibold">
                {firstLine?.title}
                {extraLines > 0 && (
                  <span className="text-muted-foreground text-xs">
                    {' '}
                    {t('card.more', { count: extraLines })}
                  </span>
                )}
              </span>
              <OrderStatusBadge status={order.status} className="shrink-0" />
            </div>

            <span className="text-secondary text-[13px]">
              {order.recipientName ?? t('card.noName')}
            </span>
            {order.mobile && <span className="text-muted-foreground text-xs">{order.mobile}</span>}

            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground text-xs">{toJalaliDate(order.placedAt)}</span>
              <span className="text-primary text-sm font-semibold">
                {formatNumber(order.grandTotal)}{' '}
                <span className="text-xs font-medium">{t('card.tooman')}</span>
              </span>
            </div>

            {/*
             * Same inline-but-separately-matchable shape as the title/"+N" span above, applied
             * to the payment method and the paid/unpaid text: RTL's `getNodeText` only reads an
             * element's OWN direct text-node children, so concatenating both pieces into one
             * span's text (with " · " glued on) breaks `getByText('zarinpal')` -- the span's own
             * text becomes "zarinpal · " (approx), not the exact string. Wrapping each piece in
             * its own nested `<span>` keeps them individually matchable while the outer span's
             * inline layout (no `flex`) keeps them reading on one line.
             */}
            <span className="text-muted-foreground text-xs">
              <span>
                {paymentMethodKey ? t(`paymentMethod.${paymentMethodKey}`) : order.paymentMethod}
              </span>
              {' · '}
              <span className={isPaid ? 'text-green-700 dark:text-green-400' : undefined}>
                {isPaid ? t('payment.paid') : t('payment.unpaid')}
              </span>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const OrderRowCard = memo(OrderRowCardComponent);
