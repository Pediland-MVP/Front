import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { fetcher, getAccessToken } from "@/hooks/swr/api-client";
import { Permission } from "@/types/workspace";
import { IResponseMessage } from "@/types/responseMessage";

function getActiveWorkspaceId(): string | null {
  let token = getAccessToken();
  
  if (!token && typeof document !== "undefined") {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; token=`);
    if (parts.length === 2) {
      token = parts.pop()?.split(";").shift() || null;
    }
  }

  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.workspaceId || null;
  } catch (e) {
    return null;
  }
}

export function usePermissions() {
  const workspaceId = getActiveWorkspaceId();

  const { data, error, isLoading } = useSWR<IResponseMessage<Permission[]>>(
    workspaceId ? `/workspaces/${workspaceId}/permissions/members/me/effective` : null,
    fetcher,
    {
      refreshInterval: 15000,
    }
  );

  const permissions = useMemo(() => {
    return (data as any)?.items ?? (Array.isArray(data) ? data : (data?.data || []));
  }, [data]);

  const can = useCallback((slug: string) => {
    return permissions.some((p) => {
      if (p.slug === slug) return true;
      if (slug.startsWith("automation:")) {
        return p.slug === slug.replace("automation:", "contentCycle:");
      }
      if (slug.startsWith("contentCycle:")) {
        return p.slug === slug.replace("contentCycle:", "automation:");
      }
      return false;
    });
  }, [permissions]);

  return useMemo(() => ({
    permissions,
    can,
    isLoading,
    error,
    workspaceId,
  }), [permissions, can, isLoading, error, workspaceId]);
}

