'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { PrinterIcon } from 'lucide-react';

import { Button } from '@/components/ui';
import type { OrderDetailView } from '@/types/commerceOrders';
import { toJalaliDateTime } from '@/utils/jalali';

import { OrderBuyerCard } from './OrderBuyerCard';
import { OrderItemsCard } from './OrderItemsCard';
import { OrderSummaryRail } from './OrderSummaryRail';
import { OrderTotalsCard } from './OrderTotalsCard';
import { buildInvoiceDocument } from './print/buildInvoiceDocument';
import { buildLabelDocument, type PrintLabels } from './print/buildLabelDocument';
import { printDocument } from './print/printDocument';

interface OrderDetailProps {
  order: OrderDetailView;
  /** Resolved separately from `order.cityId` by `OrderDetailPage` -- this component never looks
   * the id up itself, so its test never has to mock the network. */
  cityName: string | null;
  /** Resolved separately from `order.cityId` (via the city's own `provinceId`) by
   *  `OrderDetailPage`, same reason as `cityName` -- this component never looks it up itself.
   *  Only used by the print label/invoice below (buyer address block). */
  provinceName: string | null;
  /** The status control. `null` for a viewer without `order:manage`. */
  statusUpdater: ReactNode;
  /** Forwarded straight through to `OrderSummaryRail` -- see its own prop docstring for why this
   *  is optional. */
  onUpdateTracking?: (followUpCode: string, notify: boolean) => Promise<boolean>;
}

/**
 * Layout only -- every card below owns its own content. The print row above the grid is the one
 * exception (Task 8): it is a document action, not a card, so it does not belong inside either
 * column.
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
  provinceName,
  statusUpdater,
  onUpdateTracking,
}: OrderDetailProps) {
  const t = useTranslations('Commerce.Orders');

  // A digital order has no shipping -- there is nothing to put on a parcel label. Same guard
  // shape as `OrderBuyerCard`'s `isDigital` (the address/shipping block there is hidden for the
  // same reason this button is disabled here).
  const isDigital = order.kind !== 'physical';

  // `Commerce.Orders.Print` is Task 7's own, already-fully-populated flat namespace (built as a
  // literal `{ [key: string]: string }` deliberately, so the builders below stay free of
  // next-intl). `t.raw()` pulls the whole subtree as a plain object in one call instead of
  // hand-listing every one of its ~30 keys here. `paymentMethod_*` are the three EXTRA flat keys
  // `buildInvoiceDocument` expects (see its own docstring): it reuses `Commerce.Orders.paymentMethod.*`,
  // the same copy the orders list/table already shows, rather than duplicating that wording under
  // `Print`.
  const printLabels: PrintLabels = {
    ...(t.raw('Print') as Record<string, string>),
    paymentMethod_card_to_card: t('paymentMethod.card_to_card'),
    paymentMethod_free: t('paymentMethod.free'),
    paymentMethod_cash_on_delivery: t('paymentMethod.cash_on_delivery'),
  };

  const printLabel = () =>
    printDocument(buildLabelDocument(order, printLabels, cityName, provinceName));

  const printInvoice = () =>
    printDocument(
      buildInvoiceDocument(
        order,
        printLabels,
        toJalaliDateTime(order.createDate),
        cityName,
        provinceName,
      ),
    );

  return (
    <div className="flex flex-col gap-4">
      {/*
        A document action, not a status decision -- deliberately its own row above the grid
        rather than inside `OrderSummaryRail` (see that component's own docstring: "everything
        needed to DECIDE, and nothing else"). No `can('order:manage')`/`can('order:view')` gate
        here: the order detail page is already unreachable without `order:view` (the API is the
        enforcement point -- `OrdersListPage` renders no client-side gate either, see its own
        comment), and a redundant check here was a real mistake made once already and had to be
        removed in review.
      */}
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isDigital}
          title={isDigital ? t('detail.printLabelDigitalDisabled') : undefined}
          onClick={() => void printLabel()}
        >
          <PrinterIcon />
          {t('detail.printLabel')}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => void printInvoice()}>
          <PrinterIcon />
          {t('detail.printInvoice')}
        </Button>
      </div>

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
    </div>
  );
}
