// src/hooks/use-categories.ts

import useSWR from "swr";
import { fetcher } from "@/hooks/swr/api-client";

export function useCategories() {
  const { data, error, isLoading } = useSWR(
    "/users/categories?limit=5&page=1",
    fetcher,
  );

  return {
    categories: data?.items || [],
    isLoading,
    isError: !!error,
  };
}
