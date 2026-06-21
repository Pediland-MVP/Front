"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import useSWR from "swr";
import { useDebounce } from "use-debounce";
import api, { fetcher } from "@/hooks/swr/api-client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { useLabelFields } from "./use-labels";
import { ScheduleControl, ScheduleValue } from "./schedule-control";
import { RuleBuilder } from "./rule-builder";
import { ConditionGroup, emptyGroup, Label as LabelType, CreateLabelPayload } from "./types";

const SWATCHES = ["#16a34a", "#dc2626", "#d97706", "#2563eb", "#7c3aed", "#0891b2", "#475569"];

export function LabelFormDialog({
  open,
  onOpenChange,
  labelId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  labelId?: string;
  onSaved: () => void;
}) {
  const t = useTranslations("Labels");
  const t_ec = useTranslations("ERROR_CODES");
  const isEdit = !!labelId;
  const { fields } = useLabelFields();

  const { data: detail } = useSWR<{ data: LabelType }>(
    isEdit && open ? `/labels/${labelId}` : null,
    fetcher,
  );

  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(SWATCHES[0]);
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [schedule, setSchedule] = useState<ScheduleValue>({ scheduleType: "interval", intervalMinutes: 1440 });
  const [rule, setRule] = useState<ConditionGroup>(emptyGroup());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      if (detail?.data) {
        const d = detail.data;
        setName(d.name);
        setColor(d.color ?? SWATCHES[0]);
        setDescription(d.description ?? "");
        setIsActive(d.isActive);
        setSchedule({
          scheduleType: d.scheduleType,
          intervalMinutes: d.intervalMinutes ?? undefined,
          dailyAtHour: d.dailyAtHour ?? undefined,
        });
        setRule(d.rule ?? emptyGroup());
      } else {
        setName("");
        setColor(SWATCHES[0]);
        setDescription("");
        setIsActive(true);
        setSchedule({ scheduleType: "interval", intervalMinutes: 1440 });
        setRule(emptyGroup());
      }
    } else {
      setName("");
      setColor(SWATCHES[0]);
      setDescription("");
      setIsActive(true);
      setSchedule({ scheduleType: "interval", intervalMinutes: 1440 });
      setRule(emptyGroup());
    }
  }, [open, isEdit, labelId, detail]);

  // Live preview (debounced) — counts matching users for the current draft rule.
  const [debouncedRule] = useDebounce(rule, 800);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewing, setPreviewing] = useState(false);
  useEffect(() => {
    if (!open || debouncedRule.conditions.length === 0) {
      setPreviewCount(null);
      return;
    }
    let cancelled = false;
    setPreviewing(true);
    api
      .post<{ data: { count: number } }>("/labels/preview", { rule: debouncedRule })
      .then((r) => !cancelled && setPreviewCount(r.data.data.count))
      .catch(() => !cancelled && setPreviewCount(null))
      .finally(() => !cancelled && setPreviewing(false));
    return () => {
      cancelled = true;
    };
  }, [debouncedRule, open]);

  const buildPayload = (): CreateLabelPayload => ({
    name: name.trim(),
    color,
    description: description.trim() || undefined,
    rule,
    scheduleType: schedule.scheduleType,
    intervalMinutes: schedule.scheduleType === "interval" ? schedule.intervalMinutes : undefined,
    dailyAtHour: schedule.scheduleType === "daily" ? schedule.dailyAtHour : undefined,
    isActive,
  });

  const submit = async () => {
    if (!name.trim()) return toast.error(t("validationNameRequired"));
    if (rule.conditions.length === 0) return toast.error(t("validationRuleEmpty"));
    setSubmitting(true);
    try {
      if (isEdit) {
        await api.patch(`/labels/${labelId}`, buildPayload());
        toast.success(t("toastUpdated"));
      } else {
        await api.post("/labels", buildPayload());
        toast.success(t("toastCreated"));
      }
      onOpenChange(false);
      onSaved();
    } catch (err: any) {
      toast.error(t_ec(err?.response?.data?.code) || t("toastError"));
    } finally {
      setSubmitting(false);
    }
  };

  const recomputeNow = async () => {
    if (!isEdit) return;
    try {
      const res = await api.post<{ data: { matchedCount: number } }>(`/labels/${labelId}/recompute`);
      toast.success(t("recomputeDone", { count: res.data.data.matchedCount }));
      onSaved();
    } catch (err: any) {
      toast.error(t_ec(err?.response?.data?.code) || t("toastError"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editTitle") : t("createTitle")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>{t("formName")}</Label>
            <Input value={name} placeholder={t("formNamePlaceholder")} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>{t("formColor")}</Label>
            <div className="flex gap-2">
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full border-2 ${color === c ? "border-foreground" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label>{t("formDescription")}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <ScheduleControl value={schedule} onChange={setSchedule} />

          <div className="space-y-2">
            <Label>{t("rule")}</Label>
            <RuleBuilder value={rule} onChange={setRule} fields={fields} />
            <p className="text-sm text-muted-foreground">
              {previewing ? t("previewLoading") : previewCount !== null ? t("preview", { count: previewCount }) : ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={isActive} onCheckedChange={setIsActive} id="label-active" />
            <Label htmlFor="label-active">{t("formActive")}</Label>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            {isEdit ? (
              <Button type="button" variant="outline" onClick={recomputeNow}>
                <ArrowsClockwiseIcon size={18} className="ml-1" /> {t("recomputeNow")}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
              <Button type="button" disabled={submitting} onClick={submit}>{t("save")}</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
