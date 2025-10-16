"use client";

import { LoaderSpin } from "@/components/ui-custom/LoaderSpin";
import useUser from "@/hooks/useUser";
import { PlanNamespace } from "@/types/plans/plan.namespace";
import { SubscriptionNamespace } from "@/types/subscriptions/subscription.namspace";
import { AxiosError } from "axios";
import { useSearchParams } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import useSWR from "swr";
import useSWRImmutable from "swr/immutable";

export interface UpgradeContext {
  active: {
    subscriptionInfo: boolean;
    planSelection: boolean;
  };
  setActive: React.Dispatch<
    React.SetStateAction<{
      subscriptionInfo: boolean;
      planSelection: boolean;
    }>
  >;
  subscriptions: SubscriptionNamespace.GET.Subscriptions["items"];
  plans: PlanNamespace.GET.PlansData["plans"];
  plansData?: PlanNamespace.GET.PlansData;
  discountCode?: string;
  setDiscountCode: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
}

export const UpgradeContext = createContext<UpgradeContext | null>(null);

export function UpgradeProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [initialized, setInitialized] = useState<boolean>(false);

  const [active, setActive] = useState({
    subscriptionInfo: false,
    planSelection: false,
  });

  const [discountCode, setDiscountCode] = useState<string>("");

  const { isAuthenticated } = useUser();

  const {
    data: subscriptionsData,
    isLoading: isSubscriptionsLoading,
    error: subscriptionsError,
  } = useSWRImmutable<SubscriptionNamespace.GET.Subscriptions>(
    isAuthenticated
      ? `${process.env.NEXT_PUBLIC_BACK_API_URL}/subscriptions?page=1&limit=5&status=active,reserved`
      : null,
    {
      revalidateOnMount: true,
      refreshInterval: 30_000,
      shouldRetryOnError: false,
      errorRetryCount: 0,
    },
  );
  const {
    data: plansData,
    isLoading: isPlansLoading,
    error: plansError,
    mutate,
  } = useSWR<PlanNamespace.GET.PlansData, AxiosError>(
    isAuthenticated
      ? `${process.env.NEXT_PUBLIC_BACK_API_URL}/plans${discountCode ? `?discountCode=${discountCode}` : ""}`
      : null,
    {
      shouldRetryOnError: false,
      errorRetryCount: 0,
    },
  );
  const plans = plansData?.plans;

  useEffect(() => {
    if (initialized) return;
    if (isPlansLoading || isSubscriptionsLoading) return;
    if (!subscriptionsData?.items?.length) {
      setActive({
        subscriptionInfo: false,
        planSelection: true,
      });
      setInitialized(true);
      return;
    }

    if (subscriptionsData?.items.length) {
      setActive({
        subscriptionInfo: true,
        planSelection: false,
      });
    }

    setInitialized(true);
  }, [subscriptionsData, plans]);

  useEffect(() => {
    if (isPlansLoading && isSubscriptionsLoading) return;
    if (searchParams.get("active") === "planSelection") {
      setActive({
        subscriptionInfo: false,
        planSelection: true,
      });
      setInitialized(true);
    }
  }, [searchParams, isPlansLoading, isSubscriptionsLoading]);

  useEffect(() => {
    setIsLoading(isPlansLoading || isSubscriptionsLoading);
  }, [isPlansLoading, isSubscriptionsLoading]);

  return (
    <UpgradeContext.Provider
      value={{
        active,
        setActive,
        subscriptions: subscriptionsData?.items || [],
        plans: plans || [],
        plansData,
        discountCode,
        setDiscountCode,
        isLoading,
      }}
    >
      {children}
    </UpgradeContext.Provider>
  );
}

export function useUpgradeContext() {
  const context = useContext(UpgradeContext);
  if (!context) {
    throw new Error("useUpgradeContext must be used within a UpgradeProvider");
  }
  return context;
}
