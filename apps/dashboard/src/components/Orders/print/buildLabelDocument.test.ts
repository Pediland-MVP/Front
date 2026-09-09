import { describe, it, expect } from 'vitest';
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
};

const order: any = {
  id: '9c4a21e7-1111-2222-3333-444455556666',
  instagram: {
    id: 'ig-1',
    name: 'توکیتا',
    username: 'tokita.shop',
    profilePictureUrl: 'https://cdn.example/pic.jpg',
    shopAddress: {
      address: 'میدان ونک، برزیل شرقی، پلاک ۱۰۴',
      postalcode: '1435894511',
      phone: '02128423842',
      shippingMethod: 'پست پیشتاز',
      city: { id: 1, name: 'تهران', province: { id: 1, name: 'تهران' } },
    },
  },
  orderShipping: {
    firstname: 'علی',
    lastname: 'سری‌یزدی',
    mobile: '09131590982',
    postalcode: '8916869534',
    address: 'صفاییه، خیابان کاشانی، پلاک ۵۵',
    city: { id: 2, name: 'یزد', province: { id: 2, name: 'یزد' } },
  },
};

describe('buildLabelDocument', () => {
  it('sets an A5 page box', () => {
    expect(buildLabelDocument(order, LABELS)).toContain('size: A5 portrait');
  });

  it('prints the instagram name as the sender', () => {
    expect(buildLabelDocument(order, LABELS)).toContain('توکیتا');
  });

  it('falls back to the @username when the instagram has no name', () => {
    const noName = { ...order, instagram: { ...order.instagram, name: null } };
    expect(buildLabelDocument(noName, LABELS)).toContain('@tokita.shop');
  });

  it('renders both parties and the sticker area', () => {
    const html = buildLabelDocument(order, LABELS);
    expect(html).toContain('علی سری‌یزدی');
    expect(html).toContain('محل نصب لیبل');
  });

  it('renders digits in Persian', () => {
    const html = buildLabelDocument(order, LABELS);
    expect(html).toContain('۰۹۱۳۱۵۹۰۹۸۲');
    expect(html).not.toContain('09131590982');
  });

  it('prints a BF- reference built from the first 8 characters of the order id', () => {
    expect(buildLabelDocument(order, LABELS)).toContain('BF-9C4A21E7');
  });

  it('still produces a document when the shop address is missing', () => {
    const noAddress = { ...order, instagram: { ...order.instagram, shopAddress: null } };
    const html = buildLabelDocument(noAddress, LABELS);
    expect(html).toContain('فرستنده');
    expect(html).not.toContain('undefined');
    expect(html).not.toContain('null');
  });

  it('escapes HTML in user-controlled text', () => {
    const nasty = {
      ...order,
      orderShipping: { ...order.orderShipping, address: '<script>alert(1)</script>' },
    };
    const html = buildLabelDocument(nasty, LABELS);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
