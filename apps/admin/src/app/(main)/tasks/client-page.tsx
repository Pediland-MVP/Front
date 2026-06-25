// src/app/(main)/tasks/client-page.tsx
"use client";

import { useState } from "react";
import useSWR from "swr";
import { useDebounce } from "use-debounce";

import { fetcher } from "@/hooks/swr/api-client";
import { useAuth } from "@/hooks/use-auth";
import { useKams } from "@/hooks/use-kams";
import { useLabelsList } from "../labels/use-labels";

import { FetchError } from "@/components/fetch-error";
import { Loading } from "@/components/loading";

import { TasksTable } from "./tasks-table";

export default function TasksPageClient() {
  const { user } = useAuth();

  // ── Filter state ────────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 750);
  const [taskStatus, setTaskStatus] = useState("");
  const [adminId, setAdminId] = useState("");
  const [labelId, setLabelId] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ── Role / super-admin ──────────────────────────────────────────────────────
  const isSuperAdmin = user?.role !== "kam";

  // ── Query string segments ───────────────────────────────────────────────────
  const searchQ = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : "";
  const statusQ = taskStatus ? `&status=${taskStatus}` : "";
  // adminId filter: only send when super-admin and a specific admin is selected
  const adminQ = isSuperAdmin && adminId ? `&adminIds=${adminId}` : "";
  const labelQ = labelId ? `&labelId=${labelId}` : "";
  const startQ = startDate ? `&startDate=${encodeURIComponent(startDate)}` : "";
  const endQ = endDate ? `&endDate=${encodeURIComponent(endDate)}` : "";

  const actionsUrl = `/actions?page=${page}&limit=${limit}${searchQ}${statusQ}${adminQ}${labelQ}${startQ}${endQ}`;

  // ── Stats query: only adminIds (super) + labelId ────────────────────────────
  const statsAdminQ = isSuperAdmin && adminId ? `adminIds=${adminId}` : "";
  const statsLabelQ = labelId ? `labelId=${labelId}` : "";
  const statsQueryParts = [statsAdminQ, statsLabelQ].filter(Boolean).join("&");
  const statsUrl = `/actions/stats${statsQueryParts ? `?${statsQueryParts}` : ""}`;

  // ── Data fetching ───────────────────────────────────────────────────────────
  const {
    data,
    isLoading,
    isValidating,
    error,
    mutate: mutateTasksRaw,
  } = useSWR(actionsUrl, fetcher, { keepPreviousData: true });

  const { data: statsData, isLoading: isStatsLoading } = useSWR(statsUrl, fetcher);

  const { data: labelsData } = useLabelsList({ page: 1, limit: 100 });

  const {
    kams,
    isLoading: isKamsLoading,
    isError: kamsError,
  } = useKams({ roles: "manager,kam", enabled: isSuperAdmin });

  // ── Derived data ────────────────────────────────────────────────────────────
  const tasks = data?.items ?? [];
  const meta = data?.meta;
  const stats = statsData?.data;

  // ── Loading / error guards ──────────────────────────────────────────────────
  if ((!data && isLoading) || isKamsLoading) return <Loading />;
  if (error || kamsError) return <FetchError />;

  const mutateTasks = () => { mutateTasksRaw(); };

  return (
    <TasksTable
      tasks={tasks}
      meta={meta}
      stats={stats}
      isStatsLoading={isStatsLoading}
      isRefetching={isValidating && !!data}
      kams={kams}
      labelsItems={labelsData?.items ?? []}
      role={user?.role ?? ""}
      // Pagination
      onPageChange={setPage}
      onLimitChange={setLimit}
      // Filters
      search={search}
      onSearchChange={(v) => { setSearch(v); setPage(1); }}
      startDate={startDate}
      onStartDateChange={(iso) => { setStartDate(iso); setPage(1); }}
      endDate={endDate}
      onEndDateChange={(iso) => { setEndDate(iso); setPage(1); }}
      taskStatus={taskStatus}
      onTaskStatusChange={(v) => { setTaskStatus(v); setPage(1); }}
      adminId={adminId}
      onAdminIdChange={(id) => { setAdminId(id); setPage(1); }}
      labelId={labelId}
      onLabelIdChange={(id) => { setLabelId(id); setPage(1); }}
      // Mutations
      mutateTasks={mutateTasks}
    />
  );
}
