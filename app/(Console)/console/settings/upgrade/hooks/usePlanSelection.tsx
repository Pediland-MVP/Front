import { PlanNamespace } from "@/types/plans/plan.namespace"
import { IDuration, IPlan } from "@/types/plans/plans"
import { useEffect, useState } from "react"
import useSWRImmutable from "swr/immutable"

export function usePlanSelection() {
  const [selectedPlan, setSelectedPlan] = useState<IPlan>()
  const [selectedDuration, setSelectedDuration] = useState<IDuration>()

  const { data: plans, isLoading: isPlansLoading, error: plansError } = useSWRImmutable<PlanNamespace.GET.Plans>(`${process.env.NEXT_PUBLIC_BACK_API_URL}/plans`)

  useEffect(() => {
    if (plans) {
      setSelectedPlan(plans[0])
      setSelectedDuration(plans[0].durations[0])
    }
  }, [plans])

  return {
    plans,
    isPlansLoading,
    selectedPlan,
    setSelectedPlan,
    selectedDuration,
    setSelectedDuration,
  }
}

