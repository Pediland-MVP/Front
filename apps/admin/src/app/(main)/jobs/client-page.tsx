'use client';

import useSWR from 'swr';
import { notFound } from 'next/navigation';
import { fetcher } from '@/hooks/swr/api-client';
import { useAuth } from '@/hooks/use-auth';
import { Loading } from '@/components/loading';
import { FetchError } from '@/components/fetch-error';
import JobsTable, { JobView } from './jobs-table';

export default function JobsPageClient() {
  const { user } = useAuth();
  if (user && user.role === 'kam') notFound();

  const { data, isLoading, isValidating, error, mutate } = useSWR<{ items: JobView[] }>(
    '/jobs',
    fetcher,
    { refreshInterval: 15000, keepPreviousData: true },
  );

  if (!user || (!data && isLoading)) return <Loading />;
  if (error) return <FetchError />;

  return (
    <JobsTable jobs={data?.items ?? []} isRefetching={isValidating && !!data} mutate={mutate} />
  );
}
