// src/hooks/use-kams.ts

import useSWR from "swr";
import { fetcher } from "@/hooks/swr/api-client";

export function useKams({ roles, enabled = true }) {
  const { data, isLoading, error } = useSWR(
    enabled ? `admins?roles=${roles}&limit=30&page=1` : null,
    fetcher,
  );

  return {
    kams: data?.items || [],
    isLoading,
    isError: error,
  };
}
