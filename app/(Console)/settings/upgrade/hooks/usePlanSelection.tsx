import useUser from "@/hooks/useUser"
import { PlanNamespace } from "@/types/plans/plan.namespace"
import { useEffect, useState } from "react"
import useSWRImmutable from "swr/immutable"

export function usePlanSelection() {
  const [selectedPlan, setSelectedPlan] = useState<PlanNamespace.GET.PlansData['plans'][0]>()
  const [selectedDuration, setSelectedDuration] = useState<PlanNamespace.GET.PlansData['plans'][0]['durations'][0]>()

  const { isAuthenticated } = useUser()
  const { data: plansData, isLoading: isPlansLoading, error: plansError } = useSWRImmutable<PlanNamespace.GET.PlansData>(isAuthenticated ? `${process.env.NEXT_PUBLIC_BACK_API_URL}/plans` : null)

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

