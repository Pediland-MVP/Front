'use client';

import { FileDigitIcon, PackageIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { memo } from 'react';

import { Card, CardContent } from '@/components/ui';
import { formatNumber } from '@/utils/formatNumber';
import { toJalaliDate } from '@/utils/jalali';
import type { OrderView } from '@/types/commerceOrders';

import { OrderStatusBadge } from './OrderStatusBadge';

interface OrderCardProps {
  order: OrderView;
  onOpen: (orderId: string) => void;
}

/**
 * Pure: takes an order, reports a click. The list page owns the data.
 *
 * Rendered as a `<button>` wrapping the `Card` rather than a `div` with `onClick` -- a div is not
 * reachable by keyboard, and that was true of the flat version this replaces too. `text-right` is
 * kept because a button resets text alignment to centre, which would undo the RTL layout inside.
 *
 * Skin (`border-violet-200 shadow-violet-200`, 4:3 media, `p-0` content) is deliberately the same
 * as `CommerceProductCard`: these two grids sit one click apart under /products and previously
 * looked like they came from different apps.
 */
const OrderCardComponent = ({ order, onOpen }: OrderCardProps) => {
  const t = useTranslations('Commerce.Orders');

  const itemCount = order.lines.reduce((sum, line) => sum + line.quantity, 0);
  const [firstLine] = order.lines;
  // Distinct products beyond the one shown -- not `itemCount`, which counts quantity. An order of
  // 3x the same shirt shows one title and no "+N"; that is correct, the card is not hiding a line.
  const extraLines = Math.max(0, order.lines.length - 1);
  const TypeIcon = order.kind === 'physical' ? PackageIcon : FileDigitIcon;

  return (
    <button type="button" onClick={() => onOpen(order.orderId)} className="w-full text-right">
      <Card className="gap-0 overflow-hidden border-violet-200 p-0 shadow-violet-200 transition-shadow hover:shadow-md">
        <CardContent className="p-0">
          <div className="relative aspect-[4/3] w-full bg-gray-100">
            {firstLine?.imageUrl ? (
              // Plain <img>, matching `CommerceProductCard`. `CardImage`/next-image is not used
              // here for the same reason it is not used there: these URLs are remote R2 links and
              // the grid renders up to 21 of them.
              <img
                src={firstLine.imageUrl}
                alt={firstLine.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-100">
                <TypeIcon className="size-10 text-gray-300" />
              </div>
            )}

            {/* Status sits on the media, in the slot `CommerceProductCard` uses for its stock
                warning, so it can be scanned straight down the grid without reading any body
                text. `start-2` (not `left-2`) so it follows the RTL flip. */}
            <OrderStatusBadge status={order.status} className="absolute start-2 top-2 shadow-sm" />
          </div>

          <div className="space-y-1.5 p-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="text-secondary line-clamp-1 text-[15px] font-semibold">
                {firstLine?.title}
              </div>
              {extraLines > 0 && (
                <span className="shrink-0 rounded-full border border-gray-200/60 bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                  {t('card.more', { count: extraLines })}
                </span>
              )}
            </div>

            <div className="text-secondary line-clamp-1 text-[13px]">
              {order.recipientName ?? t('card.noName')}
            </div>

            {/* The list is date-sorted, so the placed date is the field the seller scans down when
                looking for "the one from Tuesday" (spec §6). */}
            <div className="text-muted-foreground text-[12px]">
              {toJalaliDate(order.placedAt)} · {t('card.itemCount', { count: itemCount })}
            </div>

            {/* Amount and unit are separate spans, not one interpolated string: the amount is the
                only ASCII-digit token on an otherwise Persian card, and keeping it in its own
                node is what lets it be asserted (and, later, styled) on its own. */}
            <div className="text-primary text-[14px] font-semibold">
              <span>{formatNumber(order.grandTotal)}</span>{' '}
              <span className="text-[12px] font-medium">{t('card.tooman')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  );
};

export const OrderCard = memo(OrderCardComponent);
