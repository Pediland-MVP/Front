'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import { formatNumber } from '@/utils/formatNumber';
import { toJalaliDateTime } from '@/utils/jalali';
import type { OrderDetailView } from '@/types/commerceOrders';

import { OrderStatusBadge } from './OrderStatusBadge';
import { ReceiptStrip } from './ReceiptStrip';

interface OrderDetailProps {
  order: OrderDetailView;
  /** Resolved separately from `order.cityId` by `OrderDetailPage` (Task 8) -- this component
   * never looks the id up itself, so its test never has to mock the network. */
  cityName: string | null;
  /** The action bar (approve/reject/etc.) is owned by the page; this component only reserves a
   * slot for it. */
  actions: ReactNode;
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

/**
 * Pure presentation for one order's detail body. No data hooks, no network -- everything it
 * shows comes from `order`, `cityName` and `actions`, which is what lets its test render real
 * fixtures instead of mocking SWR. `OrderDetailPage` (Task 8) is the only caller and owns every
 * side effect (city lookup, action handlers).
 */
export function OrderDetail({ order, cityName, actions }: OrderDetailProps) {
  const t = useTranslations('Commerce.Orders');
  const isDigital = order.kind === 'digital';

  return (
    <div className="flex flex-col gap-6">
      {/* Header: status, when it was placed, the grand total. */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <OrderStatusBadge status={order.status} />
          <span className="text-lg font-semibold">{formatNumber(order.grandTotal)}</span>
        </div>
        <Field label={t('detail.placedAt')} value={toJalaliDateTime(order.placedAt)} />
        {order.status === 'cancelled' && order.cancelReason && (
          <Field
            label={t('detail.cancelledBecause')}
            value={t(`cancelReason.${order.cancelReason}`)}
          />
        )}
      </div>

      {/* Payment: method, confirmation time (or "not confirmed yet"), the receipts sent. */}
      <div className="flex flex-col gap-3 border-t pt-4">
        <h3 className="text-sm font-semibold">{t('detail.payment')}</h3>
        <span className="text-sm">{order.paymentMethod}</span>
        {order.paidAt ? (
          <Field label={t('detail.paidAt')} value={toJalaliDateTime(order.paidAt)} />
        ) : (
          <p className="text-muted-foreground text-sm">{t('detail.notPaid')}</p>
        )}
        <ReceiptStrip receipts={order.receipts} />
      </div>

      {/* Buyer + delivery: recipient/mobile always show; the address block and the shipping
       * method only apply to a physical order -- a digital order has neither. */}
      <div className="flex flex-col gap-3 border-t pt-4">
        <h3 className="text-sm font-semibold">{t('detail.buyer')}</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('detail.recipient')} value={order.recipientName ?? t('card.noName')} />
          <Field label={t('detail.mobile')} value={order.mobile ?? '—'} />
          {!isDigital && (
            <>
              <Field label={t('detail.city')} value={cityName ?? '—'} />
              <Field label={t('detail.address')} value={order.address ?? '—'} />
              {order.plate && <Field label={t('detail.plate')} value={order.plate} />}
              {order.unit && <Field label={t('detail.unit')} value={order.unit} />}
              {order.postalcode && (
                <Field label={t('detail.postalcode')} value={order.postalcode} />
              )}
              {order.shippingTitle && (
                <Field label={t('detail.shippingMethod')} value={order.shippingTitle} />
              )}
            </>
          )}
        </div>
      </div>

      {/* Lines: title, chosen options (colour/size/...), quantity × unit price, line total. */}
      <div className="flex flex-col gap-3 border-t pt-4">
        <h3 className="text-sm font-semibold">{t('detail.items')}</h3>
        <div className="flex flex-col gap-3">
          {order.lines.map((line) => (
            <div
              key={line.variantId}
              className="flex items-start justify-between gap-3 border-b pb-3 last:border-b-0 last:pb-0"
            >
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
              <span className="text-sm font-semibold">{formatNumber(line.lineTotal)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Totals: items, shipping, grand -- the grand total is repeated from the header on
       * purpose, as the last line of the breakdown it summarises. */}
      <div className="flex flex-col gap-2 border-t pt-4 text-sm">
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
      </div>

      {actions && (
        <div className="flex items-center justify-end gap-2 border-t pt-4">{actions}</div>
      )}
    </div>
  );
}
