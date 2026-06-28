'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useDebounce } from 'use-debounce';
import { fetcher } from '@/hooks/swr/api-client';
import { Loading } from '@/components/loading';
import { FetchError } from '@/components/fetch-error';
import WorkspaceTable from './workspace-table';
import { useLabelsList } from '../labels/use-labels';

export default function WorkspacesPageClient() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [labelId, setLabelId] = useState<string | undefined>(undefined);
  const [debouncedSearch] = useDebounce(search, 750);

  const searchQuery = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : '';
  const typeQuery = type ? `&type=${type}` : '';
  const labelIdQuery = labelId ? `&labelId=${labelId}` : '';

  const { data: labelsData } = useLabelsList({ page: 1, limit: 100 });

  const { data, isLoading, isValidating, error } = useSWR(
    `/workspaces?limit=${limit}&page=${page}${searchQuery}${typeQuery}${labelIdQuery}`,
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
      labelId={labelId}
      onLabelIdChange={setLabelId}
      labelsItems={labelsData?.items ?? []}
    />
  );
}
