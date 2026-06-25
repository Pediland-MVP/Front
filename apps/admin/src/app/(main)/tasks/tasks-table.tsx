// src/app/(main)/tasks/tasks-table.tsx
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Table } from "@tanstack/react-table";

// Layout
import { LayoutTable } from "@/components/layout/LayoutTable";

// Table components
import { DataTable } from "@/components/table/data-table";
import { DataTablePagination } from "@/components/table/pagination";
import { FilterAdmin } from "@/components/table/filter-admin";
import { FilterLabel } from "@/components/table/filter-label";
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
import { TasksBulkAssign } from "./tasks-bulk-assign";

// Types
import type { TaskListItem, TasksStats } from "@/types/task";
import type { PageMeta } from "@/types/meta";
import type { User } from "@/types/user";
import type { LabelListItem } from "@/app/(main)/labels/types";

// ─── Preset range helper (Tehran, fixed +03:30, no DST) ───────────────────────
//
// NB: do NOT use the jalali-configured dayjs (`@/lib/dayjs-jalali`) for this math.
// Its startOf/endOf rebuild the date from the *Jalali* year (e.g. $y = 1405), so
// `.toISOString()` emits a corrupt year like "1405-..."/"0784-...". We compute
// Tehran day/week bounds with native Date math and emit real Gregorian UTC ISO.

type PresetKey = "today" | "passed" | "tomorrow" | "thisWeek";

const TEHRAN_OFFSET_MS = (3 * 60 + 30) * 60 * 1000;
const DAY_MS = 86_400_000;

// Start of the Tehran calendar day for a UTC instant (default: now), as a UTC Date.
const tehranDayStart = (d: Date = new Date()): Date => {
  const wall = new Date(d.getTime() + TEHRAN_OFFSET_MS);
  const midnightWall = Date.UTC(
    wall.getUTCFullYear(),
    wall.getUTCMonth(),
    wall.getUTCDate(),
  );
  return new Date(midnightWall - TEHRAN_OFFSET_MS);
};
const dayEnd = (start: Date): Date => new Date(start.getTime() + DAY_MS - 1);

const presetRange = (key: PresetKey): { from: Date | null; to: Date } => {
  const start = tehranDayStart();
  if (key === "today") return { from: start, to: dayEnd(start) };
  if (key === "tomorrow") {
    const t = new Date(start.getTime() + DAY_MS);
    return { from: t, to: dayEnd(t) };
  }
  if (key === "passed") return { from: null, to: new Date(start.getTime() - 1) };
  // thisWeek (Sat..Fri, Tehran). Tehran wall day-of-week: Sun=0 … Sat=6.
  const wall = new Date(Date.now() + TEHRAN_OFFSET_MS);
  const daysSinceSaturday = (wall.getUTCDay() + 1) % 7;
  const weekStart = new Date(start.getTime() - daysSinceSaturday * DAY_MS);
  return { from: weekStart, to: new Date(weekStart.getTime() + 7 * DAY_MS - 1) };
};

// Anchor a manually-picked calendar day to its Tehran day bound, return UTC ISO.
// The DatePicker hands back a browser-local Date; we use only its local
// year/month/day as the chosen Gregorian day and anchor it to Asia/Tehran.
const toTehranBound = (d: Date | undefined, edge: "start" | "end"): string => {
  if (!d) return "";
  const midnightWall = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const start = new Date(midnightWall - TEHRAN_OFFSET_MS);
  return (edge === "start" ? start : dayEnd(start)).toISOString();
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
  const selectedIds = selectedRows.map((r) => r.id);
  const [tableInstance, setTableInstance] =
    useState<Table<TaskListItem> | null>(null);
  const [activePreset, setActivePreset] = useState<PresetKey | null>(null);

  // Clear index-based selection whenever the visible dataset can change.
  // Without this, a selection made on page 1 stays "selected" after a page or
  // filter change — the same row-index slots now point to different tasks, so
  // bulk-reassign would act on the wrong tasks.
  useEffect(() => {
    setRowSelection({});
    setSelectedRows([]);
  }, [
    meta.currentPage,
    meta.itemsPerPage,
    search,
    taskStatus,
    adminId,
    labelId,
    startDate,
    endDate,
  ]);

  // Drawer state (owned here)
  const [drawerTask, setDrawerTask] = useState<TaskListItem | null>(null);

  // ── Preset click ─────────────────────────────────────────────────────────
  const handlePreset = (key: PresetKey) => {
    const { from, to } = presetRange(key);
    onStartDateChange(from ? from.toISOString() : "");
    onEndDateChange(to.toISOString());
    setActivePreset(key);
  };

  // When the date pickers are used manually, clear preset highlight and
  // re-anchor the picked day to its Tehran day bound (same basis as presets).
  const handleStartDateChange = (d?: Date | null) => {
    setActivePreset(null);
    onStartDateChange(toTehranBound(d ?? undefined, "start"));
  };
  const handleEndDateChange = (d?: Date | null) => {
    setActivePreset(null);
    onEndDateChange(toTehranBound(d ?? undefined, "end"));
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

            {/* Bulk reassign — super-admins only, shown when rows are selected */}
            {role !== "kam" && Object.keys(rowSelection).length > 0 && (
              <TasksBulkAssign
                kams={kams}
                actionIds={selectedIds}
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
