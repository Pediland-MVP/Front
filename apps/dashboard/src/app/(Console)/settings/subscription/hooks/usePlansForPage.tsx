import useSWR from 'swr';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { PlanNamespace } from '@/types/plans/plan.namespace';

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

/** Plans filtered to one Instagram page's follower tier — for the buy-subscription page picker. */
export default function usePlansForPage(instagramId?: string) {
  const { discountCode } = useSubscriptionStore();

  const params = new URLSearchParams();
  if (instagramId) params.set('instagramId', instagramId);
  if (discountCode) params.set('discountCode', discountCode);

  const url = instagramId ? `${API_URL}/plans?${params.toString()}` : null;

  const { data, isLoading, error } = useSWR<PlanNamespace.GET.PlansData, unknown>(url);

  return {
    plan: data?.data?.plans?.[0],
    isLoading,
    error,
  };
}
