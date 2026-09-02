import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import messages from '@/messages/fa.json';
import type { OrderDetailView } from '@/types/commerceOrders';

import { OrderDetail } from './OrderDetail';

const copy = messages.Commerce.Orders;
const shippingCopy = messages.Commerce.Shipping;

// Copied from OrderCard.test.tsx's `base` fixture rather than imported across test files (per
// the task brief) -- extended here with the `receipts` field OrderDetailView adds.
const base: OrderDetailView = {
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
  // The merchant's own name for the method (`detail.shippingMethod`) is deliberately different
  // from the carrier kind's generic label (`Commerce.Shipping.kinds.post_express` = "پست پیشتاز")
  // -- in real data these two rarely match, and keeping them distinct here avoids the two rows
  // colliding on the same text in tests.
  shippingTitle: 'ارسال ویژه',
  // The original OrderCard.test.tsx fixture used the placeholder 'post', which isn't one of the
  // six real CommerceShippingKind values -- corrected here to a real one.
  shippingKind: 'post_express',
  shippingSettlement: 'prepaid',
  paidAt: null,
  createDate: '2026-09-02T10:00:00.000Z',
  receipts: [],
};

const renderDetail = (order: OrderDetailView, cityName: string | null) => {
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <OrderDetail order={order} cityName={cityName} actions={null} />
    </NextIntlClientProvider>,
  );
};

describe('OrderDetail', () => {
  it('shows the city name it was handed rather than the raw id', () => {
    renderDetail({ ...base, receipts: [] }, 'تهران');
    expect(screen.getByText('تهران')).toBeInTheDocument();
    expect(screen.queryByText('10')).not.toBeInTheDocument();
  });

  it('omits shipping and address entirely for a digital order', () => {
    renderDetail(
      { ...base, kind: 'digital', address: null, shippingTitle: null, receipts: [] },
      null,
    );
    expect(screen.queryByText(copy.detail.address)).not.toBeInTheDocument();
    expect(screen.queryByText(copy.detail.shippingMethod)).not.toBeInTheDocument();
    // kind/settlement sit in the same !isDigital gate as title/address -- a digital order must
    // omit them too, even though `base.shippingKind`/`shippingSettlement` are still non-null here.
    expect(screen.queryByText(shippingCopy.kindLabel)).not.toBeInTheDocument();
    expect(screen.queryByText(shippingCopy.settlementLabel)).not.toBeInTheDocument();
  });

  it('says the payment is not yet confirmed when paidAt is null', () => {
    renderDetail({ ...base, paidAt: null, receipts: [] }, null);
    expect(screen.getByText(copy.detail.notPaid)).toBeInTheDocument();
  });

  it.each([['payment_rejected'], ['delivery_refused'], ['superseded'], ['legacy_cancelled']])(
    'renders the %s cancel reason in words',
    (reason) => {
      renderDetail(
        { ...base, status: 'cancelled', cancelReason: reason as never, receipts: [] },
        null,
      );
      expect(
        screen.getByText(copy.cancelReason[reason as keyof typeof copy.cancelReason]),
      ).toBeInTheDocument();
    },
  );

  it('renders each line with its options and line total', () => {
    renderDetail(
      {
        ...base,
        lines: [{ ...base.lines[0], options: [{ name: 'رنگ', value: 'آبی' }] }],
        receipts: [],
      },
      null,
    );
    expect(screen.getByText('شال')).toBeInTheDocument();
    expect(screen.getByText(/رنگ/)).toBeInTheDocument();
  });

  it.each([['card_to_card'], ['free'], ['cash_on_delivery']])(
    'renders the %s payment method label',
    (method) => {
      renderDetail({ ...base, paymentMethod: method, receipts: [] }, null);
      expect(
        screen.getByText(copy.paymentMethod[method as keyof typeof copy.paymentMethod]),
      ).toBeInTheDocument();
    },
  );

  it('falls back to the raw string for an unrecognised payment method (legacy backfill)', () => {
    renderDetail({ ...base, paymentMethod: 'zarinpal', receipts: [] }, null);
    expect(screen.getByText('zarinpal')).toBeInTheDocument();
  });

  it('renders the shipping kind and settlement labels for a physical order', () => {
    renderDetail({ ...base, receipts: [] }, null);
    expect(screen.getByText(shippingCopy.kinds.post_express)).toBeInTheDocument();
    expect(screen.getByText(shippingCopy.settlements.prepaid)).toBeInTheDocument();
  });

  it('omits the shipping kind/settlement row when null rather than a dash', () => {
    renderDetail({ ...base, shippingKind: null, shippingSettlement: null, receipts: [] }, null);
    expect(screen.queryByText(shippingCopy.kindLabel)).not.toBeInTheDocument();
    expect(screen.queryByText(shippingCopy.settlementLabel)).not.toBeInTheDocument();
  });

  it('renders a line image with the src and the line title as alt text', () => {
    renderDetail(
      {
        ...base,
        lines: [{ ...base.lines[0], imageUrl: 'https://cdn.example.com/shal.jpg' }],
        receipts: [],
      },
      null,
    );
    const image = screen.getByAltText('شال');
    expect(image).toHaveAttribute('src', 'https://cdn.example.com/shal.jpg');
  });

  it('renders no broken image for a line with no image on file', () => {
    renderDetail({ ...base, lines: [{ ...base.lines[0], imageUrl: null }], receipts: [] }, null);
    expect(screen.queryAllByRole('img')).toHaveLength(0);
  });

  /**
   * Guards the C2 defect on the rendering side. `utils/jalali.ts` reads `d.year()/month()/date()`
   * expecting GREGORIAN fields and hands them to `toJalaali()`. If anything in THIS component's
   * module graph switches dayjs's default calendar to Jalali globally -- which importing
   * `packages/ui`'s `DatePicker`, or its `@/components/ui` barrel, does -- those getters already
   * return Jalali fields, the conversion runs twice, and the placed date renders as year 784.
   *
   * A literal expectation, not a computed one: 2026-09-02T10:00Z is 12:00 in `toJalaliDateTime`'s
   * default Europe/Berlin, which is 1405/06/11 -- a plausible current-era Jalali year.
   */
  it('renders the placed date converted exactly once, not double-converted to year 784', () => {
    renderDetail({ ...base, placedAt: '2026-09-02T10:00:00.000Z', receipts: [] }, null);
    expect(screen.getByText('1405/06/11 12:00')).toBeInTheDocument();
    expect(screen.queryByText(/^784\//)).not.toBeInTheDocument();
  });

  /**
   * M1: `OrderDetail` renders a bordered strip whenever `actions` is truthy. `OrderDetailPage`
   * passes `null` when there is nothing to put in it (see its own test) -- this pins the other
   * half of the contract, that `null` really does mean no strip.
   */
  it('renders no action strip at all when handed no actions', () => {
    renderDetail({ ...base, receipts: [] }, null);
    expect(screen.queryByTestId('order-actions-bar')).not.toBeInTheDocument();
  });

  it('renders the action strip when handed something to put in it', () => {
    render(
      <NextIntlClientProvider locale="fa" messages={messages}>
        <OrderDetail order={base} cityName={null} actions={<button type="button">x</button>} />
      </NextIntlClientProvider>,
    );
    expect(screen.getByTestId('order-actions-bar')).toBeInTheDocument();
  });
});
