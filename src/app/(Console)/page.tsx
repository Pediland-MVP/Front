"use client";

import { DashboardInstagramBanner } from "@/components/Console/Dashboard/DashboardInstagramBanner";
import { DashboardStats } from "@/components/Console/Dashboard/DashboardStats";
import { DashboardTelegramBanner } from "@/components/Console/Dashboard/DashboardTelegramBanner";
import { SubscriptionBoard } from "@/components/Console/Dashboard/SubscriptionBoard";
import { LayoutPage } from "@/components/Layout/LayoutPage";

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
