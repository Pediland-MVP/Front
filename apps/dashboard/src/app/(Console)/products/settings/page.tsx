'use client';

import { useTranslations } from 'next-intl';

import { LayoutPage } from '@/components/Layout/LayoutPage';
import { ShopAddressSettings } from '@/components/Commerce/Shop/ShopAddressSettings';
import { StoreSettings } from '@/components/Commerce/StoreSettings/StoreSettings';

/**
 * `/products/settings` — "تنظیمات فروشگاه", under "کالا و خدمات". Sibling of `/products/shipping`
 * for the same reason that page gives: these are properties of what the shop sells/ships, not
 * general account settings.
 *
 * Hosts TWO independent settings forms as sections on one page -- the workspace's return address
 * (`ShopAddressSettings`, formerly its own `/products/shop` page, now a redirect here) and the
 * default final-message text (`StoreSettings`). Each keeps its own fetch/save/permission gate
 * (`order:manage` vs `product:edit`); merging them here is presentation only, not a shared form.
 */
export default function Page() {
  const t = useTranslations('Commerce.StoreSettings');
  const tShop = useTranslations('Settings.ShopAddress');

  return (
    <LayoutPage>
      <h1 className="sr-only">{t('title')}</h1>
      <div className="flex flex-col gap-8">
        <section>
          <h2 className="text-primary mb-3 text-lg font-semibold">{tShop('title')}</h2>
          <ShopAddressSettings />
        </section>
        <section>
          <h2 className="text-primary mb-3 text-lg font-semibold">{t('title')}</h2>
          <StoreSettings />
        </section>
      </div>
    </LayoutPage>
  );
}
