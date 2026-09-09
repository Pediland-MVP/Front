'use client';

import { useTranslations } from 'next-intl';

import { LayoutPage } from '@/components/Layout/LayoutPage';
import { StoreSettings } from '@/components/Commerce/StoreSettings/StoreSettings';

/**
 * `/products/settings` — "تنظیمات فروشگاه", under "کالا و خدمات". Sibling of `/products/shipping`
 * for the same reason that page gives: this is a property of what the shop sells (the default
 * completion message a new product starts with), not a general account setting.
 */
export default function Page() {
  const t = useTranslations('Commerce.StoreSettings');

  return (
    <LayoutPage>
      <h1 className="sr-only">{t('title')}</h1>
      <StoreSettings />
    </LayoutPage>
  );
}
