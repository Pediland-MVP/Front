"use client";

import api from "@/hooks/swr/api-client";
import { useDebounce } from "@/hooks/useDebounce";
import { useHeaderFeatures } from "@/lib/stores/useHeaderFeaturesStore";
import { mutateIncludeStringKey } from "@/utils/mutateIncludeStringKey";
import { AxiosError } from "axios";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import useSWRImmutable from "swr/immutable";
// TODO: Refactor
import type { AutomationResponse } from "@/schemas/automation";
import type { PageMeta } from "@/schemas/pageMeta";
import { ExceptionMessage } from "@/types/exceptionMessage";

import { ItemsPagination } from "../Console/ItemsPagination";
import { DeleteConfirmationDialog } from "../Global/DeleteConfirmationDialog";
import { NoDataError } from "../Global/NoDataError";
import { InstagramFilter } from "@/components/ui-custom/InstagramFilter";
import { LoaderSpin } from "../ui-custom/LoaderSpin";
import { AutomationCard } from "./AutomationCard";

interface AutomationsListCardProps {
  search: string;
}

export const AutomationsCardList = ({ search }: AutomationsListCardProps) => {
  const t = useTranslations("Automations.List");
  const t_ec = useTranslations("ERROR_CODES");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(21);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [selectedInstagramIds, setSelectedInstagramIds] = useState<string[]>([]);
  const { setError } = useHeaderFeatures();

  // TODO: Better type for AutomationResponse
  let searchParams = "";
  const debouncedSearchTerm = useDebounce(search, 500);
  search ? (searchParams = `&search=${debouncedSearchTerm}`) : null;
  const instagramIdsParam = selectedInstagramIds
    .map((id) => `instagramIds=${id}`)
    .join("&");
  const apiUrl =
    selectedInstagramIds.length > 0
      ? `/contentCycle?page=${page}&limit=${limit}${searchParams}&isDirect=false&isComment=false&haveInstagramPost=false&${instagramIdsParam}`
      : null;
  const {
    data: automationsData,
    error: automationsError,
    isLoading: isAutomationsLoading,
    mutate: fetchAutomations,
  } = useSWRImmutable<AutomationResponse>(apiUrl, {
    revalidateOnMount: true,
  });
  const automations = automationsData?.items ?? [];

  // ------- Pagination Start -------
  const defaultMeta: PageMeta = {
    currentPage: page,
    itemsPerPage: limit,
    itemCount: 0,
    totalItems: 0,
    totalPages: 1,
  };
  const meta: PageMeta = automationsData?.meta ?? defaultMeta;

  const onPageChange = useCallback(
    (newPage: number) => setPage(Math.max(1, newPage)),
    [],
  );

  const onLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  }, []);
  // ------- Pagination End -------

  // ------- Item Delete Start -------
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleDelete = useCallback((id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = async () => {
    if (itemToDelete) {
      await api
        .delete(`/contentCycle/${itemToDelete}`)
        .then((res) => {
          toast.success(t("Toast.deleted"));
          mutate(mutateIncludeStringKey("/contentCycle"));
        })
        .catch((error: AxiosError<ExceptionMessage>) => {
          const code = error.response?.data?.code;
          toast.error(t_ec(code));
        })
        .finally(() => {
          setDeleteDialogOpen(false);
          setItemToDelete(null);
        });
    }
  };
  // ------- Item Delete End -------

  useEffect(() => {
    if (automationsError) {
      setError(true);
    }
  }, [automationsError]);

  if (automationsError) {
    return <NoDataError />;
  }

  if (isAutomationsLoading) {
    return <LoaderSpin />;
  }

  return (
    <>
      <InstagramFilter
        selectedIds={selectedInstagramIds}
        onChange={setSelectedInstagramIds}
      />
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />

      <div className="flex-1">
        {automations.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-muted-foreground text-sm">
              {t("no_automations")}
            </div>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3 2xl:grid-cols-4">
            {automations.map((item) => (
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
