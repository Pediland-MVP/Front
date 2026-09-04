import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import messages from '@/messages/fa.json';
import type { OrderListView } from '@/types/commerceOrders';

import { OrderRowCard } from './OrderRowCard';

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

const renderRow = (order: OrderListView, onOpen = vi.fn()) => {
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <OrderRowCard order={order} onOpen={onOpen} />
    </NextIntlClientProvider>,
  );
  return onOpen;
};

describe('OrderRowCard', () => {
  it('shows every fact the table shows, so the phone loses nothing', () => {
    renderRow({ ...base, paidAt: null });
    expect(screen.getByText('شال')).toBeInTheDocument();
    expect(screen.getByText('علی')).toBeInTheDocument();
    expect(screen.getByText('09120000000')).toBeInTheDocument();
    expect(screen.getByText(copy.payment.unpaid)).toBeInTheDocument();
    expect(screen.getByText(copy.status.awaiting_review)).toBeInTheDocument();
  });

  it('opens the order when tapped', () => {
    const onOpen = renderRow(base);
    fireEvent.click(screen.getByRole('button', { name: copy.table.openOrder }));
    expect(onOpen).toHaveBeenCalledWith('o1');
  });

  it('shows the placeholder name when the order has no recipient', () => {
    renderRow({ ...base, recipientName: null });
    expect(screen.getByText(copy.card.noName)).toBeInTheDocument();
  });

  it('falls back to the raw payment method for an unrecognised value', () => {
    renderRow({ ...base, paymentMethod: 'zarinpal' });
    expect(screen.getByText('zarinpal')).toBeInTheDocument();
  });
});
