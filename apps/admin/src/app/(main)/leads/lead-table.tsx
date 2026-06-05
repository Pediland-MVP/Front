// src/app/leads/lead-table.tsx
"use client";

import { MarketingLead } from "@/types/lead";
import { PageMeta } from "@/types/meta";
import { SmsData } from "@/types/sms";
import { User } from "@/types/user";
import { useEffect, useState } from "react";
import { columns } from "./columns";
import DialogFormLead from "./dialog-form-lead";
import api from "@/hooks/swr/api-client";
import { toast } from "sonner";

// UI Imports
import { LayoutTable } from "@/components/layout/LayoutTable";
import { DataTable } from "@/components/table/data-table";
import { FilterAdmin } from "@/components/table/filter-admin";
import { FilterCategory } from "@/components/table/filter-category";
import { FilterStatus } from "@/components/table/filter-status";
import { DataTablePagination } from "@/components/table/pagination";
import { SelectAdmins } from "@/components/table/select-admins";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table } from "@tanstack/react-table";
import { UserPlusIcon } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { ExportDialog } from "@/components/table/dialog-export";

export default function LeadTable({
  isRefetching,
  user,
  leads,
  leadsStatus,
  onStatusChange,
  leadAdmins,
  onAdminChange,
  mutateLeads,
  kams,
  openSmsDialog,
  meta,
  onPageChange,
  onLimitChange,
  search,
  onSearchChange,
  categories,
  onCategoryChange,
  actionDate,
  onActionDateChange,
}: {
  isRefetching?: boolean;
  user: User;
  leads: MarketingLead[];
  leadsStatus: string;
  onStatusChange: (status: string) => void;
  leadAdmins: string;
  onAdminChange: (admins: string) => void;
  mutateLeads?: () => void;
  kams: User[];
  openSmsDialog?: (data: SmsData) => void;
  meta: PageMeta;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  search: string;
  onSearchChange: (search: string) => void;
  categories: string[];
  onCategoryChange: (categories: string[]) => void;
  actionDate: Date | null;
  onActionDateChange: (date: Date | null) => void;
}) {
  const [dialogLeadFormOpen, setDialogLeadFormOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState({});
  const [selectedRows, setSelectedRows] = useState<MarketingLead[]>([]);
  const [tableInstance, setTableInstance] =
    useState<Table<MarketingLead> | null>(null);
  const [tempSearch, setTempSearch] = useState(search);

  const handleExportLeads = async (data: {
    startDate: Date;
    endDate: Date;
    email: string;
    count: number;
  }) => {
    try {
      const response = await api.post("/marketingLeads/excelExport", {
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        email: data.email,
        count: data.count,
      });
      
      if (response.data) {
        toast.success("درخواست خروجی اکسل سرنخ‌ها با موفقیت ارسال شد. لطفاً ایمیل خود را بررسی کنید.");
      }
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("خطا در ارسال درخواست خروجی اکسل سرنخ‌ها.");
      throw error;
    }
  };

  const selectedIds = selectedRows.map((row) => row.id);
  const cols = columns(user, mutateLeads, openSmsDialog);

  useEffect(() => {
    setTempSearch(search);
  }, [search]);

  return (
    <LayoutTable isRefetching={isRefetching}>
      <div className="flex flex-1 flex-col gap-3 overflow-hidden p-4">
      <div className="flex flex-wrap items-center gap-2 pb-3">
        <div className="grid flex-1 grid-cols-2 items-center gap-1.5 md:flex">
          <Button onClick={() => setDialogLeadFormOpen(true)}>
            سرنخ جدید
            <UserPlusIcon />
          </Button>

          <ExportDialog
            title="خروجی اکسل سرنخ‌ها"
            description="اطلاعات سرنخ‌های بازاریابی را در بازه زمانی مشخص شده خروجی بگیرید"
            onExport={handleExportLeads}
          />

          <Input
            type="search"
            id="search"
            value={tempSearch}
            onChange={(e) => {
              const value = e.target.value;
              setTempSearch(value);

              if (value === "") {
                onSearchChange("");
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSearchChange(tempSearch);
              }
            }}
            placeholder="جستجو..."
            className="max-w-[200px]"
          />

          <DatePicker
            date={actionDate ?? undefined}
            onChange={(date) => onActionDateChange(date ?? null)}
          />

          <FilterCategory value={categories} onChange={onCategoryChange} />

          <FilterStatus
            type="lead"
            value={leadsStatus}
            onChange={onStatusChange}
          />

          {user && user.role !== "kam" && (
            <FilterAdmin
              data={kams}
              value={leadAdmins}
              onChange={onAdminChange}
            />
          )}

          {user &&
            user.role !== "kam" &&
            Object.keys(rowSelection).length > 0 && (
              <SelectAdmins
                type="lead"
                kams={kams}
                itemIds={selectedIds}
                mutateData={mutateLeads}
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
        data={leads}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        setSelectedRows={setSelectedRows}
        tableInstanceRef={setTableInstance}
        page={meta.currentPage}
        limit={meta.itemsPerPage}
        totalCount={meta.totalItems}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
      />

      {tableInstance && (
        <DataTablePagination
          table={tableInstance}
          totalCount={meta.totalItems}
        />
      )}

      <DialogFormLead
        open={dialogLeadFormOpen}
        onOpenChange={setDialogLeadFormOpen}
        mutate={mutateLeads}
      />
    </div>
    </LayoutTable>
  );
}
