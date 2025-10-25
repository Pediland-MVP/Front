"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { AxiosError } from "axios";
import useUser from "@/hooks/useUser";
import useSWR from "swr";
import useSWRImmutable from "swr/immutable";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

// Types
import { PlanNamespace } from "@/types/plans/plan.namespace";
import { SubscriptionNamespace } from "@/types/subscriptions/subscription.namspace";

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

// ============ Zustand Store ============

interface ActiveTabs {
  choosePlan: boolean;
  subscriptionInfo: boolean;
  showCoupon?: boolean;
}

interface SubscriptionState {
  active: ActiveTabs;
  subscriptions: SubscriptionNamespace.GET.Subscriptions["items"];
  plans: PlanNamespace.GET.PlansData["plans"];
  plansData?: PlanNamespace.GET.PlansData;
  discountCode?: string;
  isLoading: boolean;
  initialized: boolean;

  // actions
  setActive: (active: ActiveTabs) => void;
  setDiscountCode: (code: string) => void;
  setIsLoading: (val: boolean) => void;
  setInitialized: (val: boolean) => void;
  setSubscriptions: (
    data: SubscriptionNamespace.GET.Subscriptions["items"],
  ) => void;
  setPlans: (data: PlanNamespace.GET.PlansData["plans"]) => void;
  setPlansData: (data?: PlanNamespace.GET.PlansData) => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  devtools((set) => ({
    active: {
      choosePlan: false,
      subscriptionInfo: false,
      showCoupon: false,
    },
    subscriptions: [],
    plans: [],
    plansData: undefined,
    discountCode: "",
    isLoading: false,
    initialized: false,

    setActive: (active) => set({ active }),
    setDiscountCode: (discountCode) => set({ discountCode }),
    setIsLoading: (isLoading) => set({ isLoading }),
    setInitialized: (initialized) => set({ initialized }),
    setSubscriptions: (subscriptions) => set({ subscriptions }),
    setPlans: (plans) => set({ plans }),
    setPlansData: (plansData) => set({ plansData }),
  })),
);

// ============ Hook for Data Fetching ============

export function useSubscriptionData() {
  const searchParams = useSearchParams();
  const {
    setActive,
    setSubscriptions,
    setPlans,
    setPlansData,
    setIsLoading,
    setInitialized,
    active,
    initialized,
    discountCode,
  } = useSubscriptionStore();

  const { isAuthenticated } = useUser();

  const subscriptionApiUrl = `${API_URL}/subscriptions?page=1&limit=5&status=active,reserved`;
  const { data: subscriptionsData, isLoading: isSubscriptionsLoading } =
    useSWRImmutable<SubscriptionNamespace.GET.Subscriptions>(
      isAuthenticated ? subscriptionApiUrl : null,
      {
        revalidateOnMount: true,
        refreshInterval: 30_000,
        shouldRetryOnError: false,
        errorRetryCount: 0,
      },
    );

  const planApiUrl = `${API_URL}/plans${
    discountCode ? `?discountCode=${discountCode}` : ""
  }`;
  const { data: plansData, isLoading: isPlansLoading } = useSWR<
    PlanNamespace.GET.PlansData,
    AxiosError
  >(isAuthenticated ? planApiUrl : null, {
    shouldRetryOnError: false,
    errorRetryCount: 0,
  });

  // Update store when data changes
  useEffect(() => {
    if (subscriptionsData?.items) setSubscriptions(subscriptionsData.items);

    if (plansData?.data?.plans) {
      setPlans(plansData.data.plans);
      setPlansData(plansData.data);
    }
  }, [subscriptionsData, plansData]);

  // Determine which tab is active
  useEffect(() => {
    if (initialized) return;
    if (isPlansLoading || isSubscriptionsLoading) return;

    if (!subscriptionsData?.items?.length) {
      setActive({
        choosePlan: true,
        subscriptionInfo: false,
        showCoupon: false,
      });
      setInitialized(true);
      return;
    }

    if (subscriptionsData?.items.length) {
      setActive({
        subscriptionInfo: true,
        choosePlan: false,
        showCoupon: false,
      });
    }

    setInitialized(true);
  }, [subscriptionsData, initialized, isPlansLoading, isSubscriptionsLoading]);

  // Handle URL param ?active=choosePlan
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

  // Loading state
  useEffect(() => {
    setIsLoading(isPlansLoading || isSubscriptionsLoading);
  }, [isPlansLoading, isSubscriptionsLoading]);
}

// "use client";

