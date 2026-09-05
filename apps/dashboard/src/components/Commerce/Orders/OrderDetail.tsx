'use client';

import type { ReactNode } from 'react';

import type { OrderDetailView } from '@/types/commerceOrders';

import { OrderBuyerCard } from './OrderBuyerCard';
import { OrderItemsCard } from './OrderItemsCard';
import { OrderSummaryRail } from './OrderSummaryRail';
import { OrderTotalsCard } from './OrderTotalsCard';

interface OrderDetailProps {
  order: OrderDetailView;
  /** Resolved separately from `order.cityId` by `OrderDetailPage` -- this component never looks
   * the id up itself, so its test never has to mock the network. */
  cityName: string | null;
  /** The status control. `null` for a viewer without `order:manage`. */
  statusUpdater: ReactNode;
  /** Forwarded straight through to `OrderSummaryRail` -- see its own prop docstring for why this
   *  is optional. */
  onUpdateTracking?: (trackingUrl: string, notify: boolean) => Promise<boolean>;
}

/**
 * Layout only -- every card below owns its own content.
 *
 * `lg:grid-cols-[1fr_320px]` with the rail declared FIRST in the DOM and pushed to the second
 * column by `lg:order-2`. Source order is what a phone and a screen reader follow, and the whole
 * point of this screen is that the decision comes first; visual order is what a desktop follows,
 * and there the rail belongs beside the detail, not above it. `lg:items-start` on the grid keeps
 * the sticky rail from being stretched to the detail column's height, which would leave it no
 * room to move as the page scrolls.
 */
export function OrderDetail({
  order,
  cityName,
  statusUpdater,
  onUpdateTracking,
}: OrderDetailProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px] lg:items-start">
      <div className="lg:order-2">
        <OrderSummaryRail
          order={order}
          statusUpdater={statusUpdater}
          onUpdateTracking={onUpdateTracking}
        />
      </div>

      <div className="flex flex-col gap-4 lg:order-1">
        <OrderBuyerCard order={order} cityName={cityName} />
        <OrderItemsCard order={order} />
        <OrderTotalsCard order={order} />
      </div>
    </div>
  );
}
