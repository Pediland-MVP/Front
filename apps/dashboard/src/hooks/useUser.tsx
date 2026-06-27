'use client';

import useSWR from 'swr';
import { UserNamespace } from '@/types/user';

export default function useUser() {
  const { data: user, error, isLoading, mutate } = useSWR<UserNamespace.GET.User>('/users/me');

  return {
    error,
    isOnboarding: user?.data.status === 'onboarding',
    hasInstagram: Boolean(user?.data.instagrams?.length),
    hasSubscription: Boolean(user?.data.subscriptions?.length),
    canConnectInstagram: Boolean((user?.data as any)?.canConnectInstagram),
    isAuthenticated: !!user && !error,
    isError: !!error,
    isLoading: !user && !error,
    mutate,
    status: user?.data.status,
    user: user?.data,
  };
}