// import useUser from "@/hooks/useUser";
// import { AxiosError } from "axios";
// import { useSearchParams } from "next/navigation";
// import { createContext, useContext, useEffect, useState } from "react";
// import useSWR from "swr";
// import useSWRImmutable from "swr/immutable";
// // TODO: Refactor Types & Schemas
// import { PlanNamespace } from "@/types/plans/plan.namespace";
// import { SubscriptionNamespace } from "@/types/subscriptions/subscription.namspace";

// const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

// export interface SubscriptionContext {
//   active: {
//     choosePlan: boolean;
//     subscriptionInfo: boolean;
//     showCoupon?: boolean;
//   };
//   setActive: React.Dispatch<
//     React.SetStateAction<{
//       choosePlan: boolean;
//       subscriptionInfo: boolean;
//       showCoupon?: boolean;
//     }>
//   >;
//   subscriptions: SubscriptionNamespace.GET.Subscriptions["items"];
//   plans: PlanNamespace.GET.PlansData["plans"];
//   plansData?: PlanNamespace.GET.PlansData;
//   discountCode?: string;
//   setDiscountCode: React.Dispatch<React.SetStateAction<string>>;
//   isLoading: boolean;
// }

// export const SubscriptionContext = createContext<SubscriptionContext | null>(
//   null,
// );

// interface SubscriptionProviderProps {
//   children: React.ReactNode;
// }

// export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
//   const searchParams = useSearchParams();
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const [initialized, setInitialized] = useState<boolean>(false);
//   const [showCoupon, setShowCoupon] = useState<boolean>(false);
//   const [discountCode, setDiscountCode] = useState<string>("");
//   const [active, setActive] = useState({
//     subscriptionInfo: false,
//     choosePlan: false,
//     showCoupon: false,
//   });

//   console.log("active", active);

//   const { isAuthenticated } = useUser();

//   const subscriptionApiUrl = `${API_URL}/subscriptions?page=1&limit=5&status=active,reserved`;
//   const {
//     data: subscriptionsData,
//     isLoading: isSubscriptionsLoading,
//     error: subscriptionsError,
//   } = useSWRImmutable<SubscriptionNamespace.GET.Subscriptions>(
//     isAuthenticated ? subscriptionApiUrl : null,
//     {
//       revalidateOnMount: true,
//       refreshInterval: 30_000,
//       shouldRetryOnError: false,
//       errorRetryCount: 0,
//     },
//   );
//   const subscriptions = subscriptionsData?.items;

//   const planApiUrl = `${API_URL}/plans${discountCode ? `?discountCode=${discountCode}` : ""}`;
//   const {
//     data: plansData,
//     isLoading: isPlansLoading,
//     error: plansError,
//     mutate,
//   } = useSWR<PlanNamespace.GET.PlansData, AxiosError>(
//     isAuthenticated ? planApiUrl : null,
//     {
//       shouldRetryOnError: false,
//       errorRetryCount: 0,
//     },
//   );
//   const plans = plansData?.data.plans;

//   useEffect(() => {
//     if (initialized) return;
//     if (isPlansLoading || isSubscriptionsLoading) return;

//     if (!subscriptionsData?.items?.length) {
//       setActive({
//         choosePlan: true,
//         subscriptionInfo: false,
//         showCoupon: false,
//       });
//       setInitialized(true);
//       return;
//     }

//     if (subscriptionsData?.items.length) {
//       setActive({
//         subscriptionInfo: true,
//         choosePlan: false,
//         showCoupon: false,
//       });
//     }

//     setInitialized(true);
//   }, [subscriptionsData, initialized, isPlansLoading, isSubscriptionsLoading]);

//   useEffect(() => {
//     if (isPlansLoading && isSubscriptionsLoading) return;

//     if (searchParams.get("active") === "choosePlan") {
//       setActive((prev) => ({
//         ...prev,
//         subscriptionInfo: false,
//         choosePlan: true,
//       }));
//       setInitialized(true);
//     }
//   }, [searchParams, isPlansLoading, isSubscriptionsLoading]);

//   useEffect(() => {
//     setIsLoading(isPlansLoading || isSubscriptionsLoading);
//   }, [isPlansLoading, isSubscriptionsLoading]);

//   return (
//     <SubscriptionContext.Provider
//       value={{
//         active,
//         setActive,
//         subscriptions: subscriptionsData?.items || [],
//         plans: plans || [],
//         plansData: plansData?.data,
//         discountCode,
//         setDiscountCode,
//         isLoading,
//       }}
//     >
//       {children}
//     </SubscriptionContext.Provider>
//   );
// }

// export function useSubscriptionContext() {
//   const context = useContext(SubscriptionContext);

//   if (!context) {
//     throw new Error(
//       "useSubscriptionContext must be used within a SubscriptionProvider",
//     );
//   }

//   return context;
// }
