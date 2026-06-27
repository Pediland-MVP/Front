'use client';

import useSWR from 'swr';
import { fetcher } from '@/hooks/swr/api-client';
import type { LabelFieldDef, LabelListItem } from './types';

export interface LabelsListParams {
  page: number;
  limit: number;
  search?: string;
}

export function useLabelsList({ page, limit, search }: LabelsListParams) {
  const q = search ? `&search=${encodeURIComponent(search)}` : '';
  return useSWR<{ items: LabelListItem[]; meta: { totalItems: number } }>(
    `/labels?page=${page}&limit=${limit}${q}`,
    fetcher,
    { keepPreviousData: true },
  );
}

export function useLabelFields() {
  const { data, ...rest } = useSWR<{ data: { fields: LabelFieldDef[] } }>(
    '/labels/fields',
    fetcher,
  );
  return { fields: data?.data?.fields ?? [], ...rest };
}
