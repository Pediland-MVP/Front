import useSWR from 'swr';
import { PlanNamespace } from '@/types/plans/plan.namespace';

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

/** Plans filtered to the follower tier of a not-yet-connected account. */
export function usePlansByFollowers(followersCount?: number) {
  const url =
    followersCount !== undefined ? `${API_URL}/plans?followersCount=${followersCount}` : null;
  const { data, isLoading, error } = useSWR<PlanNamespace.GET.PlansData, unknown>(url);

  return {
    plan: data?.data?.plans?.[0],
    isLoading,
    error,
  };
}
