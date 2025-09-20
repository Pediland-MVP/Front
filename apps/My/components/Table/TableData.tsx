"use client";

import { formatNumber } from "@/utils/formatNumber";
import { cn } from "@befroosh/lib/utils";
import { ColumnDef, ColumnMeta } from "@/types/tables";
import {
  Cell,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  OnChangeFn,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import {
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@befroosh/ui";

// Define props for the generic DataTable component
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]; // List of column definitions
  data: TData[]; // Table row data
  isLoading?: boolean; // Optional external row selection state
  rowSelection?: Record<string, boolean>; // Optional external row selection state
  onRowSelectionChange?: OnChangeFn<Record<string, boolean>>; // Optional row selection handler
  setSelectedRows?: (rows: TData[]) => void; // Optional callback to expose selected rows
  tableInstanceRef?: (table: ReturnType<typeof useReactTable<TData>>) => void; // Optional ref to table instance
  columnVisibility?: VisibilityState; // External column visibility state
  onColumnVisibilityChange?: (columnVisibility: VisibilityState) => void; // Handler for column visibility changes
  page: number; // Current page index (1-based)
  limit: number; // Rows per page
  totalCount: number; // Total row count (used for pagination)
  onPageChange: (page: number) => void; // Handler for page changes
  onLimitChange: (limit: number) => void; // Handler for rows-per-page change
  serverSorting?: boolean; // Whether sorting is controlled externally
  onSortingChange?: (sorting: SortingState) => void; // External sorting state update
  sortingState?: SortingState; // External sorting state
}

// Safe wrapper for rendering table cells and headers
function safeFlexRender(Comp: any, ctx: any, fallback: React.ReactNode = null) {
  try {
    return flexRender(Comp, ctx);
  } catch (e) {
    const colId = ctx?.column?.id;
    const rowId = ctx?.row?.id;
    console.error("❌ Cell/Header render error", { colId, rowId, e });
    return fallback;
  }
}

// Generic and fully typed DataTable component
export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  rowSelection,
  onRowSelectionChange,
  tableInstanceRef,
  setSelectedRows,
  columnVisibility,
  onColumnVisibilityChange,
  page,
  limit,
  totalCount,
  onPageChange,
  onLimitChange,
  serverSorting,
  onSortingChange,
  sortingState,
}: DataTableProps<TData, TValue>) {
  const t = useTranslations("DataTable");

  // Local state for column visibility if not externally controlled
  const [internalColumnVisibility, setInternalColumnVisibility] =
    useState<VisibilityState>({});

  const resolvedColumnVisibility = columnVisibility ?? internalColumnVisibility;

  // Determines whether to use external or internal column visibility handler
  const resolvedSetColumnVisibility: OnChangeFn<VisibilityState> =
    onColumnVisibilityChange
      ? (updaterOrValue) => {
          if (typeof updaterOrValue === "function") {
            onColumnVisibilityChange(updaterOrValue(resolvedColumnVisibility));
          } else {
            onColumnVisibilityChange(updaterOrValue);
          }
        }
      : setInternalColumnVisibility;

  // Local sorting state if not controlled externally
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const resolvedSorting = sortingState ?? internalSorting;

  // Determines whether to use internal or external sorting update
  const resolvedSetSorting: OnChangeFn<SortingState> = (updaterOrValue) => {
    const next =
      typeof updaterOrValue === "function"
        ? updaterOrValue(resolvedSorting)
        : updaterOrValue;
    onSortingChange?.(next);
    setInternalSorting(next);
  };

  // Create the table instance
  const table = useReactTable({
    ...(onRowSelectionChange && { onRowSelectionChange }),
    columns,
    columnResizeMode: "onChange",
    columnResizeDirection: "rtl",
    data,
    getCoreRowModel: getCoreRowModel(),
    // Use custom row ID field (required for rowSelection to work reliably)
    getRowId: (row) =>
      (row as any).id?.toString() ??
      (row as any)._id?.toString() ??
      (row as any).uuid?.toString() ??
      JSON.stringify(row),
    getSortedRowModel: !serverSorting ? getSortedRowModel() : undefined,
    manualPagination: true,
    manualSorting: serverSorting,
    onColumnVisibilityChange: resolvedSetColumnVisibility,
    onPaginationChange: (updater) => {
      const newState =
        typeof updater === "function"
          ? updater({ pageIndex: page - 1, pageSize: limit })
          : updater;
      onPageChange(newState.pageIndex + 1);
      onLimitChange(newState.pageSize);
    },
    onSortingChange: resolvedSetSorting,
    pageCount: Math.ceil(totalCount / limit),
    state: {
      sorting: resolvedSorting,
      columnVisibility: resolvedColumnVisibility,
      ...(rowSelection && { rowSelection }),
      pagination: {
        pageIndex: page - 1, // Convert to 0-based index
        pageSize: limit,
      },
    },
  });

  // Pass table instance to parent if requested
  useEffect(() => {
    tableInstanceRef?.(table);
  }, [table, tableInstanceRef]);

  // Pass selected rows to parent (filtered to those present in current data)
  useEffect(() => {
    if (!setSelectedRows) return;
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((row) => row.original)
      .filter(Boolean);
    setSelectedRows(selectedRows);
  }, [table.getState().rowSelection, setSelectedRows]);

  // Render a table cell (with formatting for numeric types)
  function renderCell<T>(cell: Cell<T, unknown>): React.ReactNode {
    const meta = cell.column.columnDef.meta as ColumnMeta;
    const raw = cell.getValue();
    if (meta?.isNumeric && typeof raw === "number") {
      return formatNumber(raw);
    }
    return safeFlexRender(cell.column.columnDef.cell, cell.getContext());
  }

  return (
    <Table dir="rtl">
      <colgroup>
        {table
          .getHeaderGroups()
          .at(-1)
          ?.headers.map((h) => (
            <col key={h.id} style={{ width: `${h.getSize()}px` }} />
          ))}
      </colgroup>
      <TableHeader className="sticky top-0 z-10">
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id} data-header={true}>
            {headerGroup.headers.map((header) => (
              <TableHead
                key={header.id}
                style={{ width: `${header.getSize()}px` }}
              >
                {header.isPlaceholder
                  ? null
                  : safeFlexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      {isLoading ? (
        <TableBody>
          {[...Array(limit)].map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((col, colIndex) => {
                const key =
                  "accessorKey" in col
                    ? col.accessorKey?.toString()
                    : (col.id ?? colIndex);

                const meta = col.meta as ColumnMeta;
                const skeletonClass = meta?.skeletonClass ?? "";

                return (
                  <TableCell key={key}>
                    <Skeleton className={cn("h-4", skeletonClass)} />
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      ) : (
        <TableBody>
          {table.getRowModel().rows?.length > 0 ? (
            table.getRowModel().rows?.map((row) => (
              <TableRow
                key={row.id}
                className="text-gray-500 hover:text-primary group"
                data-state={row.getIsSelected?.() ? "selected" : undefined} // Mark selected rows (if selection is enabled)
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    style={{ width: `${cell.column.getSize()}px` }}
                    className={cn(
                      (cell.column.columnDef.meta as ColumnMeta)?.className,
                      "text-center",
                    )}
                  >
                    {renderCell(cell)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-14">
                <div className="text-muted-foreground px-2">
                  {t("noResults")}
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      )}
    </Table>
  );
}
