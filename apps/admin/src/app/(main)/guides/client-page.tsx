// src/app/(main)/guides/client-page.tsx
'use client';

import { notFound } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/hooks/swr/api-client';
import { useAuth } from '@/hooks/use-auth';
import { Loading } from '@/components/loading';
import { FetchError } from '@/components/fetch-error';
import GuidesTable from './guides-table';

export default function GuidesPageClient() {
  const { user } = useAuth();

  const {
    data: guidesRes,
    isLoading: guidesLoading,
    isValidating: guidesValidating,
    error: guidesError,
    mutate: mutateGuides,
  } = useSWR('/guides', fetcher, { keepPreviousData: true });

  const {
    data: categoriesRes,
    isLoading: categoriesLoading,
    isValidating: categoriesValidating,
    error: categoriesError,
    mutate: mutateCategories,
  } = useSWR('/guides/categories', fetcher, { keepPreviousData: true });

  if (user && user.role === 'kam') notFound();

  if ((!guidesRes && guidesLoading) || (!categoriesRes && categoriesLoading) || !user) {
    return <Loading />;
  }

  if (guidesError || categoriesError) return <FetchError />;

  const guides = guidesRes?.data || [];
  const categories = categoriesRes?.data || [];

  return (
    <GuidesTable
      isRefetching={(guidesValidating || categoriesValidating) && !!guidesRes && !!categoriesRes}
      guides={guides}
      categories={categories}
      mutateGuides={mutateGuides}
      mutateCategories={mutateCategories}
    />
  );
}
