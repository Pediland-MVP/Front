'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/hooks/swr/api-client';
import { Loading } from '@/components/loading';
import { FetchError } from '@/components/fetch-error';
import { PageMeta } from '@/types/meta';
import { AutomationErrorRow } from '@/types/automationError';
import AutomationErrorsTable from './automation-errors-table';

export default function AutomationErrorsPageClient() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { data, isLoading, isValidating, error } = useSWR<{
    items: AutomationErrorRow[];
    meta: PageMeta;
  }>(`/automation-errors?limit=${limit}&page=${page}`, fetcher, { keepPreviousData: true });

  const errors = data?.items || [];
  const meta = data?.meta;

  if (!data && isLoading) return <Loading />;
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
