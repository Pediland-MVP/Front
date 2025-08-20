"use client";

import { StatsNamespace } from "@/types/stats";
import { useTranslations } from "next-intl";
import useSWRImmutable from "swr/immutable";
// Just UI Imports Below
import LoadingSpinner from "@/components/ui/loadingSpinner";
import useUser from "@/hooks/useUser";
import DashboardHome from "./components/dashboardHome";
import StartKit from "./components/startKit";

export default function Dashboard() {
  const t = useTranslations("Console");
  const {
    data: stats,
    error: statsError,
    isLoading: isStatsLoading,
  } = useSWRImmutable<StatsNamespace.Overall>(
    `${process.env.NEXT_PUBLIC_BACK_API_URL}/stats/overall`,
  );
  const { hasSubscription, hasInstagram, isLoading, error } = useUser();

  if (isLoading) {
    return (
      <div className="_dashboard h-full">
        <div className="_wrapper flex min-h-[calc(100vh-3.25rem)] items-center justify-center md:min-h-[calc(100vh-5.5rem)]">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="_dashboard h-full">
      <div className="_wrapper flex h-full flex-1 flex-col">
        {hasInstagram ? <DashboardHome /> : <StartKit />}
      </div>
    </div>
  );
}
