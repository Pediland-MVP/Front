import { PlanNamespace } from "@/types/plans/plan.namespace"
import { useEffect, useState } from "react"
import useSWRImmutable from "swr/immutable"

export function usePlanSelection() {
  const [selectedPlan, setSelectedPlan] = useState<PlanNamespace.GET.Plans['plans']>()
  const [selectedDuration, setSelectedDuration] = useState<PlanNamespace.GET.Plans['plans'][0]['durations']>()

  const { data: plansData, isLoading: isPlansLoading, error: plansError } = useSWRImmutable<PlanNamespace.GET.Plans>(`${process.env.NEXT_PUBLIC_BACK_API_URL}/plans`)

  useEffect(() => {
    if (plansData) {
      setSelectedPlan(plansData.plans[0])
      setSelectedDuration(plansData.plans[0].durations[0])
    }
  }, [plansData])

  return {
    plansData,
    plans: plansData?.plans,
    isPlansLoading,
    selectedPlan,
    setSelectedPlan,
    selectedDuration,
    setSelectedDuration,
  }
}

