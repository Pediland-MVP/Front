'use client';

import { useTranslations } from 'next-intl';

import { LayoutPage } from '@/components/Layout/LayoutPage';
import { ShopAddressSettings } from '@/components/Commerce/Shop/ShopAddressSettings';

/**
 * `/products/shop` — the workspace's own return address, under "کالا و خدمات". Sibling of
 * `/products/shipping`: both are settings that shape what gets printed/charged on an order, so
 * they live beside the catalogue rather than under general account settings.
 */
export default function Page() {
  const t = useTranslations('Settings.ShopAddress');

  return (
    <LayoutPage>
      <h1 className="sr-only">{t('title')}</h1>
      <ShopAddressSettings />
    </LayoutPage>
  );
}
