'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { AxiosError } from 'axios';
import useUser from '@/hooks/useUser';
import useSWR, { mutate } from 'swr';
import useSWRImmutable from 'swr/immutable';
import { useEffect } from 'react';

// Types
import { PlanNamespace } from '@/types/plans/plan.namespace';
import { SubscriptionNamespace } from '@/types/subscriptions/subscription.namspace';
import { mutateIncludeStringKey } from '@/utils/mutateIncludeStringKey';
import { SubscriptionStatusEnum } from '@/types/subscriptions/enums/subscriptionStatus.enum';

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

// ============ Zustand Store ============
interface ActiveTabs {
  choosePlan: boolean;
  subscriptionInfo: boolean;
  showCoupon?: boolean;
}

interface SubscriptionState {
  active: ActiveTabs;
  subscriptions: SubscriptionNamespace.GET.Subscriptions['items'];
  plans: PlanNamespace.GET.PlansData['plans'];
  plansData?: PlanNamespace.GET.PlansData;
  discountCode?: string;
  isLoading: boolean;
  initialized: boolean;
  totalRemainingDays: number;
  totalPurchasedDays: number;

  // actions
  setActive: (active: ActiveTabs) => void;
  setDiscountCode: (code: string) => void;
  setIsLoading: (val: boolean) => void;
  setInitialized: (val: boolean) => void;
  setSubscriptions: (data: SubscriptionNamespace.GET.Subscriptions['items']) => void;
  setPlans: (data: PlanNamespace.GET.PlansData['plans']) => void;
  setPlansData: (data?: PlanNamespace.GET.PlansData) => void;
  calculateDays: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  devtools((set, get) => ({
    active: {
      choosePlan: false,
      subscriptionInfo: false,
      showCoupon: false,
    },
    subscriptions: [],
    plans: [],
    plansData: undefined,
    discountCode: '',
    isLoading: false,
    initialized: false,
    totalRemainingDays: 0,
    totalPurchasedDays: 0,

    setActive: (active) => set({ active }),
    setDiscountCode: (discountCode) => set({ discountCode }),
    setIsLoading: (isLoading) => set({ isLoading }),
    setInitialized: (initialized) => set({ initialized }),
    setSubscriptions: (subscriptions) => set({ subscriptions }, false, 'setSubscriptions'),
    setPlans: (plans) => set({ plans }),
    setPlansData: (plansData) => set({ plansData }),

    calculateDays: () => {
      const { subscriptions } = get();

      if (!subscriptions?.length) return set({ totalRemainingDays: 0, totalPurchasedDays: 0 });

      const now = new Date();

      // اشتراک فعال
      const active = subscriptions.find((s) => s.status === SubscriptionStatusEnum.ACTIVE);

      // اشتراک‌های رزروشده
      const reserved = subscriptions.filter((s) => s.status === SubscriptionStatusEnum.RESERVED);

      // مجموع کل روزهای خریداری‌شده
      const totalPurchasedDays = subscriptions.reduce(
        (sum, s) => sum + (s.planDuration?.durationDays ?? 0),
        0,
      );

      // مجموع روزهای رزروشده
      const reservedDays = reserved.reduce(
        (sum, s) => sum + (s.planDuration?.durationDays ?? 0),
        0,
      );

      const getRemainingDays = (expireDate: string) => {
        const expire = new Date(expireDate);
        const diff = expire.getTime() - now.getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
      };

      const activeDays = active ? getRemainingDays(active.expire) : 0;
      const totalRemainingDays = activeDays + reservedDays;

      set({ totalRemainingDays, totalPurchasedDays });
    },
  })),
);

// ============ Hook for Data Fetching ============
export function useSubscriptionData() {
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
    calculateDays,
  } = useSubscriptionStore();

  const { isAuthenticated } = useUser();

  const subscriptionApiUrl = `${API_URL}/subscriptions?page=1&limit=5&status=active,reserved,expired`;
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

  const allowedSubscriptions = subscriptionsData?.items.filter(
    (sub) =>
      sub.status === SubscriptionStatusEnum.ACTIVE ||
      sub.status === SubscriptionStatusEnum.RESERVED,
  );

  const planApiUrl = `${API_URL}/plans${discountCode ? `?discountCode=${discountCode}` : ''}`;
  const { data: plansData, isLoading: isPlansLoading } = useSWRImmutable<
    PlanNamespace.GET.PlansData,
    AxiosError
  >(isAuthenticated ? planApiUrl : null, {
    shouldRetryOnError: false,
    errorRetryCount: 0,
  });

  useEffect(() => {
    mutate(mutateIncludeStringKey('/instagram'));
  }, [plansData]);

  // Update store when data changes
  useEffect(() => {
    if (allowedSubscriptions) {
      setSubscriptions(allowedSubscriptions);
      calculateDays();
    }

    if (plansData?.data?.plans) {
      setPlans(plansData.data.plans);
      setPlansData(plansData.data);
    }
  }, [subscriptionsData, plansData]);

  // Determine which tab is active
  useEffect(() => {
    if (initialized) return;
    if (isPlansLoading || isSubscriptionsLoading) return;

    if (!allowedSubscriptions?.length) {
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
        subscriptionInfo: false,
        choosePlan: true,
        showCoupon: false,
      });
    }

    setInitialized(true);
  }, [subscriptionsData, initialized, isPlansLoading, isSubscriptionsLoading]);

  // Loading state
  useEffect(() => {
    setIsLoading(isPlansLoading || isSubscriptionsLoading);
  }, [isPlansLoading, isSubscriptionsLoading]);
}
