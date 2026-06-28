'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useDebounce } from 'use-debounce';
import { fetcher } from '@/hooks/swr/api-client';
import { Loading } from '@/components/loading';
import { FetchError } from '@/components/fetch-error';
import { useAuth } from '@/hooks/use-auth';
import { useKams } from '@/hooks/use-kams';
import { PageMeta } from '@/types/meta';
import { InstagramRow } from '@/types/instagram';
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

  const { data, isLoading, isValidating, error } = useSWR<{
    items: InstagramRow[];
    meta: PageMeta;
  }>(
    `/instagrams?limit=${limit}&page=${page}${searchQuery}${igTokenQuery}${labelIdQuery}${adminQuery}`,
    fetcher,
    { keepPreviousData: true },
  );

  const instagrams = data?.items || [];
  const meta = data?.meta;

  const handleSearchChange = (v: string) => {
    setPage(1);
    setSearch(v);
  };
  const handleIgTokenValidChange = (v: string) => {
    setPage(1);
    setIsIgTokenValid(v);
  };
  const handleLabelIdChange = (v: string | undefined) => {
    setPage(1);
    setLabelId(v);
  };
  const handleAdminChange = (v: string) => {
    setPage(1);
    setAdmin(v);
  };

  if ((!data && isLoading) || (isSuperAdmin && isKamsLoading)) return <Loading />;
  if (error) return <FetchError />;
  if (!meta) return null;

  return (
    <InstagramsTable
      isRefetching={isValidating && !!data}
      instagrams={instagrams}
      meta={meta}
      onPageChange={setPage}
      onLimitChange={setLimit}
      search={search}
      onSearchChange={handleSearchChange}
      isIgTokenValid={isIgTokenValid}
      onIgTokenValidChange={handleIgTokenValidChange}
      labelId={labelId}
      onLabelIdChange={handleLabelIdChange}
      labelsItems={labelsData?.items ?? []}
      admin={admin}
      onAdminChange={handleAdminChange}
      kams={kams}
      showAdminFilter={isSuperAdmin}
    />
  );
}
