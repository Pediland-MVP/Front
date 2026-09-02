import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import messages from '@/messages/fa.json';
import type { OrderDetailView } from '@/types/commerceOrders';

import { OrderDetail } from './OrderDetail';

const copy = messages.Commerce.Orders;

// Copied from OrderCard.test.tsx's `base` fixture rather than imported across test files (per
// the task brief) -- extended here with the `receipts` field OrderDetailView adds.
const base: OrderDetailView = {
  orderId: 'o1',
  status: 'awaiting_review',
  cancelReason: null,
  kind: 'physical',
  lines: [
    {
      variantId: 'v1',
      productId: 'p1',
      title: 'شال',
      options: [],
      imageUrl: null,
      unitPrice: 120000,
      compareAtPrice: null,
      quantity: 2,
      lineTotal: 240000,
    },
  ],
  itemsTotal: 240000,
  shippingTotal: 0,
  grandTotal: 240000,
  paymentMethod: 'card_to_card',
  recipientName: 'علی رضایی',
  mobile: '09120000000',
  cityId: 10,
  address: 'خیابان ولیعصر',
  plate: '12',
  unit: '3',
  postalcode: null,
  placedAt: '2026-09-02T10:00:00.000Z',
  shippingTitle: 'پست پیشتاز',
  shippingKind: 'post',
  shippingSettlement: 'prepaid',
  paidAt: null,
  createDate: '2026-09-02T10:00:00.000Z',
  receipts: [],
};

const renderDetail = (order: OrderDetailView, cityName: string | null) => {
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <OrderDetail order={order} cityName={cityName} actions={null} />
    </NextIntlClientProvider>,
  );
};

describe('OrderDetail', () => {
  it('shows the city name it was handed rather than the raw id', () => {
    renderDetail({ ...base, receipts: [] }, 'تهران');
    expect(screen.getByText('تهران')).toBeInTheDocument();
    expect(screen.queryByText('10')).not.toBeInTheDocument();
  });

  it('omits shipping and address entirely for a digital order', () => {
    renderDetail(
      { ...base, kind: 'digital', address: null, shippingTitle: null, receipts: [] },
      null,
    );
    expect(screen.queryByText(copy.detail.address)).not.toBeInTheDocument();
    expect(screen.queryByText(copy.detail.shippingMethod)).not.toBeInTheDocument();
  });

  it('says the payment is not yet confirmed when paidAt is null', () => {
    renderDetail({ ...base, paidAt: null, receipts: [] }, null);
    expect(screen.getByText(copy.detail.notPaid)).toBeInTheDocument();
  });

  it.each([['payment_rejected'], ['delivery_refused'], ['superseded'], ['legacy_cancelled']])(
    'renders the %s cancel reason in words',
    (reason) => {
      renderDetail(
        { ...base, status: 'cancelled', cancelReason: reason as never, receipts: [] },
        null,
      );
      expect(
        screen.getByText(copy.cancelReason[reason as keyof typeof copy.cancelReason]),
      ).toBeInTheDocument();
    },
  );

  it('renders each line with its options and line total', () => {
    renderDetail(
      {
        ...base,
        lines: [{ ...base.lines[0], options: [{ name: 'رنگ', value: 'آبی' }] }],
        receipts: [],
      },
      null,
    );
    expect(screen.getByText('شال')).toBeInTheDocument();
    expect(screen.getByText(/رنگ/)).toBeInTheDocument();
  });
});
