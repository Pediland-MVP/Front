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
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/theme/ui/card";

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
  const [data, setData] = useState<ContentCycleResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = async (
    page: number = 1,
    limit: number = 10,
    force: boolean = false
  ) => {
    if (
      (currentPage === data?.meta?.totalPages || currentPage === 0) &&
      !force
    ) {
      // Last page and first page
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACK_API_URL}/contentCycle?page=${page}&limit=${limit}`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) {
        throw new Error(t("fetchError"));
      }
      const result = await response.json();
      setData(result);
      setCurrentPage(page);
    } catch (error) {
      setError(t("fetchErrorRetry"));
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (itemToDelete) {
      console.log("itemToDelete", itemToDelete);

      setIsLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACK_API_URL}/contentCycle/${itemToDelete}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

        if (!res.ok) {
          toast({
            title: t("error"),
            description: t("problemOccurred"),
            variant: "destructive",
          });
          return;
        }

        toast({
          title: t("deleted"),
        });
        await fetchData(currentPage, undefined, true); // Refresh data after deletion
      } catch (error) {
        setError(t("deleteErrorRetry"));
        console.error("Error deleting item:", error);
      } finally {
        setIsLoading(false);
        setDeleteDialogOpen(false);
        setItemToDelete(null);
      }
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
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner className="h-8 w-8 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
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
                    <TableHead className="text-center lg:w-[20%]">
                      {t("firstMessage")}
                    </TableHead>
                    <TableHead className="lg:w-[10%] text-center">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {data?.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-center py-3">{item.title}</TableCell>
                      <TableCell className="text-center">
                        {item.conditions.length > 0
                          ? item.conditions.map((c) => c.value).join(", ")
                          : t("notAvailable")}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="max-w-[50ch] overflow-hidden text-ellipsis whitespace-nowrap">
                          {item.contents[0]?.text || t("notAvailable")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-3">
                          <Link
                            href={`/console/sessions?contentCycleId=${item.id}`}
                          >
                            <EnvelopeSimple
                              size={20}
                              weight="light"
                              className="text-gray-500 hover:text-primary cursor-pointer" />

                          </Link>
                          <Link
                            href={`/console/actions/content-cycle/${item.id}`}
                          >
                            <Pencil
                              size={20}
                              weight="light"
                              className="text-gray-500 hover:text-green-600 cursor-pointer" />

                          </Link>
                          <Trash
                            size={20}
                            weight="light"
                            className="text-gray-500 hover:text-red-600 cursor-pointer"
                            onClick={() => handleDeleteClick(item.id)} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {data?.meta && (
              <div className="flex justify-between items-center mt-4">
                <Button
                  variant="ghost"
                  onClick={() => fetchData(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  {locale === "fa" ? <CaretRight size={18} /> : <CaretLeft size={18} />}
                  {t("previous")}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {t("pageOf", {
                    current: currentPage,
                    total: data.meta.totalPages,
                  })}
                </span>
                <Button
                  variant="ghost"
                  onClick={() => fetchData(currentPage + 1)}
                  disabled={currentPage === data.meta.totalPages}
                >
                  {t("next")}
                  {locale === "fa" ? <CaretLeft size={18} /> : <CaretRight size={18} />}
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
