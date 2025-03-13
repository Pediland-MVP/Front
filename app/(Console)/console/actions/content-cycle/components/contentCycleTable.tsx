"use client";

import { useLocale, useTranslations } from "next-intl";
import React, { useState, useEffect } from "react";
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
  Spinner,
  Pencil,
  Trash,
  CaretRight,
  CaretLeft,
  Mailbox,
  EnvelopeSimple,
  Plus,
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/theme/ui/card";
import useSWRImmutable from "swr/immutable";
import { ContentCycleNamespace } from "@/types/contentCycles/contentCycle.namespace";
import api from "@/hooks/swr/api-client";

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
  const LIMIT = 15;

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

  return (
    <Card className="border-b-2 border-gray-100">
      <div>
        {isContentCycleLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">{t("title")}</TableHead>
                    <TableHead className="text-center">
                      {t("conditionValue")}
                    </TableHead>
                    <TableHead className="lg:w-[10%] text-center">
                      {t("actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {contentCycles?.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-center py-3">
                        {item.title}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.conditions.length > 0
                          ? item.conditions.map((c) => c.value).join(", ")
                          : t("notAvailable")}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-3">
                          <Link
                            href={`/console/sessions?contentCycleId=${item.id}`}
                          >
                            <EnvelopeSimple
                              size={20}
                              weight="light"
                              className="text-gray-500 hover:text-primary cursor-pointer"
                            />
                          </Link>
                          <Link
                            href={`/console/actions/content-cycle/${item.id}`}
                          >
                            <Pencil
                              size={20}
                              weight="light"
                              className="text-gray-500 hover:text-green-600 cursor-pointer"
                            />
                          </Link>
                          <Trash
                            size={20}
                            weight="light"
                            className="text-gray-500 hover:text-red-600 cursor-pointer"
                            onClick={() => handleDeleteClick(item.id)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {contentCycles?.meta && (
              <div className="flex justify-between items-center mt-4">
                <Button
                  variant="ghost"
                  onClick={prevPage}
                  disabled={currentPage === 1}
                >
                  {locale === "fa" ? (
                    <CaretRight size={18} />
                  ) : (
                    <CaretLeft size={18} />
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
                  onClick={nextPage}
                  disabled={currentPage === contentCycles.meta.totalPages}
                >
                  {t("next")}
                  {locale === "fa" ? (
                    <CaretLeft size={18} />
                  ) : (
                    <CaretRight size={18} />
                  )}
                </Button>
              </div>
            )}
          </>
        )}
        <DeleteConfirmationDialog
          isOpen={deleteDialogOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          itemId={itemToDelete || ""}
        />
      </div>
    </Card>
  );
}
