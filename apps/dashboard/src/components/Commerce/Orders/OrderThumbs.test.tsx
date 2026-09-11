import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import messages from '@/messages/fa.json';
import type { OrderListView } from '@/types/commerceOrders';

import { OrderThumbs } from './OrderThumbs';

const copy = messages.Commerce.Orders;

const base: OrderListView = {
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
      unitPrice: 1000,
      compareAtPrice: null,
      quantity: 1,
      lineTotal: 1000,
    },
  ],
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

const renderThumbs = (order: OrderListView) =>
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <OrderThumbs order={order} />
    </NextIntlClientProvider>,
  );

describe('OrderThumbs', () => {
  it('renders the product image when the first line has one', () => {
    renderThumbs({ ...base, lines: [{ ...base.lines[0], imageUrl: 'https://cdn/p.jpg' }] });
    expect(screen.getByAltText('شال')).toHaveAttribute('src', 'https://cdn/p.jpg');
  });

  it('falls back to an icon tile, never a broken img, with no product image', () => {
    renderThumbs(base);
    expect(screen.queryByAltText('شال')).toBeNull();
  });

  it('renders no receipt thumbnail when there is none', () => {
    renderThumbs(base);
    expect(screen.queryByAltText(copy.receipts.thumbAlt)).toBeNull();
  });

  it('opens the lightbox when the receipt thumbnail is clicked', () => {
    renderThumbs({ ...base, receiptUrl: 'https://cdn/r.jpg', receiptCount: 1 });
    fireEvent.click(screen.getByAltText(copy.receipts.thumbAlt));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not let the receipt click bubble to the row', () => {
    const onRowClick = vi.fn();
    render(
      <NextIntlClientProvider locale="fa" messages={messages}>
        <div onClick={onRowClick}>
          <OrderThumbs order={{ ...base, receiptUrl: 'https://cdn/r.jpg', receiptCount: 1 }} />
        </div>
      </NextIntlClientProvider>,
    );
    fireEvent.click(screen.getByAltText(copy.receipts.thumbAlt));
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('marks a re-upload with the receipt count', () => {
    renderThumbs({ ...base, receiptUrl: 'https://cdn/r.jpg', receiptCount: 3 });
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
