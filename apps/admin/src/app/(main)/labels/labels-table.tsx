"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import api from "@/hooks/swr/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusIcon, ArrowsClockwiseIcon, PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { scheduleSummary } from "./schedule-summary";
import type { LabelListItem } from "./types";

interface Props {
  items: LabelListItem[];
  totalCount: number;
  page: number;
  limit: number;
  isRefetching: boolean;
  search: string;
  onSearchChange: (s: string) => void;
  onPageChange: (p: number) => void;
  onLimitChange: (l: number) => void;
  mutate: () => void;
  onCreate: () => void;
  onEdit: (item: LabelListItem) => void;
}

export default function LabelsTable(props: Props) {
  const t = useTranslations("Labels");
  const t_pg = useTranslations("Pagination");
  const t_ec = useTranslations("ERROR_CODES");
  const locale = useLocale();
  const [busyId, setBusyId] = useState<string | null>(null);

  const totalPages = Math.ceil(props.totalCount / props.limit);
  const canPrev = props.page > 1;
  const canNext = props.page < totalPages;
  const showingFrom = props.totalCount === 0 ? 0 : (props.page - 1) * props.limit + 1;
  const showingTo = Math.min(props.page * props.limit, props.totalCount);
  const isRtl = locale === "fa";

  const toggleActive = async (item: LabelListItem) => {
    setBusyId(item.id);
    try {
      await api.patch(`/labels/${item.id}`, { isActive: !item.isActive });
      props.mutate();
    } catch (err: any) {
      toast.error(t_ec(err?.response?.data?.code) || t("toastError"));
    } finally {
      setBusyId(null);
    }
  };

  const recompute = async (item: LabelListItem) => {
    setBusyId(item.id);
    try {
      const res = await api.post<{ data: { matchedCount: number } }>(`/labels/${item.id}/recompute`);
      toast.success(t("recomputeDone", { count: res.data.data.matchedCount }));
      props.mutate();
    } catch (err: any) {
      toast.error(t_ec(err?.response?.data?.code) || t("toastError"));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (item: LabelListItem) => {
    if (!window.confirm(t("deleteConfirm"))) return;
    setBusyId(item.id);
    try {
      await api.delete(`/labels/${item.id}`);
      toast.success(t("toastDeleted"));
      props.mutate();
    } catch (err: any) {
      toast.error(t_ec(err?.response?.data?.code) || t("toastError"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">{t("pageTitle")}</h1>
        <div className="flex items-center gap-2">
          <Input
            className="w-48"
            placeholder={t("colName")}
            value={props.search}
            onChange={(e) => props.onSearchChange(e.target.value)}
          />
          <Button onClick={props.onCreate}>
            <PlusIcon className="ml-1" size={18} /> {t("addLabel")}
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("colName")}</TableHead>
            <TableHead>{t("colSchedule")}</TableHead>
            <TableHead>{t("colMatched")}</TableHead>
            <TableHead>{t("colLastRun")}</TableHead>
            <TableHead>{t("colActive")}</TableHead>
            <TableHead>{t("colActions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {props.items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Badge style={item.color ? { backgroundColor: item.color, color: "#fff" } : undefined}>
                  {item.name}
                </Badge>
              </TableCell>
              <TableCell>{scheduleSummary(item, t)}</TableCell>
              <TableCell>{item.lastMatchedCount ?? 0}</TableCell>
              <TableCell>
                {item.lastRunAt ? new Date(item.lastRunAt).toLocaleString("fa-IR") : t("lastRunNever")}
              </TableCell>
              <TableCell>
                <Switch
                  checked={item.isActive}
                  disabled={busyId === item.id}
                  onCheckedChange={() => toggleActive(item)}
                />
              </TableCell>
              <TableCell className="flex gap-1">
                <Button size="icon" variant="ghost" disabled={busyId === item.id} onClick={() => recompute(item)}>
                  <ArrowsClockwiseIcon size={18} />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => props.onEdit(item)}>
                  <PencilSimpleIcon size={18} />
                </Button>
                <Button size="icon" variant="ghost" disabled={busyId === item.id} onClick={() => remove(item)}>
                  <TrashIcon size={18} />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination — mirrors DataTablePagination layout, same "Pagination" i18n namespace */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        <div className="hidden text-sm md:block">
          {t_pg("showingItems", { from: showingFrom, to: showingTo, total: props.totalCount })}
        </div>

        <div className="flex w-full items-center justify-center md:w-auto">
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              className="size-8"
              onClick={() => props.onPageChange(props.page + 1)}
              disabled={!canNext}
            >
              <span className="sr-only">{t_pg("nextPage")}</span>
              {isRtl ? <ChevronLeft /> : <ChevronRight />}
            </Button>
            <Button
              size="icon"
              className="hidden size-8 lg:flex"
              onClick={() => props.onPageChange(totalPages)}
              disabled={!canNext}
            >
              <span className="sr-only">{t_pg("lastPage")}</span>
              {isRtl ? <ChevronsLeft /> : <ChevronsRight />}
            </Button>

            <div className="flex items-center justify-center px-4 text-sm font-medium">
              {t_pg("pageIndicator", { pageIndex: props.page, totalPages })}
            </div>

            <Button
              size="icon"
              className="hidden size-8 lg:flex"
              onClick={() => props.onPageChange(1)}
              disabled={!canPrev}
            >
              <span className="sr-only">{t_pg("firstPage")}</span>
              {isRtl ? <ChevronsRight /> : <ChevronsLeft />}
            </Button>
            <Button
              size="icon"
              className="size-8"
              onClick={() => props.onPageChange(props.page - 1)}
              disabled={!canPrev}
            >
              <span className="sr-only">{t_pg("prevPage")}</span>
              {isRtl ? <ChevronRight /> : <ChevronLeft />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
