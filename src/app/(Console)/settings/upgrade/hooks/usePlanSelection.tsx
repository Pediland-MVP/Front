"use client";
import { toast } from "@/components/ui-custom/useToast";
import useUser from "@/hooks/useUser";
import { ExceptionMessage } from "@/types/exceptionMessage";
import { PlanNamespace } from "@/types/plans/plan.namespace";
import { AxiosError } from "axios";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import useSWR from "swr";

export function usePlanSelection() {
  const [selectedPlan, setSelectedPlan] =
    useState<PlanNamespace.GET.PlansData["plans"][0]>();
  const [selectedDuration, setSelectedDuration] =
    useState<PlanNamespace.GET.PlansData["plans"][0]["durations"][0]>();

  const [discountCode, setDiscountCode] = useState<string>();

  const t_ec = useTranslations("ERROR_CODES");

  const { isAuthenticated } = useUser();
  const {
    data: plansData,
    isLoading: isPlansLoading,
    error: plansError,
    mutate,
  } = useSWR<PlanNamespace.GET.PlansData, AxiosError>(
    isAuthenticated
      ? `${process.env.NEXT_PUBLIC_BACK_API_URL}/plans${discountCode ? `?discountCode=${discountCode}` : ""}`
      : null,
  );

  useEffect(() => {
    if (!plansError) return;
    const errorMessage = plansError.response?.data as ExceptionMessage;
    toast({
      title: t_ec(errorMessage?.code),
    });
  }, [plansError]);

  useEffect(() => {
    if (plansData) {
      // console.log('PLANS UPDATED IN USEPLANSELECTION', plansData)
      setSelectedPlan(plansData.plans[0]);
      setSelectedDuration(plansData.plans[0].durations[0]);
    }
  }, [plansData]);

  return {
    plansData,
    plans: plansData?.plans,
    isPlansLoading,
    selectedPlan,
    setSelectedPlan,
    selectedDuration,
    setSelectedDuration,
    setDiscountCode,
    discountCode,
  };
}
