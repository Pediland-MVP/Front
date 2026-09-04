'use client';

import { useTranslations } from 'next-intl';

import { Card, CardContent } from '@/components/ui';
import { formatNumber } from '@/utils/formatNumber';
import type { OrderView } from '@/types/commerceOrders';

interface OrderTotalsCardProps {
  order: OrderView;
}

/** Totals: items, shipping, grand -- the grand total is repeated from the header on purpose, as
 * the last line of the breakdown it summarises. */
export function OrderTotalsCard({ order }: OrderTotalsCardProps) {
  const t = useTranslations('Commerce.Orders');

  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{t('detail.itemsTotal')}</span>
          <span>{formatNumber(order.itemsTotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{t('detail.shippingTotal')}</span>
          <span>{formatNumber(order.shippingTotal)}</span>
        </div>
        <div className="flex items-center justify-between font-semibold">
          <span>{t('detail.grandTotal')}</span>
          <span>{formatNumber(order.grandTotal)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
