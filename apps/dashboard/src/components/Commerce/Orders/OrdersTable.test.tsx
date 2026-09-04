import { describe, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import messages from '@/messages/fa.json';
import type { OrderListView } from '@/types/commerceOrders';

import { OrdersTable } from './OrdersTable';

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

const renderTable = (orders: OrderListView[], onOpen = vi.fn()) => {
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <OrdersTable orders={orders} onOpen={onOpen} />
    </NextIntlClientProvider>,
  );
  return onOpen;
};

describe('OrdersTable', () => {
  it('renders all six column headers', () => {
    renderTable([base]);
    // Named explicitly rather than sliced off `copy.table`, so reordering the JSON keys
    // cannot silently change what this asserts.
    for (const header of [
      copy.table.product,
      copy.table.recipient,
      copy.table.placedAt,
      copy.table.grandTotal,
      copy.table.payment,
      copy.table.status,
    ]) {
      expect(screen.getByRole('columnheader', { name: header })).toBeInTheDocument();
    }
  });

  it('renders one row per order', () => {
    renderTable([base, { ...base, orderId: 'o2' }]);
    expect(screen.getAllByRole('button', { name: copy.table.openOrder })).toHaveLength(2);
  });

  it('opens the order when the row is clicked', () => {
    const onOpen = renderTable([base]);
    fireEvent.click(screen.getByRole('button', { name: copy.table.openOrder }));
    expect(onOpen).toHaveBeenCalledWith('o1');
  });

  it('opens the order on Enter, so the row is keyboard reachable', () => {
    const onOpen = renderTable([base]);
    fireEvent.keyDown(screen.getByRole('button', { name: copy.table.openOrder }), {
      key: 'Enter',
    });
    expect(onOpen).toHaveBeenCalledWith('o1');
  });

  it('shows the unpaid state for an order with no paidAt', () => {
    renderTable([base]);
    expect(screen.getByText(copy.payment.unpaid)).toBeInTheDocument();
  });

  it('shows the paid state once paidAt is stamped', () => {
    renderTable([{ ...base, paidAt: '2026-09-03T00:00:00Z' }]);
    expect(screen.getByText(copy.payment.paid)).toBeInTheDocument();
  });

  it('falls back to the raw payment method for an unrecognised value', () => {
    renderTable([{ ...base, paymentMethod: 'zarinpal' }]);
    expect(screen.getByText('zarinpal')).toBeInTheDocument();
  });

  it('shows a +N chip only when the order has more than one distinct line', () => {
    renderTable([base]);
    expect(screen.queryByText(copy.card.more.replace('{count}', '1'))).toBeNull();

    cleanup();
    renderTable([{ ...base, lines: [base.lines[0], { ...base.lines[0], variantId: 'v2' }] }]);
    expect(screen.getByText(copy.card.more.replace('{count}', '1'))).toBeInTheDocument();
  });

  it('shows the placeholder name when the order has no recipient', () => {
    renderTable([{ ...base, recipientName: null }]);
    expect(screen.getByText(copy.card.noName)).toBeInTheDocument();
  });
});
