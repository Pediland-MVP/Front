import useSWR from 'swr';
import { getAccessToken } from './swr/api-client';
import { UserNamespace } from '@/types/user';

export default function useUser() {
  const { data, error, isLoading, mutate } = useSWR<UserNamespace.GET.User>(
    '/users/me'
  );
  
  return {
    user: data,
    isLoading,
    isError: !!error,
    isAuthenticated: !!getAccessToken(),
    mutate,
    hasSubscription: Boolean(data?.subscriptions?.length),
    hasInstagram: Boolean(data?.instagrams?.length),
    error
  };
}