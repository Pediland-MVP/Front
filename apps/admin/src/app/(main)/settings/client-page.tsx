// src/app/(main)/settings/client-page.tsx
"use client";

import { notFound } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/hooks/swr/api-client";
import { useAuth } from "@/hooks/use-auth";
import { Loading } from "@/components/loading";
import { FetchError } from "@/components/fetch-error";
import { Plan } from "@/types/subscription";
import SettingsForm from "./settings-form";
import ReconcileMetricsCard from "./reconcile-metrics-card";

export type SettingsKey =
  | "DEFAULT_FREE_PLAN_DURATION_IDS"
  | "SMS_PROVIDER"
  | "PAYMENT_DEFAULT_GATEWAY"
  | "APIFY_TOKENS";

export interface ApifyToken {
  name: string;
  token: string;
}

export interface SettingsData {
  settings: {
    DEFAULT_FREE_PLAN_DURATION_IDS: number[];
    SMS_PROVIDER: string;
    PAYMENT_DEFAULT_GATEWAY: string;
    APIFY_TOKENS: ApifyToken[];
  };
  options: Record<SettingsKey, string[] | null>;
}

export default function SettingsPageClient() {
  const { user } = useAuth();

  const {
    data: settingsRes,
    isLoading,
    isValidating,
    error,
    mutate,
  } = useSWR("/settings", fetcher, { keepPreviousData: true });

  // Plan durations power the multi-select for DEFAULT_FREE_PLAN_DURATION_IDS.
  const { data: plansRes } = useSWR("/plans", fetcher, {
    keepPreviousData: true,
  });

  // Settings cover environment-level configuration; hide from low-privilege KAM.
  if (user && user.role === "kam") notFound();

  if ((!settingsRes && isLoading) || !user) return <Loading />;
  if (error) return <FetchError />;

  const data: SettingsData | undefined = settingsRes?.data;
  const plans: Plan[] = plansRes?.data || [];

  if (!data) return <FetchError />;

  return (
    <div className="flex flex-col gap-6">
      <SettingsForm
        isRefetching={isValidating && !!settingsRes}
        data={data}
        plans={plans}
        mutate={mutate}
      />
      {/* Metrics reconcile is a heavy, destructive-overwrite operation — super-admin only. */}
      {user.role === "admin" && (
        <div className="px-6 pb-6">
          <ReconcileMetricsCard />
        </div>
      )}
    </div>
  );
}
