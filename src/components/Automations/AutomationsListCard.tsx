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

import {
  AutomationTableColumns,
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  DeleteConfirmationDialog,
  ItemsPagination,
} from "@components";
import { CircleXIcon, TrashIcon } from "lucide-react";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

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

      <div className="mb-2 grid gap-3 md:grid-cols-3">
        {items.map((item) => (
          <Card
            key={item.id}
            className="gap-0 border-violet-200 p-0 shadow-violet-200"
          >
            <CardContent className="space-y-3 p-4 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="text-secondary font-medium">شرط‌ها:</div>
                <div className="line-clamp-1 space-x-1.5">
                  {item.conditions.map((condition) => (
                    <Badge
                      variant="outline"
                      className="h-6 rounded-full border-indigo-200/60 bg-indigo-50 px-2 py-0 text-[13px] font-medium text-indigo-600"
                      key={condition.id}
                    >
                      {condition.value}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="text-secondary flex items-center gap-2 font-medium">
                <div>فعال در:</div>
                <div className="flex items-center gap-2">
                  <div className="border-l border-gray-200 pl-2">
                    {item.isDirect ? (
                      <div className="flex items-center gap-1 text-[13px] text-green-600">
                        <CheckCircleIcon size={16} />
                        دایرکت
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[13px] text-gray-300">
                        <CheckCircleIcon size={16} />
                        دایرکت
                      </div>
                    )}
                  </div>
                  <div>
                    {item.isComment ? (
                      <div className="flex items-center gap-1 text-[13px] text-green-600">
                        <CheckCircleIcon size={16} />
                        کامنت
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[13px] text-gray-300">
                        <CheckCircleIcon size={16} />
                        کامنت
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex rounded-b-xl bg-gray-100 p-0">
              <Button
                className="text-muted-foreground hover:text-secondary w-full flex-1 rounded-none rounded-br-xl hover:bg-blue-100"
                variant="ghost"
                type="button"
                size="sm"
                asChild
              >
                <Link href={`/automations/${item.id}`}>ویرایش</Link>
              </Button>
              {/* <Button
                className="text-muted-foreground w-full flex-1 rounded-none hover:bg-green-100 hover:text-green-800"
                variant="ghost"
                type="button"
                size="sm"
              >
                پاسخ‌ها
              </Button> */}
              <Button
                className="hover:text-destructive text-muted-foreground w-full flex-1 rounded-none rounded-bl-xl hover:bg-red-100"
                variant="ghost"
                type="button"
                size="sm"
                onClick={() => handleDelete(item.id)}
              >
                حذف
              </Button>
            </CardFooter>
          </Card>
        ))}
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
