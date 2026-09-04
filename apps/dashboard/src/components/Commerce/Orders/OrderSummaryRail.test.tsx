import type { ReactNode } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import messages from '@/messages/fa.json';
import type { OrderDetailView } from '@/types/commerceOrders';

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
});
