'use client';

import { useTranslations } from 'next-intl';

import { formatNumber } from '@/utils/formatNumber';
import type { OrderView } from '@/types/commerceOrders';

import { OrderStatusBadge } from './OrderStatusBadge';

interface OrderCardProps {
  order: OrderView;
  onOpen: (orderId: string) => void;
}

/**
 * Pure: takes an order, reports a click. The list page owns the data. Rendered as a <button> so
 * it is reachable by keyboard -- a div with onClick is not.
 */
export function OrderCard({ order, onOpen }: OrderCardProps) {
  const t = useTranslations('Commerce.Orders');
  const itemCount = order.lines.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <button
      type="button"
      onClick={() => onOpen(order.orderId)}
      className="hover:bg-muted/50 flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-right"
    >
      <div className="flex flex-col gap-1">
        <span className="font-medium">{order.recipientName ?? t('card.noName')}</span>
        <span className="text-muted-foreground text-xs">
          {t('card.itemCount', { count: itemCount })}
        </span>
      </div>
      <div className="flex flex-col items-end gap-1">
        <OrderStatusBadge status={order.status} />
        <span className="text-sm">{formatNumber(order.grandTotal)}</span>
      </div>
    </button>
  );
}
