"use client";

import {
  DashboardStats,
  DashboardTelegramBanner,
  DashboardInstagramBanner,
  LayoutPage,
  SubscriptionBoard,
} from "@components";

export default function DashboardPage() {
  return (
    <LayoutPage className="px-3">
      <div className="_dashboard-page space-y-5">
        <SubscriptionBoard />

        <DashboardStats />

        <div className="grid gap-3 md:grid-cols-2">
          <DashboardTelegramBanner />
          <DashboardInstagramBanner />
        </div>
      </div>
    </LayoutPage>
  );
}
