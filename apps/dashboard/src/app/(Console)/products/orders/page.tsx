'use client';

import { LayoutCard } from '@/components/Layout/LayoutCard';
import { OrdersListPage } from '@/components/Commerce/Orders/OrdersListPage';

export default function Page() {
  return (
    <LayoutCard className="_products">
      <OrdersListPage />
    </LayoutCard>
  );
}
