import useSWR from 'swr';
import { fetcher } from '@/hooks/swr/api-client';
import { IResponseMessage } from '@/types/responseMessage';

export type Invitation = {
  id: string;
  workspace: { id: string; name: string };
  inviter: { firstname: string | null; lastname: string | null };
  status: string;
  message: string | null;
  permissions: string[];
};

export function useInvitations() {
  const { data, error, isLoading, mutate } = useSWR<Invitation[] | IResponseMessage<Invitation[]>>(
    '/invitations/pending',
    fetcher,
  );

  const invitations: Invitation[] =
    (data as any)?.items ?? (Array.isArray(data) ? data : (data?.data ?? []));

  return {
    invitations,
    pendingCount: invitations.length,
    isLoading,
    error,
    mutate,
  };
}
