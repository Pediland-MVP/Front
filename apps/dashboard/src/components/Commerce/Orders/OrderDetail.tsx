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
  // Reuses the shipping screen's own wording (`kinds.*` / `settlements.*`) so a merchant who set
  // the method up on /products/shipping sees the same words here.
  const tShipping = useTranslations('Commerce.Shipping');
  const isDigital = order.kind === 'digital';

  /**
   * Backend's `CommercePaymentMethodEnum` has exactly these three values, but the column is
   * `@Column({ length: 40 })` -- a plain varchar, not a DB enum -- so a row brought in by the
   * legacy backfill migration can carry a value outside that set. An explicit switch (not
   * `t(\`paymentMethod.${order.paymentMethod}\`)`) keeps that possible: next-intl would otherwise
   * render the raw key path (e.g. `Commerce.Orders.paymentMethod.zarinpal`) for a missing key.
   * Falling back to the raw string instead is deliberate -- not pretty, but it tells whoever is
   * looking at a migrated legacy order what the value actually is.
   */
  const paymentMethodLabel = (() => {
    switch (order.paymentMethod) {
      case 'card_to_card':
        return t('paymentMethod.card_to_card');
      case 'free':
        return t('paymentMethod.free');
      case 'cash_on_delivery':
        return t('paymentMethod.cash_on_delivery');
      default:
        return order.paymentMethod;
    }
  })();

  /**
   * Same guarded-lookup discipline as `paymentMethodLabel`, for the same reason:
   * `shippingKind`/`shippingSettlement` are plain `string | null` on `OrderView`, and
   * `tShipping(\`kinds.${value}\`)` would print a raw key path for an unrecognised value. Unlike
   * payment method, `null` here means "no shipping method recorded" -- that case is handled by
   * the caller omitting the row entirely (omit, don't dash), so these only need to resolve a
   * present value; an unrecognised present value still falls back to the raw string, same as
   * payment method, rather than being swallowed.
   */
  const shippingKindLabel = order.shippingKind
    ? (() => {
        switch (order.shippingKind) {
          case 'post_express':
            return tShipping('kinds.post_express');
          case 'post_registered':
            return tShipping('kinds.post_registered');
          case 'tipax':
            return tShipping('kinds.tipax');
          case 'courier':
            return tShipping('kinds.courier');
          case 'pickup':
            return tShipping('kinds.pickup');
          case 'other':
            return tShipping('kinds.other');
          default:
            return order.shippingKind;
        }
      })()
    : null;

  const shippingSettlementLabel = order.shippingSettlement
    ? (() => {
        switch (order.shippingSettlement) {
          case 'prepaid':
            return tShipping('settlements.prepaid');
          case 'freight_collect':
            return tShipping('settlements.freight_collect');
          case 'cash_on_delivery':
            return tShipping('settlements.cash_on_delivery');
          default:
            return order.shippingSettlement;
        }
      })()
    : null;

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
        <span className="text-sm">{paymentMethodLabel}</span>
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
              {shippingKindLabel && (
                <Field label={tShipping('kindLabel')} value={shippingKindLabel} />
              )}
              {shippingSettlementLabel && (
                <Field label={tShipping('settlementLabel')} value={shippingSettlementLabel} />
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

      {/* `actions` must be `null` when there is nothing to show -- an `<OrderActions/>` ELEMENT is
          truthy even when the component renders `null`, so a viewer without `order:manage` (or a
          settled, terminal order) used to get an empty bordered strip. `OrderDetailPage` decides,
          via `hasAnyAction` + the permission check, and passes `null` rather than an element.

          Sticky on mobile (spec §7.7): the action bar is the point of this screen and the page is
          long, so on a phone it stays pinned to the bottom of the viewport instead of making the
          seller scroll past every line item to approve. `md:static` hands it back to normal flow
          on a wide screen, where the whole page fits anyway. It needs its own opaque background
          because content now scrolls underneath it. */}
      {actions && (
        <div
          data-testid="order-actions-bar"
          className="bg-background sticky bottom-0 z-10 flex items-center justify-end gap-2 border-t pt-4 pb-3 md:static md:pb-0"
        >
          {actions}
        </div>
      )}
    </div>
  );
}
