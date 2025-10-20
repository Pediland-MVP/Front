// TODO: Should Refactor
import { UpgradeProvider } from "@/app/(Console)/settings/upgrade/context/upgrade.context";

import { DashboardStats, LayoutPage, SubscriptionBoard } from "@components";

export const DashboardPage = () => {
  return (
    <LayoutPage className="px-3">
      <div className="_dashboard-page space-y-4">
        <UpgradeProvider>
          <SubscriptionBoard />
        </UpgradeProvider>

        <DashboardStats />
      </div>
    </LayoutPage>
  );
};
