'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useDebounce } from 'use-debounce';
import { fetcher } from '@/hooks/swr/api-client';
import { Loading } from '@/components/loading';
import { FetchError } from '@/components/fetch-error';
import { useAuth } from '@/hooks/use-auth';
import { useKams } from '@/hooks/use-kams';
import { useLabelsList } from '../labels/use-labels';
import InstagramsTable from './instagrams-table';

export default function InstagramsPageClient() {
  const { user } = useAuth();
  const isSuperAdmin = !!user && user.role !== 'kam';

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [isIgTokenValid, setIsIgTokenValid] = useState('');
  const [labelId, setLabelId] = useState<string | undefined>(undefined);
  const [admin, setAdmin] = useState('');
  const [debouncedSearch] = useDebounce(search, 750);

  const searchQuery = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : '';
  const igTokenQuery = isIgTokenValid ? `&isIgTokenValid=${isIgTokenValid}` : '';
  const labelIdQuery = labelId ? `&labelId=${labelId}` : '';
  const adminQuery = isSuperAdmin && admin ? `&adminIds=${admin}` : '';

  const { data: labelsData } = useLabelsList({ page: 1, limit: 100 });

  const { kams, isLoading: isKamsLoading } = useKams({
    roles: 'manager,kam',
    enabled: isSuperAdmin,
  });

  const { data, isLoading, isValidating, error } = useSWR(
    `/instagrams?limit=${limit}&page=${page}${searchQuery}${igTokenQuery}${labelIdQuery}${adminQuery}`,
    fetcher,
    { keepPreviousData: true },
  );

  const instagrams = data?.items || [];
  const meta = data?.meta;

  if ((!data && isLoading) || (isSuperAdmin && isKamsLoading)) return <Loading />;
  if (error) return <FetchError />;

  return (
    <InstagramsTable
      isRefetching={isValidating && !!data}
      instagrams={instagrams}
      meta={meta}
      onPageChange={setPage}
      onLimitChange={setLimit}
      search={search}
      onSearchChange={setSearch}
      isIgTokenValid={isIgTokenValid}
      onIgTokenValidChange={setIsIgTokenValid}
      labelId={labelId}
      onLabelIdChange={setLabelId}
      labelsItems={labelsData?.items ?? []}
      admin={admin}
      onAdminChange={setAdmin}
      kams={kams}
      showAdminFilter={isSuperAdmin}
    />
  );
}
