// src/app/(main)/plans/client-page.tsx
'use client';

import { notFound } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/hooks/swr/api-client';
import { useAuth } from '@/hooks/use-auth';
import { Loading } from '@/components/loading';
import { FetchError } from '@/components/fetch-error';
import { Plan } from '@/types/subscription';
import PlansTable from './plans-table';

export default function PlansPageClient() {
  const { user } = useAuth();

  const { data, isLoading, isValidating, error, mutate } = useSWR('/plans', fetcher, {
    keepPreviousData: true,
  });

  if (user && user.role === 'kam') notFound();

  if ((!data && isLoading) || !user) return <Loading />;
  if (error) return <FetchError />;

  const plans: Plan[] = data?.data || [];

  return <PlansTable isRefetching={isValidating && !!data} plans={plans} mutate={mutate} />;
}
