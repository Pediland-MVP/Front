import { useMemo } from 'react';
import { useSubscriptionContext } from '../../../../../store/subscriptionStore';

export default function usePlanDurationMap() {
  const { plans } = useSubscriptionContext();

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
