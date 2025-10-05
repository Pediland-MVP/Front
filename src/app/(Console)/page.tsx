"use client";

import { StatsNamespace } from "@/types/stats";
import { useTranslations } from "next-intl";
import useSWRImmutable from "swr/immutable";
// Just UI Imports Below
import { LoaderSpin } from "@/components/ui-custom/LoaderSpin";
import useUser from "@/hooks/useUser";
import DashboardHome from "./components/dashboardHome";
import StartKit from "./components/startKit";
import { useHeaderFeatures } from "@/lib/stores/useHeaderFeatures";
import { useEffect, useMemo } from "react";

export default function DashboardPage() {
  const t = useTranslations("Console");

  const { setTools, setButtons, clearTools, clearButtons } = useHeaderFeatures(
    (s) => ({
      setTools: s.setTools,
      clearTools: s.clearTools,
      setButtons: s.setButtons,
      clearButtons: s.clearButtons,
    }),
  );

  const {
    data: stats,
    error: statsError,
    isLoading: isStatsLoading,
  } = useSWRImmutable<StatsNamespace.Overall>(
    `${process.env.NEXT_PUBLIC_BACK_API_URL}/stats/overall`,
  );
  const { hasSubscription, hasInstagram, isLoading, error } = useUser();

  const HeaderButton = useMemo(() => <div>Menu</div>, []);

  useEffect(() => {
    setButtons(HeaderButton);

    return () => {
      clearButtons();
    };
  }, [HeaderButton, setButtons, clearButtons]);

  if (isLoading) {
    return (
      <div className="_dashboard h-full">
        <div className="_wrapper flex min-h-[calc(100vh-3.25rem)] items-center justify-center md:min-h-[calc(100vh-5.5rem)]">
          <LoaderSpin />
        </div>
      </div>
    );
  }

  return <DashboardHome />;
}
