"use client";

import useSWRImmutable from "swr/immutable";
import { fetcher } from "@/hooks/swr/fetcher";
import { StatsNamespace } from "@/types/stats";
import { useTranslations } from "next-intl";
// Just UI Imports Below
import useUser from "@/hooks/useUser";
import LoadingSpinner from "@/components/ui/loadingSpinner";
import StartKit from "./components/startKit";
import DashboardHome from "./components/dashboardHome";

export default function Dashboard() {
  const {
    data: stats,
    error: statsError,
    isLoading: isStatsLoading,
  } = useSWRImmutable<StatsNamespace.Overall>(
    `${process.env.NEXT_PUBLIC_BACK_API_URL}/stats/overall`,
    fetcher
  );

  const t = useTranslations("Console");

  const { hasSubscription, hasInstagram, isLoading, error } = useUser();

  if (isLoading) {
    return (
      <div className="_dashboard h-full">
        <div className="_wrapper min-h-[calc(100vh-3.25rem)] md:min-h-[calc(100vh-5.5rem)] flex items-center justify-center">
          <LoadingSpinner className="h-full" />
        </div>
      </div>
    );
  }

  if (!hasSubscription && !hasInstagram) {
    return (
      <div className="_dashboard h-full">
        <div className="_wrapper min-h-[calc(100vh-3.25rem)] md:min-h-[calc(100vh-5.5rem)] h-full">
          <StartKit />
        </div>
      </div>
    );
  }

  return (
    <div className="_dashboard h-full">
      <div className="_wrapper min-h-[calc(100vh-3.25rem)] md:min-h-[calc(100vh-5.5rem)]">
        {!hasSubscription ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            test
          </div>
        ) : (
          <DashboardHome />
        )}
      </div>
    </div>
  );
}
