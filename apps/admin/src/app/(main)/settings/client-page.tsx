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

export type SettingsKey =
  | "DEFAULT_FREE_PLAN_DURATION_IDS"
  | "SMS_PROVIDER"
  | "PAYMENT_DEFAULT_GATEWAY";

export interface SettingsData {
  settings: {
    DEFAULT_FREE_PLAN_DURATION_IDS: number[];
    SMS_PROVIDER: string;
    PAYMENT_DEFAULT_GATEWAY: string;
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
    <SettingsForm
      isRefetching={isValidating && !!settingsRes}
      data={data}
      plans={plans}
      mutate={mutate}
    />
  );
}
