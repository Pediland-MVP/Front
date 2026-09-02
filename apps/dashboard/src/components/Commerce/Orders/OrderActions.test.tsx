import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import messages from '@/messages/fa.json';
import type { OrderView } from '@/types/commerceOrders';

// `can` defaults to true -- OrderActions hides every button without `order:manage`, but that
// gating is not what this suite is about. Same mocking convention `CollectionsList.test.tsx`
// uses for `usePermissions`.
const { mockCan } = vi.hoisted(() => ({ mockCan: vi.fn().mockReturnValue(true) }));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ can: mockCan }),
}));

import { OrderActions } from './OrderActions';

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

const renderActions = (overrides: Partial<OrderView>) => {
  const onAction = vi.fn().mockResolvedValue(undefined);
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <OrderActions order={{ ...base, ...overrides }} onAction={onAction} disabled={false} />
    </NextIntlClientProvider>,
  );
  return onAction;
};

describe('OrderActions', () => {
  it('offers approve and reject while awaiting review', () => {
    renderActions({ status: 'awaiting_review', paidAt: null });
    expect(screen.getByRole('button', { name: copy.actions.approve })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: copy.actions.reject })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: copy.actions.ship })).not.toBeInTheDocument();
  });

  it('drops ship once the order is already sending', () => {
    renderActions({ status: 'sending', paidAt: null });
    expect(screen.queryByRole('button', { name: copy.actions.ship })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: copy.actions.complete })).toBeInTheDocument();
  });

  it('offers no lifecycle action on a completed order', () => {
    renderActions({ status: 'completed', paidAt: '2026-09-02T12:00:00.000Z' });
    Object.values({
      a: copy.actions.approve,
      b: copy.actions.ship,
      c: copy.actions.cancel,
    }).forEach((label) =>
      expect(screen.queryByRole('button', { name: label })).not.toBeInTheDocument(),
    );
  });

  it('offers markPaid on an unpaid awaiting-review order, which no status table would allow', () => {
    renderActions({ status: 'awaiting_review', paidAt: null });
    expect(screen.getByRole('button', { name: copy.actions.markPaid })).toBeInTheDocument();
  });

  it('withdraws markPaid once paidAt is stamped', () => {
    renderActions({ status: 'processing', paidAt: '2026-09-02T12:00:00.000Z' });
    expect(screen.queryByRole('button', { name: copy.actions.markPaid })).not.toBeInTheDocument();
  });

  it('opens the reject dialog rather than rejecting straight away', () => {
    const onAction = renderActions({ status: 'awaiting_review', paidAt: null });
    fireEvent.click(screen.getByRole('button', { name: copy.actions.reject }));
    expect(onAction).not.toHaveBeenCalled();
    expect(screen.getByText(copy.dialogs.reject.buyerSees)).toBeInTheDocument();
  });

  it('approves without a dialog', async () => {
    const onAction = renderActions({ status: 'awaiting_review', paidAt: null });
    fireEvent.click(screen.getByRole('button', { name: copy.actions.approve }));
    // `await` lets the `busy` state's post-resolve `setBusy(false)` settle inside `waitFor`'s
    // own `act()` wrapper, instead of firing after the test body returns.
    await waitFor(() => expect(onAction).toHaveBeenCalledWith('approve'));
  });

  it('shows nothing at all without the order:manage permission', () => {
    mockCan.mockReturnValueOnce(false);
    renderActions({ status: 'awaiting_review', paidAt: null });
    expect(screen.queryByRole('button', { name: copy.actions.approve })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: copy.actions.reject })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: copy.actions.markPaid })).not.toBeInTheDocument();
  });

  /**
   * `approve` fires directly with nothing else guarding a repeat click -- `OrderDetailPage`
   * never actually renders this component with `disabled` set, and the dialog-backed actions
   * have their own internal `isSubmitting` which does not cover `approve`/`markPaid`. Without a
   * local `busy` guard, a double-tap sends two POSTs and the second comes back
   * `COMMERCE_ORDER_STATUS_CHANGED` right after a successful first one.
   */
  it('disables approve while the first click is still in flight, so a second click cannot fire it again', async () => {
    let resolveAction: () => void = () => {};
    const onAction = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveAction = resolve;
        }),
    );
    render(
      <NextIntlClientProvider locale="fa" messages={messages}>
        <OrderActions
          order={{ ...base, status: 'awaiting_review', paidAt: null }}
          onAction={onAction}
          disabled={false}
        />
      </NextIntlClientProvider>,
    );
    const approveButton = screen.getByRole('button', { name: copy.actions.approve });

    fireEvent.click(approveButton);
    expect(approveButton).toBeDisabled();
    fireEvent.click(approveButton);

    expect(onAction).toHaveBeenCalledTimes(1);

    resolveAction();
    await waitFor(() => expect(approveButton).not.toBeDisabled());
  });
});
