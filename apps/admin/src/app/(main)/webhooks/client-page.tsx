'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useDebounce } from 'use-debounce';
import { fetcher } from '@/hooks/swr/api-client';
import { Loading } from '@/components/loading';
import { FetchError } from '@/components/fetch-error';
import WebhooksTable from './webhooks-table';

export default function WebhooksPageClient() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 750);

  const searchQuery = debouncedSearch ? `&search=${debouncedSearch}` : '';

  const { data, isLoading, isValidating, error, mutate } = useSWR(
    `/analytics-webhooks?limit=${limit}&page=${page}${searchQuery}`,
    fetcher,
    { keepPreviousData: true },
  );

  if (!data && isLoading) return <Loading />;
  if (error) return <FetchError />;

  return (
    <WebhooksTable
      isRefetching={isValidating && !!data}
      webhooks={data?.items ?? []}
      totalCount={data?.meta?.totalItems ?? 0}
      page={page}
      limit={limit}
      onPageChange={setPage}
      onLimitChange={setLimit}
      search={search}
      onSearchChange={setSearch}
      mutate={mutate}
    />
  );
}
