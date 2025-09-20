import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
} from "@radix-ui/react-icons";
import { useLocale, useTranslations } from "next-intl";

interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: DataTablePaginationProps) {
  const pageSizeOptions = [10, 20, 30, 40, 50];

  const t = useTranslations('Contacts.Pagination');
  const locale = useLocale();

  return (
    <div className="_pagination flex items-center justify-between gap-4 mt-4 pt-4 border-t">
      <div className="_navigation flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            aria-label="Go to first page"
            variant="outline"
            className="hidden size-8 p-0 lg:flex"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
          >
            {locale === "fa" ? (<DoubleArrowRightIcon className="size-4" aria-hidden="true" />) : <DoubleArrowLeftIcon className="size-4" aria-hidden="true" />}
          </Button>
          <Button
            aria-label="Go to previous page"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            {locale === "fa" ? (<ChevronRightIcon className="size-4" aria-hidden="true" />) : <ChevronLeftIcon className="size-4" aria-hidden="true" />}
          </Button>
          <Button
            aria-label="Go to next page"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            {locale === "fa" ? (<ChevronLeftIcon className="size-4" aria-hidden="true" />) : <ChevronRightIcon className="size-4" aria-hidden="true" />}
          </Button>
          <Button
            aria-label="Go to last page"
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            {locale === "fa" ? (<DoubleArrowLeftIcon className="size-4" aria-hidden="true" />) : <DoubleArrowRightIcon className="size-4" aria-hidden="true" />}
          </Button>
        </div>
        <div className="flex items-center justify-center gap-1 text-gray-500 text-sm">
          <span>{t('page', { pages: totalPages, page: currentPage })}</span>
          {/* <span>صفحه</span>
          {totalPages}
          <span>از</span>
          {currentPage} */}
        </div>
      </div>

      <div className="flex items-center justify-end gap-8 flex-1 text-gray-500 text-sm">
        <div>
          <span>{t('itemsCount')}:</span> {totalItems}
        </div>
        <div className="hidden lg:flex items-center gap-2">
          <span>{t('show')}</span>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-8 w-[4.5rem]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
