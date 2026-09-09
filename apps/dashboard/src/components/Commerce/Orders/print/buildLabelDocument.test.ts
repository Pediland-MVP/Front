import { describe, it, expect } from 'vitest';

import type { OrderDetailView } from '@/types/commerceOrders';

import { buildLabelDocument } from './buildLabelDocument';

const LABELS = {
  sender: 'فرستنده',
  receiver: 'گیرنده',
  state: 'استان',
  city: 'شهر',
  address: 'آدرس',
  phone: 'تلفن',
  postalCode: 'کدپستی',
  stickerArea: 'محل نصب لیبل',
  shippingMethod: 'روش ارسال',
  orderRef: 'شناسه سفارش',
  defaultShippingMethod: 'پست',
};

const order: OrderDetailView = {
  orderId: '9c4a21e7-1111-2222-3333-444455556666',
  status: 'processing',
  cancelReason: null,
  kind: 'physical',
  lines: [],
  itemsTotal: 0,
  shippingTotal: 0,
  grandTotal: 0,
  paymentMethod: 'card_to_card',
  recipientName: 'علی سری‌یزدی',
  mobile: '09131590982',
  cityId: 2,
  address: 'صفاییه، خیابان کاشانی، پلاک ۵۵',
  plate: null,
  unit: null,
  postalcode: '8916869534',
  placedAt: '2026-09-02T10:00:00.000Z',
  shippingTitle: 'پست پیشتاز',
  shippingKind: null,
  shippingSettlement: null,
  paidAt: null,
  createDate: '2026-09-02T10:00:00.000Z',
  receipts: [],
  shop: {
    instagramName: 'توکیتا',
    instagramUsername: 'tokita.shop',
    profilePictureUrl: 'https://cdn.example/pic.jpg',
    address: 'میدان ونک، برزیل شرقی، پلاک ۱۰۴',
    postalcode: '1435894511',
    phone: '02128423842',
    shippingMethod: 'پست پیشتاز',
    cityName: 'تهران',
    provinceName: 'تهران',
  },
};

describe('buildLabelDocument', () => {
  it('sets an A5 page box', () => {
    expect(buildLabelDocument(order, LABELS, 'یزد', 'یزد')).toContain('size: A5 portrait');
  });

  it('prints the shop instagram name as the sender, as-is (no fallback reimplemented)', () => {
    expect(buildLabelDocument(order, LABELS, 'یزد', 'یزد')).toContain('توکیتا');
  });

  it('renders whatever order.shop.instagramName already carries, even a raw @handle', () => {
    const withHandleName = {
      ...order,
      shop: { ...order.shop!, instagramName: '@tokita.shop' },
    };
    expect(buildLabelDocument(withHandleName, LABELS, 'یزد', 'یزد')).toContain('@tokita.shop');
  });

  it('renders both parties, the buyer city/province passed by the caller, and the sticker area', () => {
    const html = buildLabelDocument(order, LABELS, 'یزد', 'یزد');
    expect(html).toContain('علی سری‌یزدی');
    expect(html).toContain('محل نصب لیبل');
    expect(html).toContain('استان:</span> یزد');
    expect(html).toContain('شهر:</span> یزد');
  });

  it('renders digits in Persian', () => {
    const html = buildLabelDocument(order, LABELS, 'یزد', 'یزد');
    expect(html).toContain('۰۹۱۳۱۵۹۰۹۸۲');
    expect(html).not.toContain('09131590982');
  });

  it('prints a BF- reference built from the first 8 characters of the order id', () => {
    expect(buildLabelDocument(order, LABELS, 'یزد', 'یزد')).toContain('BF-9C4A21E7');
  });

  it('prefers order.shippingTitle over the shop default for the printed shipping method', () => {
    const html = buildLabelDocument(order, LABELS, 'یزد', 'یزد');
    expect(html).toContain('روش ارسال:&nbsp;</span> پست پیشتاز');
  });

  it('falls back to the shop default shipping method when shippingTitle is null', () => {
    const noTitle = { ...order, shippingTitle: null };
    const html = buildLabelDocument(noTitle, LABELS, 'یزد', 'یزد');
    expect(html).toContain('روش ارسال:&nbsp;</span> پست پیشتاز');
  });

  it('still produces a document, with blank sender lines, when order.shop is null', () => {
    const noShop = { ...order, shop: null };
    const html = buildLabelDocument(noShop, LABELS, 'یزد', 'یزد');
    expect(html).toContain('فرستنده');
    expect(html).not.toContain('undefined');
    expect(html).not.toContain('null');
  });

  it('falls back to the "defaultShippingMethod" label when neither shippingTitle nor the shop default exist', () => {
    const bothMissing = { ...order, shippingTitle: null, shop: null };
    const html = buildLabelDocument(bothMissing, LABELS, 'یزد', 'یزد');
    expect(html).toContain('روش ارسال:&nbsp;</span> پست');
  });

  it('escapes HTML in user-controlled text', () => {
    const nasty = { ...order, address: '<script>alert(1)</script>' };
    const html = buildLabelDocument(nasty, LABELS, 'یزد', 'یزد');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
