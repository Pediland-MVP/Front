import useUser from "@/hooks/useUser";

import { DashboardStats, LayoutPage, SubscriptionBoard } from "@components";

export const DashboardPage = () => {
  const { user } = useUser();

  return (
    <LayoutPage className="px-3">
      <div className="_dashboard-page space-y-4">
        <SubscriptionBoard />

        <DashboardStats />
      </div>
    </LayoutPage>
  );
};
