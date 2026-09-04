'use client';

import { useTranslations } from 'next-intl';

import { Card, CardContent } from '@/components/ui';
import { formatNumber } from '@/utils/formatNumber';
import type { OrderView } from '@/types/commerceOrders';

interface OrderItemsCardProps {
  order: OrderView;
}

/** Lines: title, chosen options (colour/size/...), quantity × unit price, line total. */
export function OrderItemsCard({ order }: OrderItemsCardProps) {
  const t = useTranslations('Commerce.Orders');

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <h3 className="text-sm font-semibold">{t('detail.items')}</h3>
        <div className="flex flex-col gap-3">
          {order.lines.map((line) => (
            <div
              key={line.variantId}
              className="flex items-start justify-between gap-3 border-b pb-3 last:border-b-0 last:pb-0"
            >
              <div className="flex items-start gap-3">
                {line.imageUrl ? (
                  <img
                    src={line.imageUrl}
                    alt={line.title}
                    className="size-12 shrink-0 rounded object-cover"
                  />
                ) : (
                  // No image on file for this variant -- a neutral placeholder box, never a
                  // broken <img> with an empty src.
                  <div aria-hidden="true" className="bg-muted size-12 shrink-0 rounded" />
                )}
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{line.title}</span>
                  {line.options.length > 0 && (
                    <span className="text-muted-foreground text-xs">
                      {line.options.map((option) => `${option.name}: ${option.value}`).join('، ')}
                    </span>
                  )}
                  <span className="text-muted-foreground text-xs">
                    {line.quantity} × {formatNumber(line.unitPrice)}
                  </span>
                </div>
              </div>
              <span className="text-sm font-semibold">{formatNumber(line.lineTotal)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
