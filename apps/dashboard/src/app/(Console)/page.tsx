'use client';

import { DashboardBannerCarousel } from '@/components/Console/Dashboard/DashboardBannerCarousel';
import { DashboardInstagramBanner } from '@/components/Console/Dashboard/DashboardInstagramBanner';
import { DashboardStats } from '@/components/Console/Dashboard/DashboardStats';
import { DashboardTelegramBanner } from '@/components/Console/Dashboard/DashboardTelegramBanner';
import { SubscriptionBoard } from '@/components/Console/Dashboard/SubscriptionBoard';
import { LayoutPage } from '@/components/Layout/LayoutPage';
import { useLocale } from 'next-intl';

export default function DashboardPage() {
  const locale = useLocale();

  return (
    <LayoutPage className="px-3">
      <div className="_dashboard-page space-y-5 md:pt-4">
        <DashboardBannerCarousel />
        <SubscriptionBoard />

        <DashboardStats />

        {locale === 'fa' && (
          <div className="grid gap-3 md:grid-cols-2">
            <DashboardTelegramBanner />
            <DashboardInstagramBanner />
          </div>
        )}
      </div>
    </LayoutPage>
  );
}
