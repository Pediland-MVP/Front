'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useDebounce } from 'use-debounce';
import { fetcher } from '@/hooks/swr/api-client';
import { Loading } from '@/components/loading';
import { FetchError } from '@/components/fetch-error';
import WorkspaceTable from './workspace-table';

export default function WorkspacesPageClient() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [debouncedSearch] = useDebounce(search, 750);

  const searchQuery = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : '';
  const typeQuery = type ? `&type=${type}` : '';

  const { data, isLoading, isValidating, error } = useSWR(
    `/workspaces?limit=${limit}&page=${page}${searchQuery}${typeQuery}`,
    fetcher,
    { keepPreviousData: true },
  );

  const workspaces = data?.items || [];
  const meta = data?.meta;

  if (!data && isLoading) return <Loading />;
  if (error) return <FetchError />;

  return (
    <WorkspaceTable
      isRefetching={isValidating && !!data}
      workspaces={workspaces}
      meta={meta}
      onPageChange={setPage}
      onLimitChange={setLimit}
      search={search}
      onSearchChange={setSearch}
      type={type}
      onTypeChange={setType}
    />
  );
}
