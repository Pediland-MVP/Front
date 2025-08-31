"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AutomationTableColumns } from "./AutomationTableColumns";
import { Table } from "@tanstack/react-table";
import { DataTable, TablePagination } from "../Table";
import useSWRImmutable from "swr/immutable";
import { AutomationResponse } from "@/schemas/automation";
import { PageMeta } from "@/schemas/pageMeta";

export const AutomationsList = () => {
  // Table
  const [tableInstance, setTableInstance] = useState<Table<any> | null>(null);
  const columns = useMemo(() => AutomationTableColumns(), []);

  // Server-side pagination state (1-based page)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(30);

  const onPageChange = useCallback(
    (newPage: number) => setPage(Math.max(1, newPage)),
    [],
  );
  const onLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

  // Remove this useEffect since there's no search parameter to reset for

  // TODO: Better type for AutomationResponse
  const {
    data,
    isLoading,
    error,
    mutate: automationMutate,
  } = useSWRImmutable<AutomationResponse | null>(
    `/contentCycle?page=${page}&limit=${limit}`,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  // Map Wire -> Domain (memoized)
  const items = data?.items ?? [];

  // Safe meta (fallback while loading)
  const defaultMeta: PageMeta = {
    currentPage: page,
    itemsPerPage: limit,
    itemCount: 0,
    totalItems: 0,
    totalPages: 1,
  };
  const meta: PageMeta = data?.meta ?? defaultMeta;

  return (
    <>
      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        page={meta.currentPage}
        limit={meta.itemsPerPage}
        totalCount={meta.totalItems}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
        tableInstanceRef={setTableInstance}
      />

      <TablePagination
        isLoading={isLoading}
        table={tableInstance}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
        totalCount={meta.totalItems}
        serverPage={meta.currentPage}
        serverPerPage={meta.itemsPerPage}
        serverItemCount={meta.itemCount}
        serverTotalPages={meta.totalPages}
      />
    </>
  );
};
