import useSWR from 'swr';
import { fetcher } from '@/hooks/swr/api-client';

export interface WorkspaceCategory {
  id: string;
  nameEn: string;
  nameFa: string;
}

export function useWorkspaceCategories() {
  const { data, error, isLoading } = useSWR<WorkspaceCategory[] | { data: WorkspaceCategory[] }>(
    '/workspace-categories',
    fetcher,
  );

  const categories: WorkspaceCategory[] = (data as any)?.data ?? (Array.isArray(data) ? data : []);

  return { categories, isLoading, error };
}
