import { useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/hooks/swr/api-client';
import { Permission } from '@/types/workspace';
import { IResponseMessage } from '@/types/responseMessage';
import { decodeJwtPayload } from '@/utils/jwt';

export function usePermissions() {
  const { workspaceId, userId } = decodeJwtPayload();

  const { data, error, isLoading } = useSWR<IResponseMessage<Permission[]>>(
    workspaceId ? `/workspaces/${workspaceId}/permissions/members/me/effective` : null,
    fetcher,
    {
      refreshInterval: 15000,
    },
  );

  const permissions = useMemo(() => {
    return (data as any)?.items ?? (Array.isArray(data) ? data : data?.data || []);
  }, [data]);

  const can = useCallback(
    (slug: string) => {
      return permissions.some((p) => p.slug === slug);
    },
    [permissions],
  );

  return useMemo(
    () => ({
      permissions,
      can,
      isLoading,
      error,
      workspaceId,
      userId,
    }),
    [permissions, can, isLoading, error, workspaceId, userId],
  );
}
