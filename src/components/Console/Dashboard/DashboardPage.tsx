// TODO: Should Refactor
import { SubscriptionProvider } from "@/app/(Console)/settings/subscription/context/SubscriptionContext";

import { DashboardStats, LayoutPage, SubscriptionBoard } from "@components";

export const DashboardPage = () => {
  return (
    <LayoutPage className="px-3">
      <div className="_dashboard-page space-y-4">
        <SubscriptionProvider>
          <SubscriptionBoard />
        </SubscriptionProvider>

        <DashboardStats />
      </div>
    </LayoutPage>
  );
};
