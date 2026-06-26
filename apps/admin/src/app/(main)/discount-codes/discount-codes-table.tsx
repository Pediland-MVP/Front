"use client";

import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { LayoutTable } from "@/components/layout/LayoutTable";
import { DataTable } from "@/components/table/data-table";
import { DataTablePagination } from "@/components/table/pagination";
import { Input } from "@/components/ui/input";
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
import { columns, DiscountCode } from "./columns";
import { Table } from "@tanstack/react-table";
import api from "@/hooks/swr/api-client";
import { formatNumber } from "@/lib/formatNumber";
import { onInputP2EHandler } from "@/lib/p2eNumber";
import { useSelectOnFocus } from "@/hooks/useSelectOnFocus";

const FormSchema = z.object({
  code: z.string().min(1, "کد الزامی است").max(50),
  type: z.enum(["percentage", "fixed"]),
  value: z.number().min(0, "مقدار باید صفر یا بیشتر باشد"),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
  maxUsagePerUser: z.number().int().min(1).optional(),
  maxUsageTotal: z.number().int().min(1).optional(),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof FormSchema>;

interface DiscountCodesTableProps {
  isRefetching?: boolean;
  discountCodes: DiscountCode[];
  totalCount: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  search: string;
  onSearchChange: (s: string) => void;
  mutate: () => void;
}

export default function DiscountCodesTable({
  isRefetching,
  discountCodes,
  totalCount,
  page,
  limit,
  onPageChange,
  onLimitChange,
  search,
  onSearchChange,
  mutate,
}: DiscountCodesTableProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isToggling, setIsToggling] = useState<string | null>(null);
  const [tableInstance, setTableInstance] = useState<Table<DiscountCode> | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      code: "",
      type: "percentage",
      value: 0,
      maxUsagePerUser: 1,
    },
  });

  const { onFocus } = useSelectOnFocus();

  const handleSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        code: data.code,
        type: data.type,
        value: data.value,
        isActive: true,
      };
      if (data.validFrom) payload.validFrom = new Date(data.validFrom).toISOString();
      if (data.validUntil) payload.validUntil = new Date(data.validUntil).toISOString();
      if (data.maxUsagePerUser) payload.maxUsagePerUser = data.maxUsagePerUser;
      if (data.maxUsageTotal) payload.maxUsageTotal = data.maxUsageTotal;
      if (data.description) payload.description = data.description;

      await api.post("/discount-codes", payload);
      toast.success("کد تخفیف با موفقیت ایجاد شد");
      form.reset();
      setOpen(false);
      mutate();
    } catch (err: any) {
      const code = err?.response?.data?.code;
      toast.error(
        code === "PLAN_DISCOUNT_CODE_EXIST"
          ? "این کد از قبل وجود دارد"
          : "خطا در ایجاد کد تخفیف"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id: string) => {
    setIsToggling(id);
    try {
      await api.patch(`/discount-codes/${id}/toggle`);
      toast.success("وضعیت کد تخفیف تغییر کرد");
      mutate();
    } catch {
      toast.error("خطا در تغییر وضعیت");
    } finally {
      setIsToggling(null);
    }
  };

  return (
    <LayoutTable isRefetching={isRefetching}>
      <div className="flex flex-1 flex-col gap-3 overflow-hidden p-4">
      <div className="flex flex-wrap items-center gap-2 pb-3">
        <Input
          type="search"
          placeholder="جستجو بر اساس کد یا توضیحات..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-xs"
        />
        <Button onClick={() => setOpen(true)}>ایجاد کد تخفیف</Button>
      </div>

      <DataTable
        columns={columns({ onToggle: handleToggle, isToggling })}
        data={discountCodes}
        page={page}
        limit={limit}
        totalCount={totalCount}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
        tableInstanceRef={setTableInstance}
      />

      {tableInstance && (
        <DataTablePagination table={tableInstance} totalCount={totalCount} />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>ایجاد کد تخفیف جدید</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>کد تخفیف</FormLabel>
                    <FormControl>
                      <Input placeholder="SUMMER20" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع تخفیف</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="نوع را انتخاب کنید" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="percentage">درصدی</SelectItem>
                        <SelectItem value="fixed">مبلغ ثابت</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مقدار تخفیف</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="numeric"
                        onInput={onInputP2EHandler}
                        onFocus={onFocus}
                        placeholder="۲۰"
                        value={field.value ? formatNumber(field.value) : ""}
                        onChange={(e) =>
                          field.onChange(e.target.value === "" ? 0 : +e.target.value)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="validFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>از تاریخ</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="validUntil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تا تاریخ</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="maxUsagePerUser"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>حداکثر استفاده هر کاربر</FormLabel>
                      <FormControl>
                        <Input
                          inputMode="numeric"
                          onInput={onInputP2EHandler}
                          onFocus={onFocus}
                          placeholder="۱"
                          value={field.value ? formatNumber(field.value) : ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === "" ? undefined : +e.target.value
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxUsageTotal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>سقف کل استفاده</FormLabel>
                      <FormControl>
                        <Input
                          inputMode="numeric"
                          onInput={onInputP2EHandler}
                          onFocus={onFocus}
                          placeholder="نامحدود"
                          value={field.value ? formatNumber(field.value) : ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === "" ? undefined : +e.target.value
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
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>توضیحات (اختیاری)</FormLabel>
                    <FormControl>
                      <Input placeholder="کمپین تابستان ۱۴۰۵" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  انصراف
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "در حال ذخیره..." : "ایجاد"}
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
