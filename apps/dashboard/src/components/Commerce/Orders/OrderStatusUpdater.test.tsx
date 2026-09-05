import { describe, it, expect, vi, beforeAll } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import messages from '@/messages/fa.json';
import type { OrderView } from '@/types/commerceOrders';

// Radix's Select uses pointer-capture APIs jsdom does not implement, and calls scrollIntoView
// on the item it wants to highlight when opening. Neither exists on jsdom's Element prototype,
// so without these no-op shims any interaction with the Select in this file throws. Same fix
// `SetupInstagramDialog.test.tsx` uses. Scoped to this file only.
beforeAll(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false) as never;
  Element.prototype.setPointerCapture = vi.fn() as never;
  Element.prototype.releasePointerCapture = vi.fn() as never;
  Element.prototype.scrollIntoView = vi.fn() as never;
});

// `can` defaults to true -- same mocking convention `OrderActions.test.tsx` uses for
// `usePermissions`. Copied verbatim (Task 13 deletes the original once `OrderActions` is gone).
const { mockCan } = vi.hoisted(() => ({ mockCan: vi.fn().mockReturnValue(true) }));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ can: mockCan }),
}));

import { OrderStatusUpdater } from './OrderStatusUpdater';

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
  shippingKind: 'post_express',
  shippingSettlement: 'prepaid',
  paidAt: null,
  createDate: '2026-09-02T10:00:00.000Z',
};

const awaitingOrder: OrderView = { ...base, status: 'awaiting_review', paidAt: null };
const processingOrder: OrderView = { ...base, status: 'processing', paidAt: null };

const renderUpdater = (order: OrderView, onAction = vi.fn().mockResolvedValue(true)) => {
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <OrderStatusUpdater order={order} onAction={onAction} />
    </NextIntlClientProvider>,
  );
  return onAction;
};

// Opens the Radix combobox and clicks the named option. `userEvent` is not a resolvable
// dependency of this app (only present transitively in the pnpm store), so this follows the
// same `fireEvent` + `findByRole('option', ...)` drive `SetupInstagramDialog.test.tsx` already
// uses successfully against this Select component.
const selectStatus = async (name: string) => {
  fireEvent.click(screen.getByRole('combobox'));
  fireEvent.click(await screen.findByRole('option', { name }));
};

describe('OrderStatusUpdater', () => {
  it('disables the update button until a different status is chosen', () => {
    renderUpdater(awaitingOrder);
    expect(screen.getByRole('button', { name: copy.statusUpdate.submit })).toBeDisabled();
  });

  it('confirms before approving — approve must not fire on one click', async () => {
    const onAction = renderUpdater(awaitingOrder);
    await selectStatus(copy.status.processing);
    fireEvent.click(screen.getByRole('button', { name: copy.statusUpdate.submit }));

    expect(onAction).not.toHaveBeenCalled();
    expect(screen.getByText(copy.dialogs.approve.description)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: copy.dialogs.approve.confirm }));
    await waitFor(() => expect(onAction).toHaveBeenCalledWith('approve'));
  });

  it('asks for a reason when cancelling from awaiting_review (reject)', async () => {
    renderUpdater(awaitingOrder);
    await selectStatus(copy.status.cancelled);
    fireEvent.click(screen.getByRole('button', { name: copy.statusUpdate.submit }));
    expect(screen.getByText(copy.dialogs.reject.buyerSees)).toBeInTheDocument();
  });

  it('warns about restocking when cancelling from processing (cancel)', async () => {
    renderUpdater(processingOrder);
    await selectStatus(copy.status.cancelled);
    fireEvent.click(screen.getByRole('button', { name: copy.statusUpdate.submit }));
    expect(screen.getByText(copy.dialogs.cancel.description)).toBeInTheDocument();
  });

  it('keeps the chosen status when the write fails', async () => {
    const onAction = vi.fn().mockResolvedValue(false);
    renderUpdater(awaitingOrder, onAction);
    await selectStatus(copy.status.processing);
    fireEvent.click(screen.getByRole('button', { name: copy.statusUpdate.submit }));
    fireEvent.click(screen.getByRole('button', { name: copy.dialogs.approve.confirm }));

    await waitFor(() => expect(onAction).toHaveBeenCalled());
    expect(screen.getByRole('combobox')).toHaveTextContent(copy.status.processing);
  });

  it('routes processing -> sending through the ship dialog, with a tracking url field', async () => {
    const onAction = renderUpdater(processingOrder);
    await selectStatus(copy.status.sending);
    fireEvent.click(screen.getByRole('button', { name: copy.statusUpdate.submit }));

    expect(onAction).not.toHaveBeenCalled();
    expect(screen.getByText(copy.dialogs.ship.titlePosted)).toBeInTheDocument();
    expect(screen.getByTestId('tracking-url')).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('tracking-url'), {
      target: { value: 'https://tracking.post.ir/abc' },
    });
    fireEvent.click(screen.getByTestId('ship-confirm'));
    await waitFor(() =>
      expect(onAction).toHaveBeenCalledWith('ship', undefined, 'https://tracking.post.ir/abc'),
    );
  });

  it('ships with no tracking url when the field is left blank', async () => {
    const onAction = renderUpdater(processingOrder);
    await selectStatus(copy.status.sending);
    fireEvent.click(screen.getByRole('button', { name: copy.statusUpdate.submit }));
    fireEvent.click(screen.getByTestId('ship-confirm'));

    await waitFor(() => expect(onAction).toHaveBeenCalledWith('ship'));
  });

  it('hides the tracking url field, and shows pickup wording, when shipping a pickup order', async () => {
    renderUpdater({ ...processingOrder, shippingKind: 'pickup' });
    await selectStatus(copy.status.sending);
    fireEvent.click(screen.getByRole('button', { name: copy.statusUpdate.submit }));

    expect(screen.getByText(copy.dialogs.ship.titlePickup)).toBeInTheDocument();
    expect(screen.queryByTestId('tracking-url')).toBeNull();
  });

  it('never offers sending for a digital order', async () => {
    renderUpdater({ ...processingOrder, kind: 'digital' });
    fireEvent.click(screen.getByRole('combobox'));
    expect(screen.queryByRole('option', { name: copy.status.sending })).toBeNull();
  });

  it('disables the select and explains why on a terminal order', () => {
    renderUpdater({ ...awaitingOrder, status: 'completed' });
    expect(screen.getByRole('combobox')).toBeDisabled();
    expect(screen.getByText(copy.statusUpdate.terminal)).toBeInTheDocument();
  });

  it('confirms before marking paid, because there is no un-mark endpoint', async () => {
    const onAction = renderUpdater(awaitingOrder);
    fireEvent.click(screen.getByRole('button', { name: copy.actions.markPaid }));
    expect(onAction).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: copy.dialogs.markPaid.confirm }));
    await waitFor(() => expect(onAction).toHaveBeenCalledWith('markPaid'));
  });

  it('offers markPaid on a completed COD order — the case it exists for', () => {
    renderUpdater({ ...awaitingOrder, status: 'completed', paidAt: null });
    expect(screen.getByRole('button', { name: copy.actions.markPaid })).toBeInTheDocument();
  });

  it('hides markPaid once paidAt is stamped', () => {
    renderUpdater({ ...awaitingOrder, paidAt: '2026-09-03T00:00:00Z' });
    expect(screen.queryByRole('button', { name: copy.actions.markPaid })).toBeNull();
  });
});
