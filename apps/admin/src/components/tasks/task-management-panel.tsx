"use client";

import React, { useState, useMemo } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";
import {
  PhoneCallIcon,
  WhatsappLogoIcon,
  TelegramLogoIcon,
  InstagramLogoIcon,
  TrashIcon,
} from "@phosphor-icons/react/dist/ssr";

import api, { fetcher } from "@/hooks/swr/api-client";
import { useKams } from "@/hooks/use-kams";
import { Action } from "@/types/actions";
import {
  addToToday,
  recommendedDateLabel,
  buildActionDateISO,
  formatTaskDate,
} from "@/lib/task-datetime";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Recommended-date button config ───────────────────────────────────────────
const RECOMMENDED_DATES = [
  { amount: 1, unit: "day" as const, key: "tomorrow" },
  { amount: 3, unit: "day" as const, key: "in3days" },
  { amount: 7, unit: "day" as const, key: "in1week" },
  { amount: 14, unit: "day" as const, key: "in2weeks" },
  { amount: 1, unit: "month" as const, key: "in1month" },
] as const;

// ─── Type icons (phosphor, static); text labels live in i18n (Tasks.types) ─────
const TYPE_ICONS: Record<string, React.ReactNode> = {
  phone: <PhoneCallIcon className="w-3.5 h-3.5 text-sky-500 shrink-0" />,
  whatsapp: <WhatsappLogoIcon size={14} className="text-green-500 shrink-0" />,
  telegram: <TelegramLogoIcon size={14} className="text-blue-500 shrink-0" />,
  instagram: <InstagramLogoIcon size={14} className="text-pink-500 shrink-0" />,
};

const KNOWN_TYPES = ["phone", "whatsapp", "telegram", "instagram"] as const;

