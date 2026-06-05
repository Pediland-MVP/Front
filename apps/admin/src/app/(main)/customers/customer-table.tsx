// src/app/(main)/customers/customer-table.tsx
"use client";

import { Customer } from "@/types/customer";
import { PageMeta } from "@/types/meta";
import { SmsData } from "@/types/sms";
import { User } from "@/types/user";
import { useState } from "react";
import api from "@/hooks/swr/api-client";
import { toast } from "sonner";

// UI Imports
import { LayoutTable } from "@/components/layout/LayoutTable";
import { FilterStatus } from "@/components/table/filter-status";
import { DataTable } from "@/components/table/data-table";
import { DataTablePagination } from "@/components/table/pagination";
import { SelectAdmins } from "@/components/table/select-admins";
import { Input } from "@/components/ui/input";
import { SortingState, Table } from "@tanstack/react-table";
import { columns } from "./columns";
import { FilterAdmin } from "@/components/table/filter-admin";
import { FilterCategory } from "@/components/table/filter-category";
import { DatePicker } from "@/components/ui/date-picker";
import { ExportDialog } from "@/components/table/dialog-export";
import { FilterIgToken } from "@/components/table/filter-ig-token";
import { OtpDialog } from "@/components/table/dialog-otp";
import { PanelModeType } from "./client-page";
import { Button } from "@/components/ui/button";

export default function CustomerTable({
  isRefetching,
  user,
  customers,
  customersStatus,
  onStatusChange,
  customerAdmins,
  onAdminChange,
  sortingState,
  onSortingChange,
  mutateCustomers,
  kams,
  openSmsDialog,
  meta,
  onPageChange,
  onLimitChange,
  search,
  onSearchChange,
  setPanelMode,
  panelMode,
  categories,
  onCategoryChange,
  actionDate,
  onActionDateChange,
  isIgTokenValid,
  onIgTokenValidChange,
}: {
  isRefetching?: boolean;
  user: User;
  customers: Customer[];
  customersStatus: string;
  onStatusChange: (status: string) => void;
  customerAdmins: string;
  onAdminChange: (admins: string) => void;
  sortingState: SortingState;
  onSortingChange: (sorting: SortingState) => void;
  mutateCustomers?: () => void;
  kams: User[];
  openSmsDialog?: (data: SmsData) => void;
  meta: PageMeta;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  search: string;
  onSearchChange: (search: string) => void;
  panelMode: PanelModeType;
  setPanelMode: (mode: PanelModeType) => void;
  categories: string[];
  onCategoryChange: (categories: string[]) => void;
  actionDate: Date | null;
  onActionDateChange: (date: Date | null) => void;
  isIgTokenValid: string;
  onIgTokenValidChange: (value: string) => void;
}) {
  const [rowSelection, setRowSelection] = useState({});
  const [selectedRows, setSelectedRows] = useState<Customer[]>([]);
  const [tableInstance, setTableInstance] = useState<Table<Customer> | null>(
    null,
  );
  const [tempSearch, setTempSearch] = useState(search);

  const selectedIds = selectedRows.map((row) => row.id);
  const cols = columns(user, panelMode, openSmsDialog);

  const handleExportCustomers = async (data: {
    startDate: Date;
    endDate: Date;
    email: string;
    count: number;
  }) => {
    try {
      const response = await api.post("/users/excelExport", {
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        email: data.email,
        count: data.count,
      });

      if (response.data) {
        toast.success("درخواست خروجی اکسل کاربران با موفقیت ارسال شد. لطفاً ایمیل خود را بررسی کنید.");
      }
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("خطا در ارسال درخواست خروجی اکسل کاربران.");
      throw error;
    }
  };

  return (
    <LayoutTable isRefetching={isRefetching}>
      <div className="flex flex-1 flex-col gap-2 overflow-hidden p-4">
        {/* Row 1: action buttons + search */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant={panelMode === "pro" ? "default" : "outline"}
            size="sm"
            onClick={() => setPanelMode(panelMode === "standard" ? "pro" : "standard")}
          >
            {panelMode === "standard" ? "استاندارد" : "پرو"}
          </Button>

          <OtpDialog size="sm" />

          <ExportDialog
            size="sm"
            title="خروجی اکسل کاربران"
            description="اطلاعات کاربران را در بازه زمانی مشخص شده خروجی بگیرید"
            onExport={handleExportCustomers}
          />

          <Input
            type="search"
            id="search"
            value={tempSearch}
            onChange={(e) => {
              const value = e.target.value;
              setTempSearch(value);
              if (value === "") onSearchChange("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSearchChange(tempSearch);
              }
            }}
            placeholder="جستجو..."
            className="h-9 flex-1 text-[13px] md:max-w-[200px]"
          />
        </div>

        {/* Row 2: filter chips — scrollable on mobile */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex shrink-0 items-center gap-1.5">
            <DatePicker
              date={actionDate ?? undefined}
              onChange={(date) => onActionDateChange(date ?? null)}
            />

            <FilterCategory size="sm" value={categories} onChange={onCategoryChange} />

            <FilterIgToken size="sm" value={isIgTokenValid} onChange={onIgTokenValidChange} />

            <FilterStatus size="sm" type="customer" value={customersStatus} onChange={onStatusChange} />

            {user && user.role !== "kam" && (
              <FilterAdmin size="sm" data={kams} value={customerAdmins} onChange={onAdminChange} />
            )}

            {user && user.role !== "kam" && Object.keys(rowSelection).length > 0 && (
              <SelectAdmins
                type="customer"
                kams={kams}
                itemIds={selectedIds}
                mutateData={mutateCustomers}
                onClearSelection={() => {
                  setSelectedRows([]);
                  setRowSelection({});
                }}
              />
            )}
          </div>
        </div>

      <DataTable
        columns={cols}
        data={customers}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        setSelectedRows={setSelectedRows}
        tableInstanceRef={setTableInstance}
        page={meta.currentPage}
        limit={meta.itemsPerPage}
        totalCount={meta.totalItems}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
        serverSorting
        sortingState={sortingState}
        onSortingChange={onSortingChange}
      />

      {tableInstance && (
        <DataTablePagination
          table={tableInstance}
          totalCount={meta.totalItems}
        />
      )}
      </div>
    </LayoutTable>
  );
}
