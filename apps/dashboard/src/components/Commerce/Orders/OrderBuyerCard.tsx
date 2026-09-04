'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import { Card, CardContent } from '@/components/ui';
import type { OrderView } from '@/types/commerceOrders';

import { orderRowFields } from './orderRowFields';

interface OrderBuyerCardProps {
  order: OrderView;
  /** Resolved separately from `order.cityId` by the caller -- this component never looks the id
   * up itself, so its test never has to mock the network. */
  cityName: string | null;
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
 * Buyer + delivery card: recipient/mobile always show; the address block and the shipping method
 * only apply to a physical, shipped order -- a digital order has neither, and a pickup order gets
 * its own notice instead of the buyer's home address (see the pickup branch below).
 */
export function OrderBuyerCard({ order, cityName }: OrderBuyerCardProps) {
  const t = useTranslations('Commerce.Orders');
  // Reuses the shipping screen's own wording (`kinds.*` / `settlements.*`) so a merchant who set
  // the method up on /products/shipping sees the same words here.
  const tShipping = useTranslations('Commerce.Shipping');
  const isDigital = order.kind === 'digital';
  const { isPickup } = orderRowFields(order);

  /**
   * Same guarded-lookup discipline as `paymentMethodKey` in `orderRowFields.ts`, for the same
   * reason: `shippingKind`/`shippingSettlement` are plain `string | null` on `OrderView`, and
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
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <h3 className="text-sm font-semibold">{t('detail.buyer')}</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('detail.recipient')} value={order.recipientName ?? t('card.noName')} />
          <Field label={t('detail.mobile')} value={order.mobile ?? '—'} />
        </div>
        {isPickup ? (
          /**
           * `pickupAddress` lives ONLY on `commerce_shipping_option` -- the live, mutable merchant
           * config. `commerce_order` freezes `shippingTitle`/`shippingKind`/`shippingSettlement` at
           * promotion but stores NO `shippingOptionId`, so there is no path from an order back to
           * its collection address, not even a live lookup.
           *
           * Rendering the buyer's home address here anyway was actively misleading: for a pickup
           * order it is not a delivery destination, and it sat under a «روش ارسال» heading as
           * though it were one. Saying the collection point is not recorded is worse UX than
           * showing it and better UX than lying. Freezing the address onto the order is tracked as
           * a separate task.
           */
          <>
            <p className="text-sm">{t('pickup.notice')}</p>
            <p className="text-muted-foreground text-sm">{t('pickup.addressUnknown')}</p>
          </>
        ) : (
          !isDigital && (
            <div className="grid grid-cols-2 gap-3">
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
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
