import useUser from "@/hooks/useUser";
import { useSubscriptionData } from "@/store/subscriptionStore";

import { DashboardStats, LayoutPage, SubscriptionBoard } from "@components";

export const DashboardPage = () => {
  useSubscriptionData();
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
