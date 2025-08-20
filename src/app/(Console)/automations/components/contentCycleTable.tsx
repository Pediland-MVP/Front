"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import Link from "next/link";
import { DeleteConfirmationDialog } from "./contentCycleDeleteConfirmation";
// Just UI Imports Below
import { toast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/theme/ui/table";
import { Button } from "@/components/theme/ui/button";
import {
  Pencil,
  Trash,
  CaretRight,
  CaretLeft,
  EnvelopeSimple
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/theme/ui/card";
import useSWRImmutable from "swr/immutable";
import api from "@/hooks/swr/api-client";
import ContentCycleSkeleton from "./contentCycleTableSkeleton";
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
    }
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
          toast({
            title: t("deleted"),
          });
          contentCycleMutate();
        })
        .catch((e) => {
          toast({
            title: t("error"),
            description: t("problemOccurred"),
            variant: "destructive",
          });
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
    return (
      <ContnetCycleTableWizard/>
    );
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
              <ContentCycleSkeleton rowCount={LIMIT} />
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
                        <EnvelopeSimple
                          size={20}
                          weight="light"
                          className="hover:text-primary cursor-pointer"
                        />
                      </Link>
                      <Link href={`/automations/${item.id}`}>
                        <Pencil
                          size={20}
                          weight="light"
                          className="hover:text-green-600 cursor-pointer"
                        />
                      </Link>
                      <Trash
                        size={20}
                        weight="light"
                        className="hover:text-red-600 cursor-pointer"
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
        <div className="flex justify-between items-center mt-4">
          <Button
            variant="ghost"
            size={"sm"}
            onClick={prevPage}
            disabled={currentPage === 1}
          >
            {locale === "fa" ? (
              <CaretRight />
            ) : (
              <CaretLeft />
            )}
            {t("previous")}
          </Button>
          <span className="text-sm text-muted-foreground">
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
            {locale === "fa" ? (
              <CaretLeft />
            ) : (
              <CaretRight />
            )}
          </Button>
        </div>
      )}

      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        itemId={itemToDelete || ""}
      />
    </Card>
  );
}