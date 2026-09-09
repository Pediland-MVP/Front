import { describe, it, expect } from 'vitest';
import { calculateOrderTotals } from './orderTotals';

const line = (over: Partial<any> = {}) => ({
  id: 'op-1',
  price: 100_000,
  discountPrice: null,
  quantity: 1,
  shippingCost: null,
  attributeValues: [],
  product: { title: 'محصول' },
  ...over,
});

describe('calculateOrderTotals', () => {
  it('totals a single full-price line', () => {
    const t = calculateOrderTotals([line()] as any);
    expect(t.subtotal).toBe(100_000);
    expect(t.shipping).toBe(0);
    expect(t.payable).toBe(100_000);
    expect(t.lines[0].discount).toBe(0);
  });

  it('multiplies by quantity', () => {
    const t = calculateOrderTotals([line({ quantity: 3 })] as any);
    expect(t.lines[0].lineTotal).toBe(300_000);
    expect(t.payable).toBe(300_000);
  });

  it('applies discountPrice per unit, not per line', () => {
    const t = calculateOrderTotals([
      line({ price: 485_000, discountPrice: 450_000, quantity: 2 }),
    ] as any);
    expect(t.lines[0].lineTotal).toBe(970_000);
    expect(t.lines[0].lineAfterDiscount).toBe(900_000);
    expect(t.lines[0].discount).toBe(70_000);
    expect(t.subtotal).toBe(900_000);
  });

  it('sums every line, not just the first — the bug getOrderPrices has', () => {
    const t = calculateOrderTotals([
      line({ price: 485_000, discountPrice: 450_000, quantity: 1 }),
      line({ id: 'op-2', price: 95_000, quantity: 2 }),
    ] as any);
    expect(t.subtotal).toBe(640_000);
  });

  it('treats a null shippingCost as zero and sums the rest', () => {
    const t = calculateOrderTotals([
      line({ shippingCost: 50_000 }),
      line({ id: 'op-2', shippingCost: null }),
    ] as any);
    expect(t.shipping).toBe(50_000);
    expect(t.payable).toBe(250_000);
  });

  it('returns zeroes for an empty order rather than NaN', () => {
    const t = calculateOrderTotals([] as any);
    expect(t).toEqual({ lines: [], subtotal: 0, shipping: 0, payable: 0 });
  });

  it('ignores a discountPrice above the price instead of producing a negative discount', () => {
    const t = calculateOrderTotals([line({ price: 100_000, discountPrice: 120_000 })] as any);
    expect(t.lines[0].discount).toBe(0);
    expect(t.lines[0].lineAfterDiscount).toBe(100_000);
  });
});
