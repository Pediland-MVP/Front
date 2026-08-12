import useSWR from 'swr';
import { PlanNamespace } from '@/types/plans/plan.namespace';

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

/** All visible/active plans, for the manual tier picker shown when Apify fails. */
export function useAllVisiblePlans(enabled: boolean) {
  const { data, isLoading } = useSWR<PlanNamespace.GET.PlansData, unknown>(
    enabled ? `${API_URL}/plans` : null,
  );

  return {
    plans: data?.data?.plans,
    isLoading,
  };
}
