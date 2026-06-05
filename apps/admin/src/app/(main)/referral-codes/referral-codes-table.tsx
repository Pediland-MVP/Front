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
import { columns, ReferralCode } from "./columns";
import { Table } from "@tanstack/react-table";
import api from "@/hooks/swr/api-client";

const FormSchema = z.object({
  code: z.string().min(1, "کد الزامی است"),
  mobile: z.string().regex(/^(\+98|0)?9\d{9}$/, "شماره موبایل معتبر نیست"),
  discount: z.number().positive("تخفیف باید مثبت باشد"),
  type: z.enum(["PERCENTAGE", "FIXED", "PLAN"]),
  maxUsage: z.number().int().min(1).optional(),
});

type FormValues = z.infer<typeof FormSchema>;

interface ReferralCodesTableProps {
  isRefetching?: boolean;
  referralCodes: ReferralCode[];
  totalCount: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  search: string;
  onSearchChange: (s: string) => void;
  mutate: () => void;
}

export default function ReferralCodesTable({
  isRefetching,
  referralCodes,
  totalCount,
  page,
  limit,
  onPageChange,
  onLimitChange,
  search,
  onSearchChange,
  mutate,
}: ReferralCodesTableProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tableInstance, setTableInstance] = useState<Table<ReferralCode> | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      code: "",
      mobile: "",
      discount: 0,
      type: "PERCENTAGE",
      maxUsage: 1,
    },
  });

  const handleSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await api.post("/referral-codes", data);
      toast.success("کد رفرال با موفقیت ایجاد شد");
      form.reset();
      setOpen(false);
      mutate();
    } catch (err: any) {
      const code = err?.response?.data?.code;
      toast.error(
        code === "REFERRALCODE_ALREADY_EXISTS"
          ? "این کد از قبل وجود دارد"
          : code === "USER_NOT_FOUND"
          ? "کاربری با این شماره پیدا نشد"
          : "خطا در ایجاد کد رفرال"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LayoutTable isRefetching={isRefetching}>
      <div className="flex flex-1 flex-col gap-3 overflow-hidden p-4">
      <div className="flex flex-wrap items-center gap-2 pb-3">
        <Input
          type="search"
          placeholder="جستجو بر اساس کد یا موبایل..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-xs"
        />
        <Button onClick={() => setOpen(true)}>ایجاد کد رفرال</Button>
      </div>

      <DataTable
        columns={columns}
        data={referralCodes}
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
            <DialogTitle>ایجاد کد رفرال جدید</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>کد رفرال</FormLabel>
                    <FormControl>
                      <Input placeholder="SINA10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شماره موبایل کاربر</FormLabel>
                    <FormControl>
                      <Input placeholder="09123456789" {...field} />
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
                        <SelectItem value="PERCENTAGE">درصدی</SelectItem>
                        <SelectItem value="FIXED">مبلغ ثابت</SelectItem>
                        <SelectItem value="PLAN">پلن</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="discount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مقدار تخفیف</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="10"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxUsage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>حداکثر دفعات استفاده</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="1"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
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
