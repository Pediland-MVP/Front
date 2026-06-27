import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import type { Table } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { LoaderPulse } from '../ui-custom/LoaderPulse';

interface ItemsPaginationProps<TData> {
  table?: Table<TData> | null; // Optional TanStack table instance
  totalCount?: number; // Total items count from API
  onPageChange: (page1Based: number) => void; // Callback, expects 1-based page index
  onLimitChange: (pageSize: number) => void; // Callback for page size change
  isLoading?: boolean;

  // Server-side metadata (preferred if available)
  serverPage?: number; // 1-based current page
  serverPerPage?: number; // Items per page from server
  serverItemCount?: number; // Number of items on the current page
  serverTotalPages?: number; // Total pages reported by server
}

export function ItemsPagination<TData>({
  table,
  totalCount,
  onPageChange,
  onLimitChange,
  isLoading,
  serverPage,
  serverPerPage,
  serverItemCount,
  serverTotalPages,
}: ItemsPaginationProps<TData>) {
  const defaultPageSize = 21;

  // TanStack pagination state (fallback if server metadata is not provided)
  const pagination = table?.getState?.().pagination ?? {
    pageIndex: 0,
    pageSize: defaultPageSize,
  };

  // Determine pageSize: prefer server value, fallback to table state or default
  const pageSize = Number.isFinite(serverPerPage as number)
    ? (serverPerPage as number)
    : Number.isFinite(pagination.pageSize)
      ? pagination.pageSize
      : defaultPageSize;

  // total items for current query (search or all)
  const total = Number.isFinite(totalCount as number) ? (totalCount as number) : 0;

  // Compute total pages: prefer server-provided, fallback to math
  const computedTotalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)) || 1);
  const totalPages = Number.isFinite(serverTotalPages as number)
    ? (serverTotalPages as number)
    : Math.max(1, Math.ceil(total / pageSize) || 1);

  // Current page (0-based for internal logic): prefer server value, fallback to table state
  const fallbackIndex0 = Number.isFinite(pagination.pageIndex) ? pagination.pageIndex : 0;
  const pageIndex0Raw = Number.isFinite(serverPage as number)
    ? (serverPage as number) - 1
    : fallbackIndex0;
  // current page index (0-based)
  const pageIndex0 = Number.isFinite(serverPage as number)
    ? Math.max(0, (serverPage as number) - 1)
    : pagination.pageIndex;

  const atFirstPage = pageIndex0 <= 0;
  const atLastPage = pageIndex0 + 1 >= totalPages;

  // Actual number of items on this page
  const countThisPage = Number.isFinite(serverItemCount as number)
    ? (serverItemCount as number)
    : Math.min(pageSize, Math.max(0, total - pageIndex0 * pageSize));

  // Range to display ("Showing X to Y of Z")
  const showingFrom = total === 0 ? 0 : pageIndex0 * pageSize + 1;
  const showingTo = total === 0 ? 0 : showingFrom + Math.max(0, countThisPage) - 1;

  // Disable all controls while loading
  const disabledAll = !!isLoading;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 md:flex-nowrap">
      {/* Display range text */}
      <div className="text-muted-foreground hidden min-w-1/5 shrink-0 text-sm md:flex">
        {isLoading ? (
          <LoaderPulse />
        ) : total === 0 ? (
          `0 رکورد`
        ) : (
          `نمایش ${showingFrom} تا ${showingTo} از  مجموع ${total} رکورد`
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex w-full items-center justify-center md:w-auto">
        <div className="flex items-center gap-1">
          {/* Last */}
          <Button
            variant="outline"
            size="icon"
            className="hidden size-8 bg-white lg:flex"
            onClick={() => onPageChange(totalPages)}
            disabled={disabledAll || atLastPage}
          >
            <span className="sr-only">برو به آخر</span>
            <ChevronsRight />
          </Button>

          {/* Next */}
          <Button
            variant="outline"
            size="icon"
            className="size-8 bg-white"
            onClick={() => onPageChange(pageIndex0 + 2)} // convert to 1-based
            disabled={disabledAll || atLastPage}
          >
            <span className="sr-only">صفحه بعد</span>
            <ChevronRight />
          </Button>

          {/* Current page info */}
          <div className="text-muted-foreground flex items-center justify-center px-4 text-sm">
            {isLoading ? (
              <LoaderPulse />
            ) : (
              `صفحه ${Math.min(pageIndex0 + 1, totalPages)} از ${totalPages}`
            )}
          </div>

          {/* Previous */}
          <Button
            variant="outline"
            size="icon"
            className="size-8 bg-white"
            onClick={() => onPageChange(pageIndex0)} // prev page = index0 → 1-based
            disabled={disabledAll || atFirstPage}
          >
            <span className="sr-only">برو به صفحه قبلی</span>
            <ChevronLeft />
          </Button>

          {/* First */}
          <Button
            variant="outline"
            size="icon"
            className="hidden size-8 bg-white lg:flex"
            onClick={() => onPageChange(1)}
            disabled={disabledAll || atFirstPage}
          >
            <span className="sr-only">برو به صفحه اول</span>
            <ChevronsLeft />
          </Button>
        </div>
      </div>

      {/* Page size selector */}
      <div className="hidden items-center gap-2 md:flex">
        <p className="text-muted-foreground text-sm">نمایش</p>

        <Select
          dir="rtl"
          value={String(pageSize)}
          onValueChange={(value) => onLimitChange(Number(value))}
          disabled={disabledAll}
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue>{pageSize}</SelectValue>
          </SelectTrigger>
          <SelectContent side="top">
            {[21, 39].map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
