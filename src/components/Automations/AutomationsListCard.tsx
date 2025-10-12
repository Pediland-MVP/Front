"use client";

import api from "@/hooks/swr/api-client";
import { mutateIncludeStringKey } from "@/utils/mutateIncludeStringKey";
import type { Table } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";

// TODO: Refactor
import type { AutomationResponse } from "@/schemas/automation";
import type { PageMeta } from "@/schemas/pageMeta";

import {
  AutomationCard,
  AutomationTableColumns,
  DeleteConfirmationDialog,
  ItemsPagination,
} from "@components";

export const AutomationsListCard = () => {
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
  const [limit, setLimit] = useState(21);

  const onPageChange = useCallback(
    (newPage: number) => setPage(Math.max(1, newPage)),
    [],
  );

  const onLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

  // TODO: Better type for AutomationResponse
  const apiUrl = `/contentCycle?page=${page}&limit=${limit}`;

  const { data, isLoading } = useSWR<AutomationResponse | null>(apiUrl);

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

      <div className="flex-1">
        {items.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-muted-foreground text-sm">
              {t("no_automations")}
            </div>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {items.map((item) => (
              <AutomationCard
                key={item.id}
                item={item}
                handleDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <ItemsPagination
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
