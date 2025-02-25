// hooks/useUserStatus.ts
import { UserNamespace } from '@/types/user';
import useSWR from 'swr';

export default function useUser() {
  const { data, error, isLoading } = useSWR<UserNamespace.GET.User>(`${process.env.NEXT_PUBLIC_BACK_API_URL}/users/me`);

  return {
    user: data,
    isLoading: !data && !error,
    error,
    hasSubscription: false,
    hasInstagram: false,
  };
}
