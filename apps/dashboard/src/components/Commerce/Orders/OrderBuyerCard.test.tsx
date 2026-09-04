import type { ReactNode } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import messages from '@/messages/fa.json';
import type { OrderView } from '@/types/commerceOrders';

import { OrderBuyerCard } from './OrderBuyerCard';

const copy = messages.Commerce.Orders;

// Copied from OrderDetail.test.tsx's `base` fixture rather than imported across test files, minus
// the `receipts` field that only `OrderDetailView` carries -- `OrderBuyerCard` takes `OrderView`.
const physicalOrder: OrderView = {
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
  shippingTitle: 'ارسال ویژه',
  shippingKind: 'post_express',
  shippingSettlement: 'prepaid',
  paidAt: null,
  createDate: '2026-09-02T10:00:00.000Z',
};

const wrap = (children: ReactNode) => (
  <NextIntlClientProvider locale="fa" messages={messages}>
    {children}
  </NextIntlClientProvider>
);

describe('OrderBuyerCard', () => {
  it('shows the address block for a physical order', () => {
    render(wrap(<OrderBuyerCard order={physicalOrder} cityName="تهران" />));
    expect(screen.getByText('تهران')).toBeInTheDocument();
    expect(screen.getByText('خیابان ولیعصر')).toBeInTheDocument();
  });

  it('omits the address block for a digital order, which has none', () => {
    render(wrap(<OrderBuyerCard order={{ ...physicalOrder, kind: 'digital' }} cityName="تهران" />));
    expect(screen.queryByText('خیابان ولیعصر')).toBeNull();
  });

  it('falls back to the raw value for an unrecognised shipping kind', () => {
    render(
      wrap(<OrderBuyerCard order={{ ...physicalOrder, shippingKind: 'drone' }} cityName={null} />),
    );
    expect(screen.getByText('drone')).toBeInTheDocument();
  });

  it('does not present the buyer address as a delivery address on a pickup order', () => {
    render(
      wrap(
        <OrderBuyerCard order={{ ...physicalOrder, shippingKind: 'pickup' }} cityName="تهران" />,
      ),
    );
    expect(screen.getByText(copy.pickup.notice)).toBeInTheDocument();
    expect(screen.getByText(copy.pickup.addressUnknown)).toBeInTheDocument();
    expect(screen.queryByText('خیابان ولیعصر')).toBeNull();
  });
});
