'use client';

import useSWR from 'swr';
import { AccountSessionNamespace } from '@/types/accountSession';

/**
 * Fetch the current user's active sessions (all workspaces). The backend marks
 * the caller's own session (`isCurrent`) and whether each may be terminated
 * (`canTerminate`) — the UI just reflects those flags.
 */
export function useAccountSessions() {
  const { data, error, isLoading, mutate } =
    useSWR<AccountSessionNamespace.Sessions>('/auth/sessions');

  return {
    sessions: data?.items ?? [],
    error,
    isLoading,
    mutate,
  };
}
