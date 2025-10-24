"use client";

import useUser from "@/hooks/useUser";
import { AxiosError } from "axios";
import { useSearchParams } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import useSWR from "swr";
import useSWRImmutable from "swr/immutable";
// TODO: Refactor Types & Schemas
import { PlanNamespace } from "@/types/plans/plan.namespace";
import { SubscriptionNamespace } from "@/types/subscriptions/subscription.namspace";

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

export interface SubscriptionContext {
  active: {
    choosePlan: boolean;
    subscriptionInfo: boolean;
  };
  setActive: React.Dispatch<
    React.SetStateAction<{
      choosePlan: boolean;
      subscriptionInfo: boolean;
    }>
  >;
  subscriptions: SubscriptionNamespace.GET.Subscriptions["items"];
  plans: PlanNamespace.GET.PlansData["plans"];
  plansData?: PlanNamespace.GET.PlansData;
  discountCode?: string;
  setDiscountCode: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
}

export const SubscriptionContext = createContext<SubscriptionContext | null>(
  null,
);

interface SubscriptionProviderProps {
  children: React.ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [initialized, setInitialized] = useState<boolean>(false);
  const [discountCode, setDiscountCode] = useState<string>("");
  const [active, setActive] = useState({
    subscriptionInfo: false,
    choosePlan: false,
  });

  const { isAuthenticated } = useUser();

  const subscriptionApiUrl = `${API_URL}/subscriptions?page=1&limit=5&status=active,reserved`;
  const {
    data: subscriptionsData,
    isLoading: isSubscriptionsLoading,
    error: subscriptionsError,
  } = useSWRImmutable<SubscriptionNamespace.GET.Subscriptions>(
    isAuthenticated ? subscriptionApiUrl : null,
    {
      revalidateOnMount: true,
      refreshInterval: 30_000,
      shouldRetryOnError: false,
      errorRetryCount: 0,
    },
  );
  const subscriptions = subscriptionsData?.items;

  const planApiUrl = `${API_URL}/plans${discountCode ? `?discountCode=${discountCode}` : ""}`;
  const {
    data: plansData,
    isLoading: isPlansLoading,
    error: plansError,
    mutate,
  } = useSWR<PlanNamespace.GET.PlansData, AxiosError>(
    isAuthenticated ? planApiUrl : null,
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
        choosePlan: true,
        subscriptionInfo: false,
      });
      setInitialized(true);
      return;
    }

    if (subscriptionsData?.items.length) {
      setActive({
        subscriptionInfo: true,
        choosePlan: false,
      });
    }

    setInitialized(true);
  }, [subscriptionsData, plans]);

  useEffect(() => {
    if (isPlansLoading && isSubscriptionsLoading) return;

    if (searchParams.get("active") === "choosePlan") {
      setActive({
        subscriptionInfo: false,
        choosePlan: true,
      });
      setInitialized(true);
    }
  }, [searchParams, isPlansLoading, isSubscriptionsLoading]);

  useEffect(() => {
    setIsLoading(isPlansLoading || isSubscriptionsLoading);
  }, [isPlansLoading, isSubscriptionsLoading]);

  return (
    <SubscriptionContext.Provider
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
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptionContext() {
  const context = useContext(SubscriptionContext);

  if (!context) {
    throw new Error(
      "useSubscriptionContext must be used within a SubscriptionProvider",
    );
  }

  return context;
}
