'use client';

import { useTranslations } from 'next-intl';
import { memo } from 'react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatNumber } from '@/utils/formatNumber';
import { toJalaliDate } from '@/utils/jalali';
import type { OrderListView } from '@/types/commerceOrders';

import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderThumbs } from './OrderThumbs';
import { orderRowFields } from './orderRowFields';

interface OrdersTableProps {
  orders: OrderListView[];
  onOpen: (orderId: string) => void;
}

/**
 * The seller's work queue, `md` and up. An order is a row of facts compared ACROSS orders --
 * who, when, how much, paid or not -- and a grid put every fact in a different place on screen.
 *
 * `OrderRowCard` renders the same order below `md`. Both derive every value from
 * `orderRowFields`, which is what stops the two from drifting.
 */
const OrdersTableComponent = ({ orders, onOpen }: OrdersTableProps) => {
  const t = useTranslations('Commerce.Orders');

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('table.product')}</TableHead>
          <TableHead>{t('table.recipient')}</TableHead>
          <TableHead>{t('table.placedAt')}</TableHead>
          <TableHead>{t('table.grandTotal')}</TableHead>
          <TableHead>{t('table.payment')}</TableHead>
          <TableHead>{t('table.status')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => {
          const { firstLine, extraLines, itemCount, isPaid, paymentMethodKey } =
            orderRowFields(order);

          return (
            <TableRow
              key={order.orderId}
              /**
               * `role="button"` + `tabIndex` + a key handler, not a `<button>` wrapper: a
               * `<tr>` cannot contain one and still be a table row. The grid card this replaces
               * was keyboard reachable and that must not regress.
               */
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
              className="hover:bg-muted/50 cursor-pointer"
            >
              <TableCell className="h-auto py-3">
                <div className="flex items-center gap-2">
                  <OrderThumbs order={order} />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-secondary line-clamp-1 text-sm font-medium">
                      {firstLine?.title}
                    </span>
                    {/*
                     * `itemCount` and the `+N` chip were siblings directly inside the `flex-col`
                     * above, so each stacked onto its own line and the intended " · " separator
                     * between them was dropped. RTL's `getByText` matches an element's ENTIRE
                     * text, so the two values cannot share one span -- but nesting each in its
                     * OWN span inside one inline outer span (default `display: inline`) keeps
                     * both individually matchable while reading on the same line, same pattern
                     * `OrderRowCard` already uses for its payment-method/paid-state pair.
                     */}
                    <span className="text-muted-foreground text-xs">
                      <span>{t('card.itemCount', { count: itemCount })}</span>
                      {extraLines > 0 && (
                        <>
                          {' · '}
                          <span>{t('card.more', { count: extraLines })}</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </TableCell>

              {/*
               * `whitespace-nowrap` is `packages/ui`'s `TableCell` default on every cell. Six
               * columns of long Persian labels sum near 768px before padding, so at `md` the
               * table likely overflows sideways -- exactly what the phone/desktop split exists to
               * avoid. Overridden per-cell here (not in `packages/ui`, which is shared) only on
               * گیرنده and پرداخت, the two text-heavy columns: a wrapped date or amount reads
               * worse than a slightly taller row, but a wrapped name or payment label does not.
               */}
              <TableCell className="h-auto py-3 whitespace-normal">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm">{order.recipientName ?? t('card.noName')}</span>
                  {order.mobile && (
                    <span className="text-muted-foreground text-xs">{order.mobile}</span>
                  )}
                </div>
              </TableCell>

              <TableCell className="text-muted-foreground h-auto py-3 text-xs whitespace-nowrap">
                {toJalaliDate(order.placedAt)}
              </TableCell>

              <TableCell className="h-auto py-3 whitespace-nowrap">
                <span className="text-sm font-semibold">{formatNumber(order.grandTotal)}</span>{' '}
                <span className="text-muted-foreground text-xs">{t('card.tooman')}</span>
              </TableCell>

              <TableCell className="h-auto py-3 whitespace-normal">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs">
                    {paymentMethodKey
                      ? t(`paymentMethod.${paymentMethodKey}`)
                      : order.paymentMethod}
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
                </div>
              </TableCell>

              <TableCell className="h-auto py-3">
                <OrderStatusBadge status={order.status} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export const OrdersTable = memo(OrdersTableComponent);
