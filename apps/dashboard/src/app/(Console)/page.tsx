'use client';

import { DashboardBannerCarousel } from '@/components/Console/Dashboard/DashboardBannerCarousel';
import { DashboardStats } from '@/components/Console/Dashboard/DashboardStats';
import { SubscriptionBoard } from '@/components/Console/Dashboard/SubscriptionBoard';
import { LayoutPage } from '@/components/Layout/LayoutPage';

export default function DashboardPage() {
  return (
    <LayoutPage className="px-3">
      <div className="_dashboard-page space-y-5 md:pt-4">
        <SubscriptionBoard />

        <DashboardStats />

        <DashboardBannerCarousel />
      </div>
    </LayoutPage>
  );
}
