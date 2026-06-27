// src/app/(main)/page.tsx
'use client';

import { useAuth } from '@/hooks/use-auth';
import { MetricsOverview } from './_components/metrics-overview';

export default function Page() {
  const { user, isLoading } = useAuth();
  // Super-admins are MANAGER / ADMIN; KAM is excluded (mirrors the backend
  // RolesGuard on GET /metrics/platform/*).
  const isSuperAdmin = !!user && user.role !== 'kam';

  if (!isLoading && isSuperAdmin) {
    return <MetricsOverview />;
  }

  return <DashboardPlaceholder />;
}

function DashboardPlaceholder() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-muted aspect-video rounded-xl" />
        <div className="bg-muted aspect-video rounded-xl" />
        <div className="bg-muted aspect-video rounded-xl" />
      </div>
      <div className="bg-muted min-h-[50vh] flex-1 rounded-xl md:min-h-min" />
    </div>
  );
}
