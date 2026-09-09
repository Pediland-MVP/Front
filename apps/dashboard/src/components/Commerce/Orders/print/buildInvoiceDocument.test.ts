import { describe, it, expect } from 'vitest';

import type { OrderDetailView } from '@/types/commerceOrders';

import { buildInvoiceDocument } from './buildInvoiceDocument';

const LABELS = {
  invoiceTitle: 'فاکتور فروش',
  seller: 'فروشنده',
  buyer: 'خریدار',
  address: 'آدرس',
  phone: 'تلفن',
  mobile: 'موبایل',
  postalCode: 'کدپستی',
  row: 'ردیف',
  productName: 'نام محصول',
  quantity: 'تعداد',
  unitPrice: 'مبلغ واحد',
  lineTotal: 'مبلغ کل',
  discount: 'تخفیف',
  afterDiscount: 'مبلغ کل پس از تخفیف',
  subtotal: 'جمع کل',
  shipping: 'هزینه ارسال',
  payable: 'مبلغ کل قابل پرداخت',
  inWords: 'به حروف',
  toman: 'تومان',
  trackingCode: 'کد پیگیری',
  orderRef: 'شناسه سفارش',
  paymentMethod: 'روش پرداخت',
  registeredAt: 'زمان ثبت',
  shippingMethod: 'روش ارسال',
  sellerSignature: 'مهر و امضا فروشنده',
  buyerSignature: 'مهر و امضا خریدار',
  defaultShippingMethod: 'پست',
  paymentMethod_card_to_card: 'کارت به کارت',
  paymentMethod_free: 'رایگان',
  paymentMethod_cash_on_delivery: 'پرداخت در محل تحویل',
};

const order: OrderDetailView = {
  orderId: '9c4a21e7-1111-2222-3333-444455556666',
  status: 'processing',
  cancelReason: null,
  kind: 'physical',
  lines: [
    {
      variantId: 'v-1',
      productId: 'p-1',
      title: 'کیت هوشمند',
      options: [
        { name: 'رنگ', value: 'مشکی' },
        { name: 'سایز', value: 'L' },
      ],
      imageUrl: null,
      unitPrice: 450_000,
      compareAtPrice: 485_000,
      quantity: 1,
      lineTotal: 450_000,
    },
    {
      variantId: 'v-2',
      productId: 'p-2',
      title: 'فیلتر یدک',
      options: [],
      imageUrl: null,
      unitPrice: 95_000,
      compareAtPrice: null,
      quantity: 2,
      lineTotal: 190_000,
    },
  ],
  // Deliberately diverging from the sum of the lines below (450_000 + 190_000 = 640_000):
  // real order-level totals are computed and stored server-side independently of the line
  // array (rounding, post-hoc adjustments, stale/legacy rows), so a fixture where they
  // happen to agree with the line sum can't tell a correct "read the stored field" builder
  // apart from a regressed one that silently starts summing `order.lines` instead. See the
  // "reads totals directly ..." test below, which asserts on these exact figures and also
  // asserts the line-sum figure is ABSENT from the output.
  itemsTotal: 700_000,
  shippingTotal: 60_000,
  grandTotal: 760_000,
  paymentMethod: 'card_to_card',
  recipientName: 'علی سری‌یزدی',
  mobile: '09131590982',
  cityId: 2,
  address: 'صفاییه',
  plate: null,
  unit: null,
  postalcode: '8916869534',
  placedAt: '2026-09-02T10:00:00.000Z',
  shippingTitle: 'پست پیشتاز',
  shippingKind: null,
  shippingSettlement: null,
  paidAt: '2026-09-02T10:05:00.000Z',
  createDate: '2026-09-02T10:00:00.000Z',
  followUpCode: '48790321',
  receipts: [],
  shop: {
    instagramName: 'توکیتا',
    instagramUsername: 'tokita.shop',
    profilePictureUrl: null,
    address: 'میدان ونک',
    postalcode: '1435894511',
    phone: '02128423842',
    shippingMethod: 'پست پیشتاز',
    cityName: 'تهران',
    provinceName: 'تهران',
  },
};

