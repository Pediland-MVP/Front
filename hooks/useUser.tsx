// hooks/useUserStatus.ts
import { UserNamespace } from '@/types/user';
import useSWR from 'swr';

export default function useUser() {
  const { data, error, isLoading } = useSWR<UserNamespace.GET.User>('/users/me');
  
  return {
    user: data,
    isLoading,
    error,
    hasSubscription: Boolean(data?.subscriptions?.length),
    hasInstagram: Boolean(data?.instagrams?.length),
  };
}