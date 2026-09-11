'use client';

import { useTranslations } from 'next-intl';

import { LayoutPage } from '@/components/Layout/LayoutPage';
import { ShippingSettings } from '@/components/Commerce/Shipping/ShippingSettings';

/**
 * `/products/shipping` — the merchant's shipping methods, under "کالا و خدمات".
 *
 * It lives beside the catalogue rather than under general settings because it is a property of
 * what the shop sells: the price a buyer is quoted at checkout comes from here, and the merchant
 * sets it in the same visit as prices and stock.
 */
export default function Page() {
  const t = useTranslations('Commerce.Shipping');

  return (
    <LayoutPage>
      <h1 className="sr-only">{t('title')}</h1>
      <ShippingSettings />
    </LayoutPage>
  );
}
