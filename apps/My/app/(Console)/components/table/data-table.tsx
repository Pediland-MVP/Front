// src/app/leads/data-table.tsx
"use client";

import { formatNumber } from "@/utils/formatNumber";
import { ColumnMeta } from "@/types/tables";
import { useEffect, useState } from "react";

// UI Imports
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Cell,
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  OnChangeFn,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  rowSelection?: Record<string, boolean>;
  onRowSelectionChange?: OnChangeFn<Record<string, boolean>>;
  setSelectedRows?: (rows: TData[]) => void;
  tableInstanceRef?: (table: ReturnType<typeof useReactTable<TData>>) => void;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (columnVisibility: VisibilityState) => void;
  page?: number;
  limit?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  serverSorting?: boolean;
  onSortingChange?: (sorting: SortingState) => void; // اختیاری اگه بخوای بیرونی کنترل کنی
  sortingState?: SortingState; // حالت فعلی sorting اگه از بیرون بیاد
}

export function DataTable<TData, TValue>({
  columns,
  data,
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
  const [internalColumnVisibility, setInternalColumnVisibility] =
    useState<VisibilityState>({});
  const resolvedColumnVisibility = columnVisibility ?? internalColumnVisibility;
  const resolvedSetColumnVisibility: OnChangeFn<VisibilityState> =
    onColumnVisibilityChange
      ? (updaterOrValue) => {
          // اگه تابع هست
          if (typeof updaterOrValue === "function") {
            onColumnVisibilityChange(updaterOrValue(resolvedColumnVisibility));
          } else {
            onColumnVisibilityChange(updaterOrValue);
          }
        }
      : setInternalColumnVisibility;

  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const resolvedSorting = sortingState ?? internalSorting;
  const resolvedSetSorting: OnChangeFn<SortingState> = (updaterOrValue) => {
    if (typeof updaterOrValue === "function") {
      const updated = updaterOrValue(sortingState ?? internalSorting);
      onSortingChange?.(updated);
      setInternalSorting(updated);
    } else {
      onSortingChange?.(updaterOrValue);
      setInternalSorting(updaterOrValue);
    }
  };

  /* ----- Table Instance ----- */
  const table = useReactTable({
    columns,
    data,
    pageCount: Math.ceil(totalCount / limit),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: !serverSorting ? getSortedRowModel() : undefined,
    manualSorting: serverSorting,
    onSortingChange: resolvedSetSorting,
    onColumnVisibilityChange: resolvedSetColumnVisibility,
    onRowSelectionChange,
    state: {
      sorting: resolvedSorting,
      columnVisibility: resolvedColumnVisibility,
      rowSelection,
      pagination: {
        pageIndex: page - 1,
        pageSize: limit,
      },
    },
    manualPagination: true,
    onPaginationChange: (updater) => {
      const newState =
        typeof updater === "function"
          ? updater({ pageIndex: page - 1, pageSize: limit })
          : updater;

      onPageChange(newState.pageIndex + 1);
      onLimitChange(newState.pageSize);
    },
  });

  /* ----- Table Instance Ref ----- */
  useEffect(() => {
    tableInstanceRef?.(table);
  }, [table, tableInstanceRef]);

  /* ----- Render Table Cells ----- */
  function renderCell<T>(cell: Cell<T, unknown>): React.ReactNode {
    const meta = cell.column.columnDef.meta as ColumnMeta;
    const raw = cell.getValue();

    if (meta?.isNumeric && typeof raw === "number") {
      return formatNumber(raw);
    }

    return flexRender(cell.column.columnDef.cell, cell.getContext());
  }

  /* ----- Render Table Selected Rows ----- */
  const currentRowSelection = table.getState().rowSelection;

  useEffect(() => {
    if (!setSelectedRows) return;

    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((row) => row.original);

    setSelectedRows(selectedRows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRowSelection, setSelectedRows]);

  return (
    <div className="flex-1 overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} data-header={true}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? "selected" : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{renderCell(cell)}</TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-14">
                <span className="text-muted-foreground">موردی یافت نشد.</span>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
