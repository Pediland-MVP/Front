import { describe, it, expect } from 'vitest';

import type { OrderListView } from '@/types/commerceOrders';

import { orderRowFields } from './orderRowFields';

const line = (over: Partial<OrderListView['lines'][number]> = {}) => ({
  variantId: 'v1',
  productId: 'p1',
  title: 'شال',
  options: [],
  imageUrl: null,
  unitPrice: 1000,
  compareAtPrice: null,
  quantity: 1,
  lineTotal: 1000,
  ...over,
});

const base: OrderListView = {
  orderId: 'o1',
  status: 'awaiting_review',
  cancelReason: null,
  kind: 'physical',
  lines: [line()],
  itemsTotal: 1000,
  shippingTotal: 0,
  grandTotal: 1000,
  paymentMethod: 'card_to_card',
  recipientName: 'علی',
  mobile: '09120000000',
  cityId: 1,
  address: 'خیابان',
  plate: null,
  unit: null,
  postalcode: null,
  placedAt: '2026-09-02T10:00:00.000Z',
  shippingTitle: null,
  shippingKind: null,
  shippingSettlement: null,
  paidAt: null,
  createDate: '2026-09-02T10:00:00.000Z',
  receiptUrl: null,
  receiptCount: 0,
};

describe('orderRowFields', () => {
  it('counts quantity for itemCount but distinct lines for extraLines', () => {
    const f = orderRowFields({ ...base, lines: [line({ quantity: 3 })] });
    expect(f.itemCount).toBe(3);
    expect(f.extraLines).toBe(0);
  });

  it('extraLines is distinct lines beyond the first', () => {
    const f = orderRowFields({
      ...base,
      lines: [line(), line({ variantId: 'v2' }), line({ variantId: 'v3' })],
    });
    expect(f.extraLines).toBe(2);
    expect(f.firstLine?.variantId).toBe('v1');
  });

  it('is paid only when paidAt is set', () => {
    expect(orderRowFields(base).isPaid).toBe(false);
    expect(orderRowFields({ ...base, paidAt: '2026-09-03T00:00:00Z' }).isPaid).toBe(true);
  });

  it('recognises the three known payment methods and nulls anything else', () => {
    expect(orderRowFields(base).paymentMethodKey).toBe('card_to_card');
    expect(orderRowFields({ ...base, paymentMethod: 'free' }).paymentMethodKey).toBe('free');
    expect(orderRowFields({ ...base, paymentMethod: 'zarinpal' }).paymentMethodKey).toBeNull();
  });

  it('flags a pickup order', () => {
    expect(orderRowFields(base).isPickup).toBe(false);
    expect(orderRowFields({ ...base, shippingKind: 'pickup' }).isPickup).toBe(true);
  });

  it('survives an order with no lines', () => {
    const f = orderRowFields({ ...base, lines: [] });
    expect(f.firstLine).toBeUndefined();
    expect(f.itemCount).toBe(0);
    expect(f.extraLines).toBe(0);
  });
});
