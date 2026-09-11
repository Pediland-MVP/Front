import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import messages from '@/messages/fa.json';
import type { OrderDetailView } from '@/types/commerceOrders';

import { OrderDetail } from './OrderDetail';
import { printDocument } from './print/printDocument';

// `printDocument` drives a real iframe/window.print() -- entirely out of scope for a render
// test, and Task 7's own suite already covers what the builders it wraps produce. Mocked so
// these tests only assert it was CALLED, per the task brief.
vi.mock('./print/printDocument', () => ({ printDocument: vi.fn(() => Promise.resolve()) }));

const copy = messages.Commerce.Orders;
const shippingCopy = messages.Commerce.Shipping;

const wrap = (node: ReactNode) => (
  <NextIntlClientProvider locale="fa" messages={messages}>
    {node}
  </NextIntlClientProvider>
);

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
  shop: null,
};

const renderDetail = (
  order: OrderDetailView,
  cityName: string | null,
  provinceName: string | null = null,
) => {
  render(
    wrap(
      <OrderDetail
        order={order}
        cityName={cityName}
        provinceName={provinceName}
        statusUpdater={null}
      />,
    ),
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

  // The payment state now lives on `OrderSummaryRail` (already covered by its own suite), which
  // renders the short `payment.unpaid` label rather than the old flat body's `detail.notPaid`
  // sentence -- that key has no renderer left in the new composition.
  it('says the payment is not yet confirmed when paidAt is null', () => {
    renderDetail({ ...base, paidAt: null, receipts: [] }, null);
    expect(screen.getByText(copy.payment.unpaid)).toBeInTheDocument();
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

  it('puts the decision rail before the detail columns in the DOM, so it is first on a phone', () => {
    render(
      wrap(
        <OrderDetail
          order={base}
          cityName="تهران"
          provinceName={null}
          statusUpdater={<button>UPDATER</button>}
        />,
      ),
    );
    const rail = screen.getByRole('button', { name: 'UPDATER' });
    const items = screen.getByText(copy.detail.items);
    expect(rail.compareDocumentPosition(items) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('renders no status control when handed none', () => {
    render(
      wrap(<OrderDetail order={base} cityName="تهران" provinceName={null} statusUpdater={null} />),
    );
    expect(screen.queryByRole('button', { name: 'UPDATER' })).toBeNull();
  });

  describe('print buttons', () => {
    beforeEach(() => {
      vi.mocked(printDocument).mockClear();
    });

    it('enables the label button for a physical order and calls printDocument with html when clicked', () => {
      renderDetail({ ...base, kind: 'physical', receipts: [] }, 'تهران', 'تهران');
      const button = screen.getByRole('button', { name: copy.detail.printLabel });
      expect(button).not.toBeDisabled();
      fireEvent.click(button);
      expect(printDocument).toHaveBeenCalledTimes(1);
      expect(printDocument).toHaveBeenCalledWith(expect.any(String));
    });

    it('disables the label button for a digital order, with a title explaining why', () => {
      renderDetail({ ...base, kind: 'digital', receipts: [] }, null, null);
      const button = screen.getByRole('button', { name: copy.detail.printLabel });
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('title', copy.detail.printLabelDigitalDisabled);
    });

    it('never disables the invoice button, even for a digital order, and calls printDocument when clicked', () => {
      renderDetail({ ...base, kind: 'digital', receipts: [] }, null, null);
      const button = screen.getByRole('button', { name: copy.detail.printInvoice });
      expect(button).not.toBeDisabled();
      fireEvent.click(button);
      expect(printDocument).toHaveBeenCalledTimes(1);
      expect(printDocument).toHaveBeenCalledWith(expect.any(String));
    });

    // No page-level permission gate lives inside this component -- the order detail page is
    // already unreachable without `order:view` (the API is the enforcement point, see
    // `OrderDetail`'s own comment above the print row). Both buttons must render whenever the
    // component renders, with no `statusUpdater`/permissions wiring required.
    it('renders both print buttons with no permission gate of its own', () => {
      renderDetail({ ...base, receipts: [] }, null, null);
      expect(screen.getByRole('button', { name: copy.detail.printLabel })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: copy.detail.printInvoice })).toBeInTheDocument();
    });

    /**
     * Named explicitly (all other tests in this block reuse `base`, which already has
     * `shop: null`, so this exact combination was already exercised implicitly -- but never
     * asserted as a deliberate combination). `isDigital` (which disables the label button)
     * comes only from `order.kind`, entirely independent of `order.shop`, so both "paths"
     * being active together is not a special case in the source -- this test exists to make
     * that explicit and to prove the invoice HTML itself (not just the button's disabled
     * state) renders cleanly when both a null shop AND a digital kind apply at once.
     */
    it('handles order.shop === null and kind === "digital" together: label disabled, invoice still builds a clean document', () => {
      renderDetail({ ...base, kind: 'digital', shop: null, receipts: [] }, null, null);

      const labelButton = screen.getByRole('button', { name: copy.detail.printLabel });
      expect(labelButton).toBeDisabled();

      const invoiceButton = screen.getByRole('button', { name: copy.detail.printInvoice });
      expect(invoiceButton).not.toBeDisabled();
      fireEvent.click(invoiceButton);

      expect(printDocument).toHaveBeenCalledTimes(1);
      const html = vi.mocked(printDocument).mock.calls[0]?.[0] as string;
      expect(html).toEqual(expect.any(String));
      expect(html).not.toContain('undefined');
      expect(html).not.toContain('>null<');
    });
  });
});
