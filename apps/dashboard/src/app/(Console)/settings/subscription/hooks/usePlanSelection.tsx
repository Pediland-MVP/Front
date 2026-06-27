'use client';
import { toast } from 'sonner';
import useUser from '@/hooks/useUser';
import { ExceptionMessage } from '@/types/exceptionMessage';
import { PlanNamespace } from '@/types/plans/plan.namespace';
import { AxiosError } from 'axios';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import useSWR from 'swr';

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

export function usePlanSelection() {
  const [selectedPlan, setSelectedPlan] = useState<PlanNamespace.GET.PlansData['plans'][0]>();
  const [selectedDuration, setSelectedDuration] =
    useState<PlanNamespace.GET.PlansData['plans'][0]['durations'][0]>();

  const [discountCode, setDiscountCode] = useState<string>();

  const t_ec = useTranslations('ERROR_CODES');
  const { isAuthenticated } = useUser();

  const plansApiUrl = `${API_URL}/plans${discountCode ? `?discountCode=${discountCode}` : ''}`;
  const {
    data: plansData,
    isLoading: isPlansLoading,
    error: plansError,
    mutate,
  } = useSWR<PlanNamespace.GET.PlansData, AxiosError>(isAuthenticated ? plansApiUrl : null);

  useEffect(() => {
    if (!plansError) return;
    const errorMessage = plansError.response?.data as ExceptionMessage;
    toast.error(t_ec(errorMessage?.code) || errorMessage?.message);
  }, [plansError]);

  useEffect(() => {
    if (plansData) {
      // console.log('PLANS UPDATED IN USEPLANSELECTION', plansData)
      setSelectedPlan(plansData.data.plans[0]);
      setSelectedDuration(plansData.data.plans[0].durations[0]);
    }
  }, [plansData]);

  return {
    plansData: plansData?.data,
    plans: plansData?.data.plans,
    isPlansLoading,
    selectedPlan,
    setSelectedPlan,
    selectedDuration,
    setSelectedDuration,
    setDiscountCode,
    discountCode,
  };
}
