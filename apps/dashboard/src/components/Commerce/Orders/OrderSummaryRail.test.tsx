import type { ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import messages from '@/messages/fa.json';
import type { OrderDetailView } from '@/types/commerceOrders';

// `can` defaults to true -- same mocking convention `OrderStatusUpdater.test.tsx` uses for
// `usePermissions`.
const { mockCan } = vi.hoisted(() => ({ mockCan: vi.fn().mockReturnValue(true) }));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ can: mockCan }),
}));

import { OrderSummaryRail } from './OrderSummaryRail';

const copy = messages.Commerce.Orders;

// Same fixture shape as OrderDetail.test.tsx's `base` (copied rather than imported across test
// files, per the task brief), extended with nothing further -- OrderDetailView already carries
// `receipts`.
const detailOrder: OrderDetailView = {
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
      unitPrice: 500,
      compareAtPrice: null,
      quantity: 2,
      lineTotal: 1000,
    },
  ],
  itemsTotal: 1000,
  shippingTotal: 0,
  grandTotal: 1000,
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
  receipts: [],
};

const wrap = (node: ReactNode) => (
  <NextIntlClientProvider locale="fa" messages={messages}>
    {node}
  </NextIntlClientProvider>
);

describe('OrderSummaryRail', () => {
  it('leads with the status, the total and the payment state', () => {
    render(wrap(<OrderSummaryRail order={detailOrder} statusUpdater={null} />));
    expect(screen.getByText(copy.status.awaiting_review)).toBeInTheDocument();
    // `formatNumber` uses `Intl.NumberFormat('en-US')` — ASCII digits and commas, NOT Persian
    // digits. The amount is deliberately the only ASCII-digit token on an otherwise Persian
    // surface; do not "fix" this assertion to ۱٬۰۰۰.
    expect(screen.getByText('1,000')).toBeInTheDocument();
    expect(screen.getByText(copy.payment.unpaid)).toBeInTheDocument();
  });

  it('shows the paid time once settled', () => {
    render(
      wrap(
        <OrderSummaryRail
          order={{ ...detailOrder, paidAt: '2026-09-03T00:00:00Z' }}
          statusUpdater={null}
        />,
      ),
    );
    expect(screen.getByText(copy.payment.paid)).toBeInTheDocument();
  });

  it('shows the receipts, newest first', () => {
    render(
      wrap(
        <OrderSummaryRail
          order={{
            ...detailOrder,
            receipts: [
              { id: 'r1', url: 'https://cdn/1.jpg', createDate: '2026-09-01T00:00:00Z' },
              { id: 'r2', url: 'https://cdn/2.jpg', createDate: '2026-09-03T00:00:00Z' },
            ],
          }}
          statusUpdater={null}
        />,
      ),
    );
    expect(screen.getAllByRole('img')[0]).toHaveAttribute('src', 'https://cdn/2.jpg');
  });

  it('says so when no receipt has been sent', () => {
    render(wrap(<OrderSummaryRail order={detailOrder} statusUpdater={null} />));
    expect(screen.getByText(copy.receipts.none)).toBeInTheDocument();
  });

  it('renders the cancel reason on a cancelled order', () => {
    render(
      wrap(
        <OrderSummaryRail
          order={{ ...detailOrder, status: 'cancelled', cancelReason: 'payment_rejected' }}
          statusUpdater={null}
        />,
      ),
    );
    expect(screen.getByText(copy.cancelReason.payment_rejected)).toBeInTheDocument();
  });

  it('renders whatever status control it is handed', () => {
    render(wrap(<OrderSummaryRail order={detailOrder} statusUpdater={<button>UPDATER</button>} />));
    expect(screen.getByRole('button', { name: 'UPDATER' })).toBeInTheDocument();
  });

  /**
   * The render guard is `order.status === 'cancelled' && order.cancelReason`, not
   * `order.cancelReason` alone -- a cancel reason must never show on a live order. Every other
   * fixture with a `cancelReason` also has `status: 'cancelled'`, so without this test a future
   * edit that drops the status half of the guard would still pass all the others.
   */
  it('never shows a cancel reason on a non-cancelled order, even if one is recorded', () => {
    render(
      wrap(
        <OrderSummaryRail
          order={{ ...detailOrder, status: 'awaiting_review', cancelReason: 'payment_rejected' }}
          statusUpdater={null}
        />,
      ),
    );
    expect(screen.queryByText(copy.cancelReason.payment_rejected)).not.toBeInTheDocument();
  });

  /**
   * Mirrors `OrderDetail`'s own `actions` contract: an element is truthy even when the thing it
   * renders is `null`, so the empty-bordered-strip defect lived in the CALLER deciding to render
   * `<OrderActions/>` unconditionally. This pins the other half here -- `statusUpdater={null}`
   * must not leave a bordered slot in the DOM at all.
   */
  it('renders no status-updater slot at all when handed null', () => {
    render(wrap(<OrderSummaryRail order={detailOrder} statusUpdater={null} />));
    expect(screen.queryByTestId('status-updater-slot')).not.toBeInTheDocument();
  });

  describe('tracking row', () => {
    it('shows the tracking link once the order is sending', () => {
      render(
        wrap(
          <OrderSummaryRail
            order={{ ...detailOrder, status: 'sending', trackingUrl: 'https://a.example/1' }}
            statusUpdater={null}
          />,
        ),
      );
      const link = screen.getByTestId('tracking-link');
      expect(link).toHaveAttribute('href', 'https://a.example/1');
      // The url is merchant-supplied and opens in a new tab; without noopener/noreferrer the
      // opened page gets a `window.opener` handle back into this dashboard.
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('offers to add a link when a shipped order has none', () => {
      render(
        wrap(
          <OrderSummaryRail
            order={{ ...detailOrder, status: 'sending', trackingUrl: null }}
            statusUpdater={null}
          />,
        ),
      );
      expect(screen.getByTestId('tracking-edit')).toHaveTextContent(copy.detail.trackingAdd);
      expect(screen.queryByTestId('tracking-link')).not.toBeInTheDocument();
      expect(screen.getByText(copy.detail.trackingNone)).toBeInTheDocument();
    });

    it('offers to edit, not add, when a shipped order already has a link', () => {
      render(
        wrap(
          <OrderSummaryRail
            order={{ ...detailOrder, status: 'sending', trackingUrl: 'https://a.example/1' }}
            statusUpdater={null}
          />,
        ),
      );
      expect(screen.getByTestId('tracking-edit')).toHaveTextContent(copy.detail.trackingEdit);
    });

    it('shows the tracking row on a completed order too', () => {
      render(
        wrap(
          <OrderSummaryRail
            order={{ ...detailOrder, status: 'completed', trackingUrl: 'https://a.example/1' }}
            statusUpdater={null}
          />,
        ),
      );
      expect(screen.getByTestId('tracking-link')).toBeInTheDocument();
    });

    it('shows no tracking row before the order ships', () => {
      render(
        wrap(
          <OrderSummaryRail
            order={{ ...detailOrder, status: 'processing', trackingUrl: null }}
            statusUpdater={null}
          />,
        ),
      );
      expect(screen.queryByTestId('tracking-edit')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tracking-link')).not.toBeInTheDocument();
    });

    it('shows no tracking row for a pickup order, even once it is sending', () => {
      render(
        wrap(
          <OrderSummaryRail
            order={{
              ...detailOrder,
              status: 'sending',
              shippingKind: 'pickup',
              trackingUrl: null,
            }}
            statusUpdater={null}
          />,
        ),
      );
      expect(screen.queryByTestId('tracking-edit')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tracking-link')).not.toBeInTheDocument();
    });

    it('hides the edit affordance without order:manage, but still shows the link', () => {
      mockCan.mockReturnValueOnce(false);
      render(
        wrap(
          <OrderSummaryRail
            order={{ ...detailOrder, status: 'sending', trackingUrl: 'https://a.example/1' }}
            statusUpdater={null}
          />,
        ),
      );
      expect(screen.queryByTestId('tracking-edit')).not.toBeInTheDocument();
      expect(screen.getByTestId('tracking-link')).toBeInTheDocument();
    });

    it('opens the edit dialog pre-filled with the current link when tapped', () => {
      render(
        wrap(
          <OrderSummaryRail
            order={{ ...detailOrder, status: 'sending', trackingUrl: 'https://a.example/1' }}
            statusUpdater={null}
          />,
        ),
      );
      fireEvent.click(screen.getByTestId('tracking-edit'));
      expect(screen.getByTestId('tracking-url')).toHaveValue('https://a.example/1');
    });
  });
});
