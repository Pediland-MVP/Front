import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import messages from '@/messages/fa.json';
import type { OrderView } from '@/types/commerceOrders';

import { OrderCard } from './OrderCard';

const copy = messages.Commerce.Orders;

const base: OrderView = {
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
};

const renderCard = (order: OrderView = base, onOpen = vi.fn()) => {
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <OrderCard order={order} onOpen={onOpen} />
    </NextIntlClientProvider>,
  );
  return onOpen;
};

describe('OrderCard', () => {
  it('shows the recipient, the translated status and the formatted total', () => {
    renderCard();
    expect(screen.getByText('علی رضایی')).toBeInTheDocument();
    expect(screen.getByText(copy.status.awaiting_review)).toBeInTheDocument();
    // `formatNumber` is `Intl.NumberFormat('en-US')`, so the output is always ASCII digits with
    // commas -- assert the exact string rather than a permissive regex.
    expect(screen.getByText('240,000')).toBeInTheDocument();
  });

  it('falls back to a named placeholder when the buyer never gave a name', () => {
    renderCard({ ...base, recipientName: null });
    expect(screen.getByText(copy.card.noName)).toBeInTheDocument();
  });

  it('opens the order when clicked', () => {
    const onOpen = renderCard();
    fireEvent.click(screen.getByRole('button'));
    expect(onOpen).toHaveBeenCalledWith('o1');
  });

  /**
   * Spec §6 lists the placed date among the five things a card shows. The list is date-sorted, so
   * this is the field the seller scans down. Literal Jalali string: 2026-09-02T10:00Z is 12:00 in
   * `toJalaliDate`'s default Europe/Berlin, which is 1405/06/11.
   */
  it('shows the placed date, which is what a date-sorted list is scanned by', () => {
    renderCard();
    expect(screen.getByText(/1405\/06\/11/)).toBeInTheDocument();
  });
});
