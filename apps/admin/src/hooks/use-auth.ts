// src/hooks/use-auth.ts

import useSWR from 'swr';

export function useAuth() {
  const { data, error } = useSWR('/auth/me');

  return {
    user: data ?? null,
    isLoading: !data && !error,
    isError: error,
    isAuthenticated: !!data,
  };
}