const WHEN = '1404/06/18 14:30';

describe('buildInvoiceDocument', () => {
  it('sets an A4 page box', () => {
    expect(buildInvoiceDocument(order, LABELS, WHEN, 'یزد', 'یزد')).toContain('size: A4 portrait');
  });

  it('renders every line item, not only the first', () => {
    const html = buildInvoiceDocument(order, LABELS, WHEN, 'یزد', 'یزد');
    expect(html).toContain('کیت هوشمند');
    expect(html).toContain('فیلتر یدک');
  });

  it('joins line options into a compact sub-line under the product name', () => {
    const html = buildInvoiceDocument(order, LABELS, WHEN, 'یزد', 'یزد');
    expect(html).toContain('رنگ: مشکی، سایز: L');
  });

  it('reads totals directly from itemsTotal/shippingTotal/grandTotal, not recomputed from lines', () => {
    const html = buildInvoiceDocument(order, LABELS, WHEN, 'یزد', 'یزد');
    expect(html).toContain('۷۰۰,۰۰۰'); // order.itemsTotal (stored)
    expect(html).toContain('۷۶۰,۰۰۰'); // order.grandTotal (stored)
    // The fixture's lines sum to 450_000 + 190_000 = 640_000 -- deliberately different from
    // itemsTotal above. If a future change started summing order.lines instead of reading
    // itemsTotal, this figure would appear in the output and this assertion would catch it.
    expect(html).not.toContain('۶۴۰,۰۰۰');
  });

  it('writes the grand total (order.grandTotal, not a line-sum) in Persian words', () => {
    expect(buildInvoiceDocument(order, LABELS, WHEN, 'یزد', 'یزد')).toContain(
      'هفتصد و شصت هزار تومان',
    );
  });

  it('prints followUpCode as the tracking code in Persian digits', () => {
    const html = buildInvoiceDocument(order, LABELS, WHEN, 'یزد', 'یزد');
    expect(html).toContain('۴۸۷۹۰۳۲۱');
  });

  it('prints a dash when followUpCode is absent', () => {
    const noTracking = { ...order, followUpCode: null };
    const html = buildInvoiceDocument(noTracking, LABELS, WHEN, 'یزد', 'یزد');
    expect(html).toContain('—');
  });

  it('shows the before-discount unit total only for a line whose compareAtPrice is higher than unitPrice', () => {
    const html = buildInvoiceDocument(order, LABELS, WHEN, 'یزد', 'یزد');
    // line 1: compareAtPrice 485_000 > unitPrice 450_000 -> discount of 35_000
    expect(html).toContain('۳۵,۰۰۰');
  });

  it('treats a compareAtPrice EQUAL to unitPrice as no discount -- only a STRICTLY higher compareAtPrice counts', () => {
    // `hasDiscount = compareAtPrice != null && compareAtPrice > unitPrice` -- the existing
    // fixture only ever exercises "greater than" (line 1) and "null" (line 2). Never "equal",
    // which is a real shape a merchant can create (compareAtPrice set to the same value as the
    // selling price) and takes the SAME `!hasDiscount` branch as null, but through a different
    // condition (`>` being false rather than `!= null` being false) -- worth its own case.
    const equalPrice = {
      ...order,
      lines: [{ ...order.lines[1], compareAtPrice: order.lines[1].unitPrice }], // 95_000 === 95_000
    };
    const html = buildInvoiceDocument(equalPrice, LABELS, WHEN, 'یزد', 'یزد');
    const rowStart = html.indexOf('فیلتر یدک');
    expect(rowStart).toBeGreaterThan(-1);
    const row = html.slice(rowStart, rowStart + 400);
    expect(row).toContain('۹۵,۰۰۰'); // unit price column
    // Before-discount total AND after-discount total both read 95_000 * qty(2) = 190_000 --
    // proving no discount was subtracted, not that the discount column happens to also show
    // 190_000 by a different bug.
    expect((row.match(/۱۹۰,۰۰۰/g) ?? []).length).toBe(2);
    expect(row).toMatch(/<td class="num">۰<\/td>/); // discount column is exactly zero
  });

  it('renders an empty items table, not a crash, for an order with zero lines -- and still prints the stored totals', () => {
    const noLines = { ...order, lines: [] };
    const html = buildInvoiceDocument(noLines, LABELS, WHEN, 'یزد', 'یزد');
    expect(html).toContain('<tbody></tbody>');
    // Totals are read from order.itemsTotal/grandTotal directly (see the "reads totals
    // directly..." test above) -- an empty lines array must not zero these out.
    expect(html).toContain('۷۰۰,۰۰۰');
    expect(html).toContain('۷۶۰,۰۰۰');
  });

  it('escapes HTML in a product title', () => {
    const nasty = {
      ...order,
      lines: [{ ...order.lines[0], title: '<img src=x onerror=1>' }],
    };
    const html = buildInvoiceDocument(nasty, LABELS, WHEN, 'یزد', 'یزد');
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img');
  });

  it('renders «زمان ثبت» with Persian digits, not Latin', () => {
    const html = buildInvoiceDocument(order, LABELS, '1404/06/18 14:30', 'یزد', 'یزد');
    expect(html).toContain('۱۴۰۴/۰۶/۱۸ ۱۴:۳۰');
    expect(html).not.toContain('1404/06/18 14:30');
  });

  it('renders order.paymentMethod through the known-method label map', () => {
    const html = buildInvoiceDocument(order, LABELS, WHEN, 'یزد', 'یزد');
    expect(html).toContain('کارت به کارت');
  });

  it('falls back to the raw paymentMethod value for an unknown/legacy value', () => {
    const legacy = { ...order, paymentMethod: 'zarinpal' };
    const html = buildInvoiceDocument(legacy, LABELS, WHEN, 'یزد', 'یزد');
    expect(html).toContain('zarinpal');
  });

  it('falls back to "پست" for the shipping method when both shippingTitle and the shop default are missing', () => {
    const bothMissing = { ...order, shippingTitle: null, shop: null };
    const html = buildInvoiceDocument(bothMissing, LABELS, WHEN, 'یزد', 'یزد');
    expect(html).toContain('روش ارسال</b>پست');
  });

  it('still produces a document, with blank seller lines, when order.shop is null', () => {
    const noShop = { ...order, shop: null };
    const html = buildInvoiceDocument(noShop, LABELS, WHEN, 'یزد', 'یزد');
    expect(html).toContain('فروشنده');
    expect(html).not.toContain('undefined');
    expect(html).not.toContain('null');
  });

  // Same Task 4 (Back repo) concern as buildLabelDocument.test.ts's equivalent case: the
  // backend's own instagram-name-fallback test only covers `name: null`, never `name: ''`.
  // This builder must render both falsy shapes identically since it does not reimplement the
  // fallback itself.
  it('renders shop.instagramName === "" the same as shop.instagramName === null', () => {
    const empty = { ...order, shop: { ...order.shop!, instagramName: '' } };
    const nullName = { ...order, shop: { ...order.shop!, instagramName: null } };
    const htmlEmpty = buildInvoiceDocument(empty, LABELS, WHEN, 'یزد', 'یزد');
    const htmlNull = buildInvoiceDocument(nullName, LABELS, WHEN, 'یزد', 'یزد');

    expect(htmlEmpty).not.toContain('null');
    expect(htmlEmpty).not.toContain('undefined');
    expect(htmlNull).not.toContain('null');
    expect(htmlNull).not.toContain('undefined');

    const coTxt = /<div class="co-txt"><b>[^<]*<\/b><span>@[^<]*<\/span><\/div>/;
    expect(htmlEmpty.match(coTxt)?.[0]).toBe(
      '<div class="co-txt"><b></b><span>@tokita.shop</span></div>',
    );
    expect(htmlEmpty.match(coTxt)?.[0]).toBe(htmlNull.match(coTxt)?.[0]);
  });
});
