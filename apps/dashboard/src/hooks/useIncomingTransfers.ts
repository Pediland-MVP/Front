import useSWR from 'swr';
import { fetcher } from '@/hooks/swr/api-client';
import { IResponseMessage } from '@/types/responseMessage';
import { IncomingTransfer } from '@/types/ownershipTransfer';

export function useIncomingTransfers() {
  const { data, error, isLoading, mutate } = useSWR<
    IncomingTransfer[] | IResponseMessage<IncomingTransfer[]>
  >('/ownership-transfers/incoming', fetcher);

  const transfers: IncomingTransfer[] =
    (data as any)?.items ?? (Array.isArray(data) ? data : (data?.data ?? []));

  return { transfers, count: transfers.length, isLoading, error, mutate };
}
