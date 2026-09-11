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
   * `null` for a value outside `CommercePaymentMethodEnum`. Backend's enum has exactly the three
   * `KNOWN_PAYMENT_METHODS` values, but the column is `@Column({ length: 40 })` -- a plain
   * `varchar(40)`, not a DB enum -- so a row brought in by the legacy backfill migration can carry
   * a value outside that set. Checking membership here (not `t(\`paymentMethod.${value}\`)` at the
   * call site) keeps that possible: next-intl would otherwise render the raw key path (e.g.
   * `Commerce.Orders.paymentMethod.zarinpal`) as visible UI text for a missing key. Callers render
   * `order.paymentMethod` raw when this is `null` instead -- not pretty, but it tells whoever is
   * looking at a migrated legacy order what the value actually is. `OrderSummaryRail`,
   * `OrdersTable` and `OrderRowCard` all branch on it this way.
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
