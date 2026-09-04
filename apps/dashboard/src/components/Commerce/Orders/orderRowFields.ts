import type { OrderView, ViewLine } from '@/types/commerceOrders';

export type KnownPaymentMethod = 'card_to_card' | 'free' | 'cash_on_delivery';

const KNOWN_PAYMENT_METHODS: readonly KnownPaymentMethod[] = [
  'card_to_card',
  'free',
  'cash_on_delivery',
];

export interface OrderRowFields {
  firstLine: ViewLine | undefined;
  /** Distinct lines beyond the one shown -- NOT `itemCount`, which sums quantity. 3x the same
   *  shirt is one line and correctly shows no "+N": the row is not hiding anything. */
  extraLines: number;
  itemCount: number;
  isPaid: boolean;
  isPickup: boolean;
  /**
   * `null` for a value outside `CommercePaymentMethodEnum`. The backend column is a plain
   * `varchar(40)`, not a DB enum, so a row from the legacy backfill can carry anything --
   * callers render `order.paymentMethod` raw in that case rather than letting next-intl print a
   * missing key path like `Commerce.Orders.paymentMethod.zarinpal`.
   */
  paymentMethodKey: KnownPaymentMethod | null;
}

/**
 * Every derived value the orders list shows, computed once from one order.
 *
 * Pure and hook-free on purpose: `OrdersTable` (md+) and `OrderRowCard` (below md) render the
 * SAME order two different ways, and this is what stops the two from drifting apart. It returns
 * translation KEYS, never translated text, so it stays testable without an intl provider.
 */
export function orderRowFields(order: OrderView): OrderRowFields {
  const paymentMethodKey = (KNOWN_PAYMENT_METHODS as readonly string[]).includes(
    order.paymentMethod,
  )
    ? (order.paymentMethod as KnownPaymentMethod)
    : null;

  return {
    firstLine: order.lines[0],
    extraLines: Math.max(0, order.lines.length - 1),
    itemCount: order.lines.reduce((sum, l) => sum + l.quantity, 0),
    isPaid: order.paidAt !== null,
    isPickup: order.shippingKind === 'pickup',
    paymentMethodKey,
  };
}
