"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AutomationTableColumns } from "./AutomationTableColumns";
import { Table } from "@tanstack/react-table";
import { DataTable, TablePagination } from "../Table";
import useSWRImmutable from "swr/immutable";
import { AutomationResponse } from "@/schemas/automation";
import { PageMeta } from "@/schemas/pageMeta";
import { DeleteConfirmationDialog } from "../Global/DeleteConfirmationDialog";

export const AutomationsList = () => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAutomationId, setSelectedAutomationId] = useState<string>("");

  // Handle delete action
  const handleDelete = (id: string) => {
    setSelectedAutomationId(id);
    setDeleteDialogOpen(true);
    console.log("Deleting automation:", id);
  };

  const handleDeleteConfirm = () => {
    // TODO: Implement actual delete API call
    console.log("Deleting automation:", selectedAutomationId);
    setDeleteDialogOpen(false);
    setSelectedAutomationId("");
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedAutomationId("");
  };

  // Table
  const [tableInstance, setTableInstance] = useState<Table<any> | null>(null);
  const columns = useMemo(() => AutomationTableColumns(handleDelete), []);

  // Server-side pagination state (1-based page)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const onPageChange = useCallback(
    (newPage: number) => setPage(Math.max(1, newPage)),
    [],
  );

  const onLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

  // TODO: Better type for AutomationResponse
  const { data, isLoading } = useSWRImmutable<AutomationResponse | null>(
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
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        itemId={selectedAutomationId}
      />

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
