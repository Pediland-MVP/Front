"use client";

import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { LayoutTable } from "@/components/layout/LayoutTable";
import { DataTable } from "@/components/table/data-table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/hooks/swr/api-client";
import { formatNumber } from "@/lib/formatNumber";
import { onInputP2EHandler } from "@/lib/p2eNumber";
import { useSelectOnFocus } from "@/hooks/useSelectOnFocus";
import { Duration, Plan } from "@/types/subscription";
import { usePlanColumns } from "./columns";

const PlanSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(["credit", "time"]),
  minFollowers: z.number().min(0),
  maxFollowers: z.number().min(0),
  features: z.string(),
  isActive: z.boolean(),
  isVisible: z.boolean(),
});

const DurationSchema = z.object({
  name: z.string().min(1),
  price: z.number().min(0),
  monthlyDiscount: z.number().min(0).optional(),
  durationDays: z.number().nullable().optional(),
  credit: z.number().nullable().optional(),
});

type PlanValues = z.infer<typeof PlanSchema>;
type DurationValues = z.infer<typeof DurationSchema>;

interface PlansTableProps {
  isRefetching?: boolean;
  plans: Plan[];
  mutate: () => void;
}

export default function PlansTable({
  isRefetching,
  plans,
  mutate,
}: PlansTableProps) {
  const t = useTranslations("Plans");
  const t_ec = useTranslations("ERROR_CODES");

  const [editTarget, setEditTarget] = useState<Plan | null>(null);
  const [durationsPlanId, setDurationsPlanId] = useState<number | null>(null);
  const [editDuration, setEditDuration] = useState<Duration | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDuration, setIsSavingDuration] = useState(false);

  // Re-derive from the latest data so the durations list stays live after edits.
  const durationsPlan =
    plans.find((p) => p.id === durationsPlanId) ?? null;

  const planForm = useForm<PlanValues>({
    resolver: zodResolver(PlanSchema),
  });

  const durationForm = useForm<DurationValues>({
    resolver: zodResolver(DurationSchema),
  });

  const { onFocus } = useSelectOnFocus();

  const handleOpenEdit = (plan: Plan) => {
    setEditTarget(plan);
    planForm.reset({
      name: plan.name,
      description: plan.description,
      type: plan.type === "credit" ? "credit" : "time",
      minFollowers: plan.minFollowers,
      maxFollowers: plan.maxFollowers,
      features: (plan.features ?? []).join("\n"),
      isActive: plan.isActive,
      isVisible: plan.isVisible,
    });
  };

  const handleOpenEditDuration = (duration: Duration) => {
    setEditDuration(duration);
    durationForm.reset({
      name: duration.name,
      price: duration.price,
      monthlyDiscount: duration.monthlyDiscount ?? undefined,
      durationDays: duration.durationDays ?? null,
      credit: duration.credit ?? null,
    });
  };

  const handleEditPlan = async (data: PlanValues) => {
    if (!editTarget) return;
    setIsSubmitting(true);
    try {
      const features = data.features
        .split(/[\n,]/)
        .map((f) => f.trim())
        .filter(Boolean);
      await api.patch(`/plans/${editTarget.id}`, {
        name: data.name,
        description: data.description,
        type: data.type,
        minFollowers: data.minFollowers,
        maxFollowers: data.maxFollowers,
        features,
        isActive: data.isActive,
        isVisible: data.isVisible,
      });
      toast.success(t("updateSuccess"));
      setEditTarget(null);
      mutate();
    } catch (err: any) {
      const code = err?.response?.data?.code;
      toast.error(t_ec(code) || t("updateError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditDuration = async (data: DurationValues) => {
    if (!editDuration) return;
    setIsSavingDuration(true);
    try {
      await api.patch(`/plans/planDurations/${editDuration.id}`, {
        name: data.name,
        price: data.price,
        monthlyDiscount: data.monthlyDiscount,
        durationDays: data.durationDays ?? null,
        credit: data.credit ?? null,
      });
      toast.success(t("durationUpdateSuccess"));
      setEditDuration(null);
      mutate();
    } catch (err: any) {
      const code = err?.response?.data?.code;
      toast.error(t_ec(code) || t("durationUpdateError"));
    } finally {
      setIsSavingDuration(false);
    }
  };

  const columns = usePlanColumns({
    onEdit: handleOpenEdit,
    onDurations: (plan) => setDurationsPlanId(plan.id),
  });

  return (
    <LayoutTable isRefetching={isRefetching}>
      <div className="flex flex-1 flex-col gap-3 overflow-hidden p-4">
        <DataTable
          columns={columns}
          data={plans}
          page={1}
          limit={Math.max(plans.length, 1)}
          totalCount={plans.length}
          onPageChange={() => {}}
          onLimitChange={() => {}}
        />

        {/* Edit Plan Dialog */}
        <Dialog
          open={!!editTarget}
          onOpenChange={(v) => !v && setEditTarget(null)}
        >
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader>
              <DialogTitle>{t("editPlanTitle")}</DialogTitle>
            </DialogHeader>
            <Form {...planForm}>
              <form
                onSubmit={planForm.handleSubmit(handleEditPlan)}
                className="space-y-4"
              >
                <FormField
                  control={planForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("name")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={planForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("description")}</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={planForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("type")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="time">
                            {t("type_time")}
                          </SelectItem>
                          <SelectItem value="credit">
                            {t("type_credit")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={planForm.control}
                    name="minFollowers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("minFollowers")}</FormLabel>
                        <FormControl>
                          <Input
                            inputMode="numeric"
                            onInput={onInputP2EHandler}
                            onFocus={onFocus}
                            value={
                              field.value === undefined ||
                              field.value === null ||
                              Number.isNaN(field.value)
                                ? ""
                                : formatNumber(field.value)
                            }
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === "" ? NaN : +e.target.value
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={planForm.control}
                    name="maxFollowers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("maxFollowers")}</FormLabel>
                        <FormControl>
                          <Input
                            inputMode="numeric"
                            onInput={onInputP2EHandler}
                            onFocus={onFocus}
                            value={
                              field.value === undefined ||
                              field.value === null ||
                              Number.isNaN(field.value)
                                ? ""
                                : formatNumber(field.value)
                            }
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === "" ? NaN : +e.target.value
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={planForm.control}
                  name="features"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("features")}</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={4}
                          placeholder={t("featuresPlaceholder")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={planForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <FormLabel className="m-0">{t("isActive")}</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={planForm.control}
                    name="isVisible"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <FormLabel className="m-0">{t("isVisible")}</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditTarget(null)}
                  >
                    {t("cancel")}
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? t("saving") : t("save")}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Durations List Dialog */}
        <Dialog
          open={!!durationsPlan}
          onOpenChange={(v) => !v && setDurationsPlanId(null)}
        >
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader>
              <DialogTitle>
                {t("durationsTitle", { plan: durationsPlan?.name ?? "" })}
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              {durationsPlan?.durations && durationsPlan.durations.length > 0 ? (
                durationsPlan.durations.map((duration) => (
                  <div
                    key={duration.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{duration.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {t("price")}: {duration.price}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditDuration(duration)}
                    >
                      {t("edit")}
                    </Button>
                  </div>
                ))
              ) : (
                <span className="py-4 text-center text-sm text-muted-foreground">
                  {t("noDurations")}
                </span>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Duration Dialog */}
        <Dialog
          open={!!editDuration}
          onOpenChange={(v) => !v && setEditDuration(null)}
        >
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>{t("editDurationTitle")}</DialogTitle>
            </DialogHeader>
            <Form {...durationForm}>
              <form
                onSubmit={durationForm.handleSubmit(handleEditDuration)}
                className="space-y-4"
              >
                <FormField
                  control={durationForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("name")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={durationForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("price")}</FormLabel>
                      <FormControl>
                        <Input
                          inputMode="numeric"
                          onInput={onInputP2EHandler}
                          onFocus={onFocus}
                          value={
                            field.value === undefined ||
                            field.value === null ||
                            Number.isNaN(field.value)
                              ? ""
                              : formatNumber(field.value)
                          }
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === "" ? NaN : +e.target.value
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={durationForm.control}
                  name="monthlyDiscount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("monthlyDiscount")}</FormLabel>
                      <FormControl>
                        <Input
                          inputMode="numeric"
                          onInput={onInputP2EHandler}
                          onFocus={onFocus}
                          value={
                            field.value === undefined || field.value === null
                              ? ""
                              : formatNumber(field.value)
                          }
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === "" ? undefined : +e.target.value,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={durationForm.control}
                    name="durationDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("durationDays")}</FormLabel>
                        <FormControl>
                          <Input
                            inputMode="numeric"
                            onInput={onInputP2EHandler}
                            onFocus={onFocus}
                            value={
                              field.value === undefined || field.value === null
                                ? ""
                                : formatNumber(field.value)
                            }
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === "" ? null : +e.target.value,
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={durationForm.control}
                    name="credit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("credit")}</FormLabel>
                        <FormControl>
                          <Input
                            inputMode="numeric"
                            onInput={onInputP2EHandler}
                            onFocus={onFocus}
                            value={
                              field.value === undefined || field.value === null
                                ? ""
                                : formatNumber(field.value)
                            }
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === "" ? null : +e.target.value,
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditDuration(null)}
                  >
                    {t("cancel")}
                  </Button>
                  <Button type="submit" disabled={isSavingDuration}>
                    {isSavingDuration ? t("saving") : t("save")}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </LayoutTable>
  );
}
