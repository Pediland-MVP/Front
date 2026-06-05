"use client";

import api from "@/hooks/swr/api-client";
import type { AutomationResponse } from "@/schemas/automation";
import type { PageMeta } from "@/schemas/pageMeta";
import { mutateIncludeStringKey } from "@/utils/mutateIncludeStringKey";
import type { Table } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";

import { DeleteConfirmationDialog } from "../Global/DeleteConfirmationDialog";
import { DataTable } from "../Table/TableData";
import { TablePagination } from "../Table/TablePagination";
import { AutomationTableColumns } from "./AutomationTableColumns";

export const AutomationsListTable = () => {
  const t = useTranslations("Automations.List");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAutomationId, setSelectedAutomationId] = useState<
    string | null
  >(null);

  // Handle delete action
  const handleDelete = (id: string) => {
    setSelectedAutomationId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedAutomationId) {
      await api
        .delete(`/contentCycle/${selectedAutomationId}`)
        .then((res) => {
          toast.success(t("Toast.deleted"));
          mutate(mutateIncludeStringKey("/contentCycle"));
        })
        .catch((e) => {
          toast.error(t("Toast.delete_error"));
        })
        .finally(() => {
          setDeleteDialogOpen(false);
          setSelectedAutomationId(null);
        });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedAutomationId(null);
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
  const { data, isLoading } = useSWR<AutomationResponse | null>(
    `/contentCycle?page=${page}&limit=${limit}`,
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