// ─── Component ────────────────────────────────────────────────────────────────
export function TaskManagementPanel(props: {
  userId: string;
  currentUserRole: string; // "admin" | "manager" | "kam"
  onChanged?: () => void;
}): React.JSX.Element {
  const { userId, currentUserRole, onChanged } = props;

  const t = useTranslations("Tasks.panel");
  const tr = useTranslations("Tasks.recommended");
  const tt = useTranslations("Tasks.toasts");
  const tType = useTranslations("Tasks.types");
  const t_ec = useTranslations("ERROR_CODES");

  // ── SWR: timeline ──────────────────────────────────────────────────────────
  const {
    data: actions,
    isLoading: isActionsLoading,
    mutate,
  } = useSWR(`/actions/user/${userId}?limit=30&page=1`, fetcher);

  // ── SWR: KAMs for assign select ────────────────────────────────────────────
  const { kams } = useKams({ roles: "manager,kam", enabled: true });

  // ── Local state ────────────────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string>("09:00");
  const [actionType, setActionType] = useState<string>("");
  const [assignAdminId, setAssignAdminId] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!selectedDate || !actionType || note.trim() === "") {
      toast.error(tt("fillAll"));
      return;
    }

    setIsSaving(true);
    try {
      await api.post("/actions", {
        leadOrUserId: userId,
        for: "user",
        type: actionType,
        description: note.trim(),
        status: "todo",
        actionDate: buildActionDateISO(selectedDate, time),
        ...(assignAdminId ? { adminId: assignAdminId } : {}),
      });

      // Reset form
      setSelectedDate(undefined);
      setTime("09:00");
      setActionType("");
      setAssignAdminId("");
      setNote("");

      await mutate();
      onChanged?.();
      toast.success(tt("created"));
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { code?: string } } };
      const code = axiosErr?.response?.data?.code;
      toast.error(
        (code ? t_ec(code as never) : undefined) || tt("createError")
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (actionId: string, checked: boolean) => {
    const newStatus = checked ? "done" : "todo";
    try {
      await api.post(`/actions/status/${actionId}`, { status: newStatus });
      await mutate();
      onChanged?.();
      toast.success(tt("statusUpdated"));
    } catch {
      toast.error(tt("statusError"));
    }
  };

  const handleDelete = async (actionId: string) => {
    try {
      await api.delete(`/actions/${actionId}`);
      await mutate();
      onChanged?.();
    } catch {
      toast.error(tt("deleteError"));
    }
  };

  const isKam = currentUserRole === "kam";

  // Each recommended-date entry builds a jalali dayjs object — compute the dates
  // and labels once per mount instead of ~3× per button on every render.
  const recommended = useMemo(
    () =>
      RECOMMENDED_DATES.map(({ amount, unit, key }) => ({
        key,
        label: recommendedDateLabel(amount, unit),
        date: addToToday(amount, unit),
      })),
    [],
  );

  // Sort the timeline once per data change, not on every render.
  const sortedActions = useMemo(() => {
    const items = (actions?.items as Action[] | undefined) ?? [];
    return [...items].sort(
      (a, b) =>
        new Date(a.actionDate).getTime() - new Date(b.actionDate).getTime(),
    );
  }, [actions]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">

      {/* ── Timeline ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 min-h-[200px]">
        {isActionsLoading ? (
          <div className="flex items-center justify-center py-10 text-slate-400 text-xs">
            {t("loading")}
          </div>
        ) : sortedActions.length > 0 ? (
          <div className="flex flex-col gap-2">
            {sortedActions.map((action: Action) => {
              const isDone = action.status === "done";
              return (
                <div
                  key={action.id}
                  className={cn(
                    // Full-width cards (no physical auto-margins/corners) read
                    // cleanly in RTL; status shown via a logical start-border.
                    "rounded-xl border border-s-2 p-3 transition-colors",
                    isDone
                      ? "bg-slate-50 border-slate-200 border-s-slate-300 text-slate-500"
                      : "bg-white border-slate-200 border-s-blue-500",
                  )}
                >
                  {/* Header: type + responsible admin */}
                  <div className="flex items-center justify-between gap-3 text-[11px] font-bold mb-1.5 text-slate-500">
                    <span className="flex items-center gap-1">
                      {TYPE_ICONS[action.type]}
                      <span>
                        {KNOWN_TYPES.includes(
                          action.type as (typeof KNOWN_TYPES)[number],
                        )
                          ? tType(action.type)
                          : tType("unknown")}
                      </span>
                    </span>
                    <span className="truncate">{`${action.admin.firstname} ${action.admin.lastname}`}</span>
                  </div>

                  {/* Description */}
                  <p
                    className={cn(
                      "text-xs md:text-sm leading-relaxed whitespace-pre-wrap",
                      isDone
                        ? "line-through decoration-slate-300"
                        : "text-slate-700",
                    )}
                  >
                    {action.description}
                  </p>

                  {/* Footer: date + done toggle + delete */}
                  <div className="flex items-center justify-between gap-3 text-[11px] mt-2.5 pt-1.5 border-t border-slate-100 text-slate-400">
                    <span>{formatTaskDate(action.actionDate)}</span>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 cursor-pointer select-none font-semibold">
                        <Checkbox
                          className="w-3.5 h-3.5 rounded-sm data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 cursor-pointer"
                          checked={isDone}
                          onCheckedChange={(checked) =>
                            handleStatusChange(action.id, checked === true)
                          }
                        />
                        <span>{t("done")}</span>
                      </label>

                      {!isKam && (
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-6 h-6 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md"
                          onClick={() => handleDelete(action.id)}
                        >
                          <TrashIcon size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-10">
            <MessageSquare className="w-12 h-12 stroke-[1.2] mb-2 opacity-50" />
            <p className="text-xs font-semibold">{t("emptyTimeline")}</p>
          </div>
        )}
      </div>

      {/* ── Add Form ── */}
      <div className="border-t bg-white p-3.5 space-y-3 shrink-0 shadow-lg">

        {/* Recommended-date buttons */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200">
          {recommended.map(({ key, label, date }) => {
            const active =
              !!selectedDate &&
              date.toDateString() === selectedDate.toDateString();
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDate(date)}
                className={cn(
                  "shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-colors duration-150 cursor-pointer whitespace-nowrap",
                  active
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600",
                )}
              >
                {tr(key as never)}{" "}
                <span className="opacity-70">({label})</span>
              </button>
            );
          })}
        </div>

        {/* Row 1: DatePicker + Time + Type + Assign */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Picker */}
          <div className="w-auto">
            <DatePicker date={selectedDate} onChange={(d) => setSelectedDate(d ?? undefined)} />
          </div>

          {/* Time Input */}
          <div className="w-28">
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 px-3 text-xs focus-visible:ring-indigo-500 shadow-3xs"
            />
          </div>

          {/* Action Type Select */}
          <div className="w-36">
            <Select value={actionType} onValueChange={setActionType}>
              <SelectTrigger className="w-full bg-white h-9 rounded-xl border border-slate-200 px-3 text-xs focus-visible:ring-indigo-500 shadow-3xs cursor-pointer">
                <SelectValue placeholder={t("type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instagram">{tType("instagram")}</SelectItem>
                <SelectItem value="telegram">{tType("telegram")}</SelectItem>
                <SelectItem value="whatsapp">{tType("whatsapp")}</SelectItem>
                <SelectItem value="phone">{tType("phone")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assign Admin Select */}
          {kams.length > 0 && (
            <div className="w-40">
              <Select value={assignAdminId} onValueChange={setAssignAdminId}>
                <SelectTrigger className="w-full bg-white h-9 rounded-xl border border-slate-200 px-3 text-xs focus-visible:ring-indigo-500 shadow-3xs cursor-pointer">
                  <SelectValue placeholder={t("assignTo")} />
                </SelectTrigger>
                <SelectContent>
                  {kams.map((kam: { id: string; firstname: string; lastname: string }) => (
                    <SelectItem key={kam.id} value={kam.id}>
                      {`${kam.firstname} ${kam.lastname}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Row 2: Textarea + Submit */}
        <div className="flex gap-2.5 min-w-0 w-full">
          <Textarea
            className="min-h-9 max-h-16 flex-1 resize-none rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus-visible:ring-blue-500 shadow-3xs leading-relaxed"
            placeholder={t("note")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <Button
            type="button"
            variant="default"
            className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 rounded-xl px-4 h-9 text-xs font-bold transition-all duration-150 cursor-pointer shadow-sm"
            disabled={isSaving}
            onClick={handleAdd}
          >
            {isSaving ? t("submitting") : t("submit")}
          </Button>
        </div>
      </div>
    </div>
  );
}
