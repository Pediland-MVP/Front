"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import Link from "next/link";
import { DeleteConfirmationDialog } from "../Global/DeleteConfirmationDialog";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@befroosh/ui";
import { Button } from "@befroosh/ui";
import {
  PencilIcon,
  TrashIcon,
  CaretRightIcon,
  CaretLeftIcon,
  EnvelopeSimpleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@befroosh/ui";
import useSWRImmutable from "swr/immutable";
import api from "@/hooks/swr/api-client";
import { ContnetCycleTableWizard } from "./contentCycleTable.wizard";

type ContentCycle = {
  title: string;
  id: string;
  conditions: Array<{ type: string; value: string }>;
  contents: Array<{
    id: string;
    text: string | null;
  }>;
};

type ContentCycleResponse = {
  items: ContentCycle[];
  meta: {
    currentPage: number;
    itemCount: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  };
};

export default function ContentCycleTable() {
  const t = useTranslations("Automations.List");
  const [isDeleteLoading, setIsDeleteLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const LIMIT = 35;

  // TODO: Better type for ContentCycleResponse
  const {
    data: contentCycles,
    isLoading: isContentCycleLoading,
    error: contentCycleError,
    mutate: contentCycleMutate,
  } = useSWRImmutable<ContentCycleResponse | null>(
    `/contentCycle?page=${currentPage}&limit=${LIMIT}`,
    {
      revalidateOnMount: true,
    },
  );

  const nextPage = () => {
    setCurrentPage((prevPage) => prevPage + 1);
    contentCycleMutate();
  };

  const prevPage = () => {
    setCurrentPage((prevPage) => prevPage - 1);
    contentCycleMutate();
  };

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (itemToDelete) {
      await api
        .delete(`/contentCycle/${itemToDelete}`)
        .then((res) => {
          toast.success(t("deleted"));
          contentCycleMutate();
        })
        .catch((e) => {
          toast.error(t("error"));
        })
        .finally(() => {
          setIsDeleteLoading(false);
          setDeleteDialogOpen(false);
          setItemToDelete(null);
        });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };
  const locale = useLocale();

  if (!isContentCycleLoading && !contentCycles?.items.length) {
    return <ContnetCycleTableWizard />;
  }

  return (
    <Card className="border-b-2 border-gray-100">
      <div className="_table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("conditionValue")}</TableHead>
              <TableHead>{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {contentCycleError ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-red-500">
                  {t("errorLoadingContacts")}
                </TableCell>
              </TableRow>
            ) : isContentCycleLoading ? (
              <p>loading...</p>
            ) : (
              contentCycles?.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.conditions.length > 0
                      ? item.conditions.map((c) => c.value).join(", ")
                      : t("notAvailable")}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-3">
                      <Link
                        href={`/automations/sessions?contentCycleId=${item.id}`}
                      >
                        <EnvelopeSimpleIcon
                          size={20}
                          weight="light"
                          className="hover:text-primary cursor-pointer"
                        />
                      </Link>
                      <Link href={`/automations/${item.id}`}>
                        <PencilIcon
                          size={20}
                          weight="light"
                          className="cursor-pointer hover:text-green-600"
                        />
                      </Link>
                      <TrashIcon
                        size={20}
                        weight="light"
                        className="cursor-pointer hover:text-red-600"
                        onClick={() => handleDeleteClick(item.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {contentCycles?.meta && (
        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size={"sm"}
            onClick={prevPage}
            disabled={currentPage === 1}
          >
            {locale === "fa" ? <CaretRightIcon /> : <CaretLeftIcon />}
            {t("previous")}
          </Button>
          <span className="text-muted-foreground text-sm">
            {t("pageOf", {
              current: currentPage,
              total: contentCycles.meta.totalPages,
            })}
          </span>
          <Button
            variant="ghost"
            size={"sm"}
            onClick={nextPage}
            disabled={currentPage === contentCycles.meta.totalPages}
          >
            {t("next")}
            {locale === "fa" ? <CaretLeftIcon /> : <CaretRightIcon />}
          </Button>
        </div>
      )}

      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </Card>
  );
}
