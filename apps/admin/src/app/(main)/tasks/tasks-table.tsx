// src/app/(main)/tasks/tasks-table.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Table } from "@tanstack/react-table";

// Layout
import { LayoutTable } from "@/components/layout/LayoutTable";

// Table components
import { DataTable } from "@/components/table/data-table";
import { DataTablePagination } from "@/components/table/pagination";
import { FilterAdmin } from "@/components/table/filter-admin";
import { FilterLabel } from "@/components/table/filter-label";
import { SelectAdmins } from "@/components/table/select-admins";
import { OtpDialog } from "@/components/table/dialog-otp";

// UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Task-specific
import { taskColumns } from "./columns";
import { TasksStatsCards } from "./stats-cards";
import { TaskDrawer } from "./task-drawer";

// Types
import type { TaskListItem, TasksStats } from "@/types/task";
import type { PageMeta } from "@/types/meta";
import type { User } from "@/types/user";
import type { LabelListItem } from "@/app/(main)/labels/types";

// Dayjs (Tehran timezone preset helper)
import dayjs from "@/lib/dayjs-jalali";

// ─── Preset range helper ──────────────────────────────────────────────────────

type PresetKey = "today" | "passed" | "tomorrow" | "thisWeek";

const presetRange = (key: PresetKey) => {
  const tz = "Asia/Tehran";
  const startOfToday = dayjs().tz(tz).startOf("day");
  if (key === "today")
    return { from: startOfToday, to: startOfToday.endOf("day") };
  if (key === "tomorrow")
    return {
      from: startOfToday.add(1, "day"),
      to: startOfToday.add(1, "day").endOf("day"),
    };
  if (key === "passed")
    return { from: null, to: startOfToday.subtract(1, "millisecond") };
  // thisWeek (Sat..Fri, Tehran week)
  const dow = (startOfToday.day() + 1) % 7; // Sun=0 → 1 … Sat=6 → 0
  const weekStart = startOfToday.subtract(dow, "day");
  return {
    from: weekStart,
    to: weekStart.add(7, "day").subtract(1, "millisecond"),
  };
};

// ─── Props ───────────────────────────────────────────────────────────────────

export interface TasksTableProps {
  // Data
  tasks: TaskListItem[];
  stats?: TasksStats;
  isStatsLoading?: boolean;
  isRefetching?: boolean;
  meta: PageMeta;
  kams: User[];
  labelsItems: LabelListItem[];
  role: string;

  // Pagination
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;

  // Filters
  search: string;
  onSearchChange: (search: string) => void;
  startDate: string;
  onStartDateChange: (iso: string) => void;
  endDate: string;
  onEndDateChange: (iso: string) => void;
  taskStatus: string;
  onTaskStatusChange: (status: string) => void;
  adminId: string;
  onAdminIdChange: (id: string) => void;
  labelId: string | undefined;
  onLabelIdChange: (id: string | undefined) => void;

