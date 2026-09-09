import { describe, it, expect } from 'vitest';
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
  zarinpal: 'زرین‌پال',
  cardToCard: 'کارت به کارت',
};

const order: any = {
  id: '9c4a21e7-1111-2222-3333-444455556666',
  paymentMethod: 'zarinpal',
  instagram: {
    name: 'توکیتا',
    username: 'tokita.shop',
    profilePictureUrl: null,
    shopAddress: {
      address: 'میدان ونک',
      postalcode: '1435894511',
      phone: '02128423842',
      shippingMethod: 'پست پیشتاز',
      city: { name: 'تهران', province: { name: 'تهران' } },
    },
  },
  orderShipping: {
    firstname: 'علی',
    lastname: 'سری‌یزدی',
    mobile: '09131590982',
    postalcode: '8916869534',
    address: 'صفاییه',
    city: { name: 'یزد', province: { name: 'یزد' } },
  },
  orderProducts: [
    {
      id: 'op-1',
      price: 485_000,
      discountPrice: 450_000,
      quantity: 1,
      shippingCost: 50_000,
      product: { title: 'کیت هوشمند' },
      attributeValues: [{ value: 'مشکی' }, { value: 'سایز L' }],
    },
    {
      id: 'op-2',
      price: 95_000,
      discountPrice: null,
      quantity: 2,
      shippingCost: null,
      product: { title: 'فیلتر یدک' },
      attributeValues: [],
    },
  ],
  transactions: [
    { id: 't-1', status: 'failed', refId: '111', createDate: '2026-05-01T10:00:00Z' },
    { id: 't-2', status: 'success', refId: '48790321', createDate: '2026-05-14T11:54:00Z' },
  ],
};

const WHEN = '۱۴۰۵/۰۲/۲۴ ۱۵:۲۴';

describe('buildInvoiceDocument', () => {
  it('sets an A4 page box', () => {
    expect(buildInvoiceDocument(order, LABELS, WHEN)).toContain('size: A4 portrait');
  });

  it('renders every line item, not only the first', () => {
    const html = buildInvoiceDocument(order, LABELS, WHEN);
    expect(html).toContain('کیت هوشمند');
    expect(html).toContain('فیلتر یدک');
  });

  it('lists variant attributes under the product name', () => {
    const html = buildInvoiceDocument(order, LABELS, WHEN);
    expect(html).toContain('مشکی · سایز L');
  });

  it('totals across all lines and adds shipping', () => {
    const html = buildInvoiceDocument(order, LABELS, WHEN);
    expect(html).toContain('۶۴۰,۰۰۰'); // subtotal
    expect(html).toContain('۶۹۰,۰۰۰'); // payable
  });

  it('writes the payable amount in Persian words', () => {
    expect(buildInvoiceDocument(order, LABELS, WHEN)).toContain('ششصد و نود هزار تومان');
  });

  it('takes the refId of the newest successful transaction', () => {
    const html = buildInvoiceDocument(order, LABELS, WHEN);
    expect(html).toContain('۴۸۷۹۰۳۲۱');
    expect(html).not.toContain('۱۱۱<');
  });

  it('prints a dash when no successful transaction carries a refId', () => {
    const cardToCard = { ...order, paymentMethod: 'card_to_card', transactions: [] };
    expect(buildInvoiceDocument(cardToCard, LABELS, WHEN)).toContain('—');
  });

  it('escapes HTML in a product title', () => {
    const nasty = {
      ...order,
      orderProducts: [{ ...order.orderProducts[0], product: { title: '<img src=x onerror=1>' } }],
    };
    const html = buildInvoiceDocument(nasty, LABELS, WHEN);
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img');
  });

  it('renders a deleted product without crashing', () => {
    const deleted = {
      ...order,
      orderProducts: [{ ...order.orderProducts[0], product: null }],
    };
    expect(() => buildInvoiceDocument(deleted, LABELS, WHEN)).not.toThrow();
  });
});
