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

  // F6b: this was the ONE fact `OrdersTable` showed that `OrderRowCard` omitted -- the whole
  // justification for a second rendering is that the phone loses nothing. Matches the table's
  // inline treatment (F6a): item count and the "+N" chip each independently matchable, read on
  // one line, separated by " · ".
  it('shows the item count, matching the table', () => {
    renderRow(base);
    expect(screen.getByText(copy.card.itemCount.replace('{count}', '1'))).toBeInTheDocument();
  });

  it('shows the item count and the +N chip inline, separated by " · ", each independently matchable', () => {
    renderRow({ ...base, lines: [base.lines[0], { ...base.lines[0], variantId: 'v2' }] });
    const itemCount = screen.getByText(copy.card.itemCount.replace('{count}', '2'));
    const chip = screen.getByText(copy.card.more.replace('{count}', '1'));
    expect(itemCount).toBeInTheDocument();
    expect(chip).toBeInTheDocument();
    expect(itemCount.parentElement).toBe(chip.parentElement);
    expect(itemCount.parentElement?.textContent).toContain(' · ');
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

  // F1: same seam as `OrdersTable` -- `OrderThumbs.test.tsx` only renders `OrderThumbs`
  // standalone, so nothing ever proved the receipt lightbox's own close button doesn't bubble a
  // click through the React tree (Radix portals it out of the DOM tree, but React synthetic
  // events bubble the COMPONENT tree) up to this row's `onClick`.
  it('does not navigate the row when the receipt lightbox is closed from inside it', () => {
    const onOpen = renderRow({ ...base, receiptUrl: 'https://cdn/r.jpg', receiptCount: 1 });

    fireEvent.click(screen.getByAltText(copy.receipts.thumbAlt));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: copy.receipts.close }));

    expect(onOpen).not.toHaveBeenCalled();
  });

  // F2: the row's own `onKeyDown` calls `preventDefault()` on Enter/Space as it bubbles past,
  // cancelling the receipt `<button>`'s native default action before it can fire -- so without
  // the button handling the key itself, Enter silently navigates the row instead of opening the
  // lightbox.
  it('opens the lightbox on Enter at the receipt thumbnail, and does not navigate the row', () => {
    const onOpen = renderRow({ ...base, receiptUrl: 'https://cdn/r.jpg', receiptCount: 1 });

    fireEvent.keyDown(screen.getByAltText(copy.receipts.thumbAlt).closest('button')!, {
      key: 'Enter',
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(onOpen).not.toHaveBeenCalled();
  });
});
