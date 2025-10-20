"use client";

import api from "@/hooks/swr/api-client";
import { useHeaderFeatures } from "@/lib/stores/useHeaderFeaturesStore";
import { mutateIncludeStringKey } from "@/utils/mutateIncludeStringKey";
import type { Table } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";

// TODO: Refactor
import type { AutomationResponse } from "@/schemas/automation";
import type { PageMeta } from "@/schemas/pageMeta";

import {
  AutomationCard,
  DeleteConfirmationDialog,
  ItemsPagination,
  LoaderSpin,
  NoDataError,
} from "@components";

interface AutomationsListCardProps {
  search: string;
}

export const AutomationsListCard = ({ search }: AutomationsListCardProps) => {
  const t = useTranslations("Automations.List");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAutomationId, setSelectedAutomationId] = useState<
    string | null
  >(null);

  const { setError } = useHeaderFeatures();

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
  let searchParams = "";
  search ? (searchParams = `&search=${search}`) : null;
  const apiUrl = `/contentCycle?page=${page}&limit=${limit}${searchParams}&isDirect=false&isComment=false&haveInstagramPost=false`;

  const {
    data: automations,
    isLoading: isAutomationsLoading,
    error: FetchAutomationsError,
  } = useSWR<AutomationResponse | null>(apiUrl);

  console.log("Automations...", automations);

  useEffect(() => {
    if (FetchAutomationsError) {
      setError(true);
    }
  }, [FetchAutomationsError]);

  // Map Wire -> Domain (memoized)
  const items = automations?.items ?? [];

  // Safe meta (fallback while loading)
  const defaultMeta: PageMeta = {
    currentPage: page,
    itemsPerPage: limit,
    itemCount: 0,
    totalItems: 0,
    totalPages: 1,
  };
  const meta: PageMeta = automations?.meta ?? defaultMeta;

  if (FetchAutomationsError) {
    return <NoDataError />;
  }

  if (isAutomationsLoading) {
    return <LoaderSpin />;
  }

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
        isLoading={isAutomationsLoading}
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
