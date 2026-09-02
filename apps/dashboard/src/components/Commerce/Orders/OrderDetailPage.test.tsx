import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import messages from '@/messages/fa.json';
import type { OrderDetailView } from '@/types/commerceOrders';

// This gate is not what this suite is about -- default it open, same convention
// `OrderActions.test.tsx` uses for `usePermissions`.
const { mockCan } = vi.hoisted(() => ({ mockCan: vi.fn().mockReturnValue(true) }));
vi.mock('@/hooks/usePermissions', () => ({ usePermissions: () => ({ can: mockCan }) }));

const { toastError } = vi.hoisted(() => ({ toastError: vi.fn() }));
vi.mock('sonner', () => ({ toast: { error: toastError } }));

// `OrderDetail` resolves nothing over the network itself, but `OrderDetailPage` calls this hook
// directly -- stub it out with an empty map rather than pull `swr/immutable` into this suite.
vi.mock('@/hooks/useShippingDestinations', () => ({
  useShippingDestinations: () => ({ cityById: new Map() }),
}));

const { mockUseCommerceOrder } = vi.hoisted(() => ({ mockUseCommerceOrder: vi.fn() }));
vi.mock('@/hooks/useCommerceOrder', () => ({ useCommerceOrder: mockUseCommerceOrder }));

import { OrderDetailPage } from './OrderDetailPage';

const copy = messages.Commerce.Orders;

const order: OrderDetailView = {
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
  cityId: null,
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
  receipts: [],
};

/**
 * `approve` is the only write this suite drives -- what is under test is `OrderDetailPage`'s
 * `onAction` catch block, not any one specific action, and `approve` is the plain no-dialog path
 * (`OrderActions.test.tsx` already covers `approve` firing at all).
 */
const setup = (approveImpl: () => Promise<void>, orderOverride?: Partial<OrderDetailView>) => {
  const mutateMock = vi.fn().mockResolvedValue(undefined);
  mockUseCommerceOrder.mockReturnValue({
    order: { ...order, ...orderOverride },
    isLoading: false,
    error: undefined,
    mutate: mutateMock,
    approve: approveImpl,
    reject: vi.fn(),
    ship: vi.fn(),
    complete: vi.fn(),
    cancel: vi.fn(),
    markPaid: vi.fn(),
  });
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <OrderDetailPage orderId="o1" />
    </NextIntlClientProvider>,
  );
  return mutateMock;
};

describe('OrderDetailPage status-change recovery', () => {
  beforeEach(() => {
    toastError.mockClear();
    mockCan.mockReturnValue(true);
  });

  /**
   * `COMMERCE_ORDER_STATUS_CHANGED` means someone else already acted, or the buyer's DM moved
   * the order underneath this page. Toasting alone would leave stale buttons that fail on every
   * retry -- this is the behaviour the task ("...and error handling") is named for, and the most
   * defect-prone line in the diff, so it gets its own direct test rather than relying on
   * `OrderActions`' unit tests to imply it.
   */
  it('revalidates the order when the action fails with COMMERCE_ORDER_STATUS_CHANGED', async () => {
    const approve = vi
      .fn()
      .mockRejectedValue({ response: { data: { code: 'COMMERCE_ORDER_STATUS_CHANGED' } } });
    const mutateMock = setup(approve);

    fireEvent.click(screen.getByRole('button', { name: copy.actions.approve }));

    await waitFor(() => expect(mutateMock).toHaveBeenCalledTimes(1));
    expect(toastError).toHaveBeenCalled();
  });

  it('does not revalidate for a different error code', async () => {
    const approve = vi.fn().mockRejectedValue({
      response: { data: { code: 'COMMERCE_INSUFFICIENT_STOCK_ON_APPROVAL' } },
    });
    const mutateMock = setup(approve);

    fireEvent.click(screen.getByRole('button', { name: copy.actions.approve }));

    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(mutateMock).not.toHaveBeenCalled();
  });

  /**
   * I4: on a transport error axios attaches no `response`, so both `code` and `message` are
   * `undefined` and `toast.error(undefined)` rendered an EMPTY toast -- the seller saw a blank box
   * and could not tell whether the action had gone through.
   */
  it('toasts a real sentence, not undefined, when the request never reached the API', async () => {
    const approve = vi.fn().mockRejectedValue(new Error('Network Error'));
    const mutateMock = setup(approve);

    fireEvent.click(screen.getByRole('button', { name: copy.actions.approve }));

    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(toastError).toHaveBeenCalledWith(copy.errors.unknown);
    // A transport failure is not a status change -- nothing to revalidate against.
    expect(mutateMock).not.toHaveBeenCalled();
  });
});

describe('OrderDetailPage action bar visibility', () => {
  beforeEach(() => {
    toastError.mockClear();
    mockCan.mockReturnValue(true);
  });

  /**
   * M1: `OrderDetail` renders a bordered strip whenever `actions` is truthy, and an
   * `<OrderActions/>` ELEMENT is truthy even when the component renders `null`. Both of these
   * used to produce an empty bordered strip.
   */
  it('passes no action bar when the viewer cannot manage orders', () => {
    mockCan.mockReturnValue(false);
    setup(vi.fn());
    expect(screen.queryByTestId('order-actions-bar')).not.toBeInTheDocument();
  });

  it('passes no action bar when the order has no legal action left', () => {
    setup(vi.fn(), { status: 'completed', paidAt: '2026-09-02T12:00:00.000Z' });
    expect(screen.queryByTestId('order-actions-bar')).not.toBeInTheDocument();
  });

  /**
   * The C1 case end to end: a delivered COD order that has not been settled still has exactly one
   * legal action, so the bar must appear.
   */
  it('shows the action bar for a completed but unsettled order, holding only markPaid', () => {
    setup(vi.fn(), { status: 'completed', paidAt: null });
    expect(screen.getByTestId('order-actions-bar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: copy.actions.markPaid })).toBeInTheDocument();
  });
});
