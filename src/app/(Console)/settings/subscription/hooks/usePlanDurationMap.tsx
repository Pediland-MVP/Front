import { useMemo } from "react";
import { useUpgradeContext } from "../context/SubscriptionContext";

export default function usePlanDurationMap() {
  const { plans } = useUpgradeContext();

  return useMemo(() => {
    const planMap = new Map<number, Map<number, any>>();

    plans.forEach((plan) => {
      const durationMap = new Map<number, any>();
      plan.durations.forEach((duration) => {
        durationMap.set(duration.id, duration);
      });
      planMap.set(plan.id, durationMap);
    });

    return planMap;
  }, []);
}
