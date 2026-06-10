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
import useSWR from "swr";
import { useDebounce } from "use-debounce";
import api, { fetcher } from "@/hooks/swr/api-client";
import { formatNumber } from "@/lib/formatNumber";
import { onInputP2EHandler } from "@/lib/p2eNumber";
import { useSelectOnFocus } from "@/hooks/useSelectOnFocus";

const FormSchema = z
  .object({
    code: z.string().min(1, "کد الزامی است"),
    mobile: z.string().regex(/^(\+98|0)?9\d{9}$/, "شماره موبایل معتبر نیست"),
    discount: z.number().positive("تخفیف باید مثبت باشد"),
    type: z.enum(["PERCENTAGE", "FIXED"]),
    maxUsage: z.number().int().min(1).optional(),
    max: z.number().int().nonnegative().optional(),
    atLeast: z.number().int().nonnegative().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "PERCENTAGE" && data.discount > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discount"],
        message: "درصد تخفیف باید بین ۱ تا ۱۰۰ باشد",
      });
    }
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
  const { onFocus } = useSelectOnFocus();

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

  const type = form.watch("type");
  const mobile = form.watch("mobile");
  const [debouncedMobile] = useDebounce(mobile, 500);
  const isMobileValid = /^(\+98|0)?9\d{9}$/.test(debouncedMobile ?? "");

  const {
    data: userData,
    error: userError,
    isLoading: isUserLoading,
  } = useSWR(
    isMobileValid
      ? `/referral-codes/user-by-mobile?mobile=${debouncedMobile}`
      : null,
    fetcher,
    { shouldRetryOnError: false },
  );

  const foundUser = userData?.data as
    | { id: string; firstname: string; lastname: string; mobile: string }
    | undefined;
  const userNotFound = isMobileValid && !isUserLoading && !!userError;

  const handleSubmit = async (data: FormValues) => {
    if (!foundUser) {
      toast.error("کاربری با این شماره پیدا نشد");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload =
        data.type === "PERCENTAGE"
          ? data
          : { ...data, max: undefined, atLeast: undefined };
      await api.post("/referral-codes", payload);
      toast.success("کد رفرال با موفقیت ایجاد شد");
      form.reset();
      setOpen(false);
      mutate();
    } catch (err: any) {
      const code = err?.response?.data?.code;
      toast.error(
        code === "REFERRALCODE_ALREADY_EXISTS"
          ? "این کد از قبل وجود دارد"
          : code === "USER_NOTFOUND"
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
                    {isMobileValid && isUserLoading && (
                      <p className="text-xs text-muted-foreground">
                        در حال بررسی شماره...
                      </p>
                    )}
                    {foundUser && (
                      <p className="text-xs text-emerald-600">
                        کاربر: {foundUser.firstname} {foundUser.lastname}
                      </p>
                    )}
                    {userNotFound && (
                      <p className="text-xs text-destructive">
                        کاربری با این شماره پیدا نشد
                      </p>
                    )}
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
                    <FormLabel>
                      {type === "PERCENTAGE" ? "درصد تخفیف" : "مبلغ تخفیف"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        onInput={onInputP2EHandler}
                        onFocus={onFocus}
                        placeholder="۰"
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
              {type === "PERCENTAGE" && (
                <>
                  <FormField
                    control={form.control}
                    name="max"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>سقف تخفیف</FormLabel>
                        <FormControl>
                          <Input
                            onInput={onInputP2EHandler}
                            onFocus={onFocus}
                            placeholder="۰"
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
                    name="atLeast"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>حداقل تخفیف</FormLabel>
                        <FormControl>
                          <Input
                            onInput={onInputP2EHandler}
                            onFocus={onFocus}
                            placeholder="۰"
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
                </>
              )}
              <FormField
                control={form.control}
                name="maxUsage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>حداکثر دفعات استفاده</FormLabel>
                    <FormControl>
                      <Input
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
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  انصراف
                </Button>
                <Button type="submit" disabled={isSubmitting || !foundUser}>
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