  // Mutations
  mutateTasks?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TasksTable({
  tasks,
  stats,
  isStatsLoading,
  isRefetching,
  meta,
  kams,
  labelsItems,
  role,
  onPageChange,
  onLimitChange,
  search,
  onSearchChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  taskStatus,
  onTaskStatusChange,
  adminId,
  onAdminIdChange,
  labelId,
  onLabelIdChange,
  mutateTasks,
}: TasksTableProps) {
  const t = useTranslations("Tasks");

  // ── Local state ───────────────────────────────────────────────────────────
  const [tempSearch, setTempSearch] = useState(search);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [selectedRows, setSelectedRows] = useState<TaskListItem[]>([]);
  const [tableInstance, setTableInstance] =
    useState<Table<TaskListItem> | null>(null);
  const [activePreset, setActivePreset] = useState<PresetKey | null>(null);

  // Drawer state (owned here)
  const [drawerTask, setDrawerTask] = useState<TaskListItem | null>(null);

  const selectedIds = selectedRows.map((row) => row.id);

  // ── Preset click ─────────────────────────────────────────────────────────
  const handlePreset = (key: PresetKey) => {
    const { from, to } = presetRange(key);
    onStartDateChange(from ? from.utc().toISOString() : "");
    onEndDateChange(to.utc().toISOString());
    setActivePreset(key);
  };

  // When the date pickers are used manually, clear preset highlight
  const handleStartDateChange = (d?: Date | null) => {
    onStartDateChange(d ? d.toISOString() : "");
    setActivePreset(null);
  };
  const handleEndDateChange = (d?: Date | null) => {
    onEndDateChange(d ? d.toISOString() : "");
    setActivePreset(null);
  };

  // ── Columns ───────────────────────────────────────────────────────────────
  const cols = taskColumns({
    role,
    onManage: setDrawerTask,
    t: (key: string) => t(key as Parameters<typeof t>[0]),
  });

  // ── Preset keys ───────────────────────────────────────────────────────────
  const PRESET_KEYS: PresetKey[] = ["today", "passed", "tomorrow", "thisWeek"];

  return (
    <LayoutTable isRefetching={isRefetching}>
      <div className="flex flex-1 flex-col gap-2 overflow-hidden p-4">
        {/* Stats cards */}
        <TasksStatsCards stats={stats} isLoading={isStatsLoading} />

        {/* Row 1: OTP dialog + search */}
        <div className="flex flex-wrap items-center gap-1.5">
          <OtpDialog size="sm" />

          <Input
            type="search"
            id="task-search"
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
            placeholder={t("search")}
            className="h-9 flex-1 text-[13px] md:max-w-[300px]"
          />
        </div>

        {/* Row 2: preset chips + date pickers + filters — horizontally scrollable */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex shrink-0 items-center gap-1.5">
            {/* Preset buttons */}
            {PRESET_KEYS.map((key) => (
              <Button
                key={key}
                size="sm"
                variant={activePreset === key ? "default" : "outline"}
                onClick={() => handlePreset(key)}
              >
                {t(`presets.${key}`)}
              </Button>
            ))}

            {/* From date */}
            <DatePicker
              date={startDate ? new Date(startDate) : undefined}
              onChange={handleStartDateChange}
            />

            {/* To date */}
            <DatePicker
              date={endDate ? new Date(endDate) : undefined}
              onChange={handleEndDateChange}
            />

            {/* Status filter — custom Select (FilterStatus only supports lead/customer/subscription, not todo/done) */}
            <Select
              value={taskStatus || "all"}
              onValueChange={(v) => onTaskStatusChange(v === "all" ? "" : v)}
            >
              <SelectTrigger className="h-9 min-w-[120px] text-[13px]">
                <SelectValue placeholder={t("filters.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.status")}</SelectItem>
                <SelectItem value="todo">{t("filters.todo")}</SelectItem>
                <SelectItem value="done">{t("filters.done")}</SelectItem>
              </SelectContent>
            </Select>

            {/* Admin filter — super-admins only */}
            {role !== "kam" && (
              <FilterAdmin
                size="sm"
                data={kams}
                value={adminId}
                onChange={onAdminIdChange}
              />
            )}

            {/* Label filter */}
            <FilterLabel
              size="sm"
              value={labelId}
              onChange={onLabelIdChange}
              items={labelsItems}
            />

            {/* Bulk reassign — super-admins only, when rows are selected */}
            {role !== "kam" && Object.keys(rowSelection).length > 0 && (
              <SelectAdmins
                type="customer"
                kams={kams}
                itemIds={selectedIds}
                mutateData={mutateTasks}
                onClearSelection={() => {
                  setSelectedRows([]);
                  setRowSelection({});
                }}
              />
            )}
          </div>
        </div>

        {/* Data table */}
        <DataTable
          columns={cols}
          data={tasks}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          setSelectedRows={setSelectedRows}
          tableInstanceRef={setTableInstance}
          page={meta.currentPage}
          limit={meta.itemsPerPage}
          totalCount={meta.totalItems}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
          serverSorting={false}
        />

        {/* Pagination */}
        {tableInstance && (
          <DataTablePagination
            table={tableInstance}
            totalCount={meta.totalItems}
          />
        )}
      </div>

      {/* Task drawer — owned internally */}
      <TaskDrawer
        task={drawerTask}
        open={!!drawerTask}
        onOpenChange={(o) => {
          if (!o) setDrawerTask(null);
        }}
        currentUserRole={role}
        onChanged={mutateTasks}
      />
    </LayoutTable>
  );
}
