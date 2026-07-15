'use client';

import { useState } from 'react';
import { notFound } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/hooks/swr/api-client';
import { useAuth } from '@/hooks/use-auth';
import { Loading } from '@/components/loading';
import { FetchError } from '@/components/fetch-error';
import { PageMeta } from '@/types/meta';
import { AutomationErrorRow } from '@/types/automationError';
import AutomationErrorsTable from './automation-errors-table';

export default function AutomationErrorsPageClient() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { data, isLoading, isValidating, error } = useSWR<{
    items: AutomationErrorRow[];
    meta: PageMeta;
  }>(`/automation-errors?limit=${limit}&page=${page}`, fetcher, { keepPreviousData: true });

  const errors = data?.items || [];
  const meta = data?.meta;

  if (user && user.role === 'kam') notFound();

  if ((!data && isLoading) || !user) return <Loading />;
  if (error) return <FetchError />;
  if (!meta) return null;

  return (
    <AutomationErrorsTable
      isRefetching={isValidating && !!data}
      errors={errors}
      meta={meta}
      onPageChange={setPage}
      onLimitChange={setLimit}
    />
  );
}
