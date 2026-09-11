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

  // F6a: the item count and the "+N" chip were siblings in a `flex-col`, stacking each onto its
  // own line and dropping the intended " · " separator. Both must still be independently
  // matchable by `getByText` (see the docstring on the component) while reading on one line.
  it('shows the item count and the +N chip inline, separated by " · ", each independently matchable', () => {
    renderTable([{ ...base, lines: [base.lines[0], { ...base.lines[0], variantId: 'v2' }] }]);
    const itemCount = screen.getByText(copy.card.itemCount.replace('{count}', '2'));
    const chip = screen.getByText(copy.card.more.replace('{count}', '1'));
    expect(itemCount).toBeInTheDocument();
    expect(chip).toBeInTheDocument();
    // Same inline parent, so they read on one line rather than stacking.
    expect(itemCount.parentElement).toBe(chip.parentElement);
    expect(itemCount.parentElement?.textContent).toContain(' · ');
  });

  it('shows the placeholder name when the order has no recipient', () => {
    renderTable([{ ...base, recipientName: null }]);
    expect(screen.getByText(copy.card.noName)).toBeInTheDocument();
  });

  // F1: `OrderThumbs.test.tsx` only ever renders `OrderThumbs` standalone, and no other suite
  // opened the lightbox INSIDE a real row -- which is exactly why the row-level navigation bug
  // went unnoticed. Radix portals `ReceiptLightbox` out to `document.body`, but React synthetic
  // events bubble the COMPONENT tree, not the DOM tree, so a click on the lightbox's close button
  // still reaches the row's `onClick` unless something inside `OrderThumbs` stops it.
  it('does not navigate the row when the receipt lightbox is closed from inside it', () => {
    const onOpen = renderTable([{ ...base, receiptUrl: 'https://cdn/r.jpg', receiptCount: 1 }]);

    fireEvent.click(screen.getByAltText(copy.receipts.thumbAlt));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: copy.receipts.close }));

    expect(onOpen).not.toHaveBeenCalled();
  });

  // Same seam, the backdrop instead of the close button -- Radix's overlay is a sibling of
  // `DialogContent` inside the same portal, so it bubbles through the exact same React-tree path.
  it('does not navigate the row when the lightbox backdrop is clicked', () => {
    const onOpen = renderTable([{ ...base, receiptUrl: 'https://cdn/r.jpg', receiptCount: 1 }]);

    fireEvent.click(screen.getByAltText(copy.receipts.thumbAlt));
    const dialog = screen.getByRole('dialog');
    // The overlay is the dialog's own previous sibling in Radix's DOM output.
    const overlay = dialog.previousElementSibling as HTMLElement;
    expect(overlay).toBeTruthy();

    fireEvent.click(overlay);

    expect(onOpen).not.toHaveBeenCalled();
  });

  // F2: the row's `onKeyDown` calls `preventDefault()` on Enter/Space as it bubbles past, which
  // cancels a `<button>`'s native default action (the synthetic click Enter/Space would fire) --
  // so without the receipt button handling the key itself, Enter silently navigates the row away
  // instead of opening the lightbox.
  it('opens the lightbox on Enter at the receipt thumbnail, and does not navigate the row', () => {
    const onOpen = renderTable([{ ...base, receiptUrl: 'https://cdn/r.jpg', receiptCount: 1 }]);

    fireEvent.keyDown(screen.getByAltText(copy.receipts.thumbAlt).closest('button')!, {
      key: 'Enter',
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(onOpen).not.toHaveBeenCalled();
  });
});
