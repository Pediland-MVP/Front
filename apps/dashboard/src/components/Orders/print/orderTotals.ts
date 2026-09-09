import type { OrderNamespace } from '@/types/order/order.namespace';

type OrderProducts = OrderNamespace.GET.OneItemOfOrders['orderProducts'];

export interface OrderLineTotal {
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  discount: number;
  lineAfterDiscount: number;
}

export interface OrderTotals {
  lines: OrderLineTotal[];
  subtotal: number;
  shipping: number;
  payable: number;
}

/**
 * Totals across EVERY line of the order.
 *
 * `getOrderPrices` in `@/utils/getOrderPrices` only ever reads `orderProducts[0]`, so a
 * two-item order reports the wrong figure there. That helper is left alone — the order
 * card and the details header still use it — and the invoice uses this instead.
 */
export function calculateOrderTotals(orderProducts: OrderProducts): OrderTotals {
  const lines: OrderLineTotal[] = (orderProducts ?? []).map((op) => {
    const unitPrice = op.price ?? 0;
    const quantity = op.quantity ?? 0;
    const lineTotal = unitPrice * quantity;

    // A discountPrice at or above the price is not a discount. Trusting it blindly
    // would print a negative تخفیف on the invoice.
    const discountedUnit =
      typeof op.discountPrice === 'number' && op.discountPrice < unitPrice
        ? op.discountPrice
        : unitPrice;

    const lineAfterDiscount = discountedUnit * quantity;

    return {
      unitPrice,
      quantity,
      lineTotal,
      discount: lineTotal - lineAfterDiscount,
      lineAfterDiscount,
    };
  });

  const subtotal = lines.reduce((sum, l) => sum + l.lineAfterDiscount, 0);
  const shipping = (orderProducts ?? []).reduce((sum, op) => sum + (op.shippingCost ?? 0), 0);

  return { lines, subtotal, shipping, payable: subtotal + shipping };
}
