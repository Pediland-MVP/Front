import useSWR from 'swr';
import { fetcher } from '@/hooks/swr/api-client';
import { IResponseMessage } from '@/types/responseMessage';
import { ActiveTransfer } from '@/types/ownershipTransfer';

export function useActiveTransfer(workspaceId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<IResponseMessage<ActiveTransfer | null>>(
    workspaceId ? `/workspaces/${workspaceId}/ownership-transfer/active` : null,
    fetcher,
  );

  const activeTransfer: ActiveTransfer | null = (data as any)?.data ?? null;

  return { activeTransfer, isLoading, error, mutate };
}
