import { LayoutPage } from '@/components/Layout/LayoutPage';
import { SubscriptionBoard } from './SubscriptionBoard';
import { DashboardStats } from './DashboardStats';

export const DashboardPage = () => {
  return (
    <LayoutPage className="px-3">
      <div className="_dashboard-page space-y-4">
        <SubscriptionBoard />

        <DashboardStats />
      </div>
    </LayoutPage>
  );
};
