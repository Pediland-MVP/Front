// src/components/table/pagination.tsx

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table } from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  totalCount: number;
}

export function DataTablePagination<TData>({
  table,
  totalCount,
}: DataTablePaginationProps<TData>) {
  const t = useTranslations("Pagination");
  const locale = useLocale();
  const { pageIndex, pageSize } = table.getState().pagination;
  const totalItems = totalCount;
  const showingFrom = pageIndex * pageSize + 1;
  const showingTo = Math.min((pageIndex + 1) * pageSize, totalItems);
  const totalPages = table.getPageCount();

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="hidden items-center gap-2 md:flex">
        <Select
          dir={locale === "fa" ? "rtl" : "ltr"}
          value={`${table.getState().pagination.pageSize}`}
          onValueChange={(value) => {
            table.setPageSize(Number(value));
          }}
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue placeholder={table.getState().pagination.pageSize} />
          </SelectTrigger>
          <SelectContent side="top">
            {[20, 40].map((pageSize) => (
              <SelectItem key={pageSize} value={`${pageSize}`}>
                {pageSize}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm font-medium">{t("pageSize")}</p>
      </div>

      <div className="flex w-full items-center justify-center md:w-auto">
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            className="size-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            {locale === "fa" ? <ChevronLeft /> : <ChevronRight />}
          </Button>
          <Button
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            {locale === "fa" ? <ChevronsLeft /> : <ChevronsRight />}
          </Button>

          <div className="flex items-center justify-center px-4 text-sm font-medium">
            {t("pageIndicator", { pageIndex: pageIndex + 1, totalPages })}
          </div>

          <Button
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">{t("firstPage")}</span>
            {locale === "fa" ? <ChevronsRight /> : <ChevronsLeft />}
          </Button>
          <Button
            size="icon"
            className="size-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">{t("prevPage")}</span>
            {locale === "fa" ? <ChevronRight /> : <ChevronLeft />}
          </Button>
        </div>
      </div>

      <div className="hidden text-sm md:block md:pl-3">
        {t("showingItems", { from: showingFrom, to: showingTo, total: totalItems })}
      </div>
    </div>
  );
}
