'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { LayoutTable } from '@/components/layout/LayoutTable';
import { DataTable } from '@/components/table/data-table';
import { DataTablePagination } from '@/components/table/pagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { columns, ReferralCode } from './columns';
import { Table } from '@tanstack/react-table';
import useSWR from 'swr';
import { useDebounce } from 'use-debounce';
import api, { fetcher } from '@/hooks/swr/api-client';
import { formatNumber } from '@/lib/formatNumber';
import { onInputP2EHandler } from '@/lib/p2eNumber';
import { useSelectOnFocus } from '@/hooks/useSelectOnFocus';
import { DurationResponse, PlanResponse } from '@/types/subscription';

export const FormSchema = z
  .object({
    code: z.string().min(1, 'کد الزامی است'),
    mobile: z.string().regex(/^(\+98|0)?9\d{9}$/, 'شماره موبایل معتبر نیست'),
    // PLAN codes gift a subscription instead of discounting one, so they carry no
    // discount. The "must be positive" rule lives in superRefine rather than here on
    // purpose: a field-level failure aborts the whole object parse, so a leftover
    // discount of 0 would block a PLAN submit with an error on a hidden field.
    discount: z.number().optional(),
    type: z.enum(['PERCENTAGE', 'FIXED', 'PLAN']),
    maxUsage: z.number().int().min(1).optional(),
    max: z.number().int().nonnegative().optional(),
    atLeast: z.number().int().nonnegative().optional(),
    planId: z.number().int().positive().optional(),
    planDurationId: z.number().int().positive().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'PLAN') {
      if (!data.planDurationId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['planDurationId'],
          message: 'انتخاب مدت اشتراک الزامی است',
        });
      }
      return;
    }

    if (!data.discount || data.discount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discount'],
        message: 'تخفیف باید مثبت باشد',
      });
      return;
    }

    if (data.type === 'PERCENTAGE' && data.discount > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discount'],
        message: 'درصد تخفیف باید بین ۱ تا ۱۰۰ باشد',
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
  const t_ec = useTranslations('ERROR_CODES');

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      code: '',
      mobile: '',
      discount: 0,
      type: 'PERCENTAGE',
      maxUsage: 1,
    },
  });

  const type = form.watch('type');
  const isPlanType = type === 'PLAN';
  const planId = form.watch('planId');
  const mobile = form.watch('mobile');
  const [debouncedMobile] = useDebounce(mobile, 500);
  const isMobileValid = /^(\+98|0)?9\d{9}$/.test(debouncedMobile ?? '');

  const {
    data: userData,
    error: userError,
    isLoading: isUserLoading,
  } = useSWR(
    isMobileValid ? `/referral-codes/user-by-mobile?mobile=${debouncedMobile}` : null,
    fetcher,
    { shouldRetryOnError: false },
  );

  const foundUser = userData?.data as
    | { id: string; firstname: string; lastname: string; mobile: string }
    | undefined;
  const userNotFound = isMobileValid && !isUserLoading && !!userError;

  // Gift-plan picker: plans are only fetched once the admin actually picks the PLAN type,
  // and durations only once a plan is chosen (same cascade as AddSubscriptionDialog).
  const { data: plansData, isLoading: isPlansLoading } = useSWR<PlanResponse>(
    isPlanType ? '/plans' : null,
    fetcher,
  );

  const { data: durationsData, isLoading: isDurationsLoading } = useSWR<DurationResponse>(
    isPlanType && planId ? `/plans/planDurations?planId=${planId}` : null,
    fetcher,
  );

  // A duration belongs to one plan, so a stale selection must not survive a plan switch.
  useEffect(() => {
    form.setValue('planDurationId', undefined);
  }, [planId, form]);

  const handleSubmit = async (data: FormValues) => {
    if (!foundUser) {
      toast.error('کاربری با این شماره پیدا نشد');
      return;
    }
    setIsSubmitting(true);
    try {
      // planId only drives the duration dropdown - the backend stores planDurationId.
      const { planId: _planId, ...rest } = data;
      const payload =
        data.type === 'PLAN'
          ? {
              code: rest.code,
              mobile: rest.mobile,
              type: rest.type,
              planDurationId: rest.planDurationId,
            }
          : data.type === 'PERCENTAGE'
            ? { ...rest, planDurationId: undefined }
            : { ...rest, max: undefined, atLeast: undefined, planDurationId: undefined };
      await api.post('/referral-codes', payload);
      toast.success('کد رفرال با موفقیت ایجاد شد');
      form.reset();
      setOpen(false);
      mutate();
    } catch (err: any) {
      const code = err?.response?.data?.code;
      toast.error((code && t_ec(code)) || 'خطا در ایجاد کد رفرال');
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

        {tableInstance && <DataTablePagination table={tableInstance} totalCount={totalCount} />}

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
                        <p className="text-muted-foreground text-xs">در حال بررسی شماره...</p>
                      )}
                      {foundUser && (
                        <p className="text-xs text-emerald-600">
                          کاربر: {foundUser.firstname} {foundUser.lastname}
                        </p>
                      )}
                      {userNotFound && (
                        <p className="text-destructive text-xs">کاربری با این شماره پیدا نشد</p>
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
                          <SelectItem value="PLAN">پلن (هدیه)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {isPlanType && (
                  <>
                    <FormField
                      control={form.control}
                      name="planId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>پلن</FormLabel>
                          <Select
                            disabled={isPlansLoading}
                            onValueChange={(val) => field.onChange(Number(val))}
                            value={field.value ? field.value.toString() : undefined}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="پلن را انتخاب کنید" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {plansData?.data.map((plan) => (
                                <SelectItem key={plan.id} value={plan.id.toString()}>
                                  {plan.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="planDurationId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>مدت اشتراک هدیه</FormLabel>
                          <Select
                            disabled={!planId || isDurationsLoading}
                            onValueChange={(val) => field.onChange(Number(val))}
                            value={field.value ? field.value.toString() : undefined}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="مدت را انتخاب کنید" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {durationsData?.data.map((duration) => (
                                <SelectItem key={duration.id} value={duration.id.toString()}>
                                  {duration.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <p className="text-muted-foreground text-xs">
                      کاربر معرفی‌شده این اشتراک را هنگام ثبت‌نام هدیه می‌گیرد و پس از اتصال
                      اینستاگرام فعال می‌شود. این کد تخفیف خرید ندارد و یک‌بار مصرف است.
                    </p>
                  </>
                )}
                {!isPlanType && (
                  <FormField
                    control={form.control}
                    name="discount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{type === 'PERCENTAGE' ? 'درصد تخفیف' : 'مبلغ تخفیف'}</FormLabel>
                        <FormControl>
                          <Input
                            onInput={onInputP2EHandler}
                            onFocus={onFocus}
                            placeholder="۰"
                            value={field.value ? formatNumber(field.value) : ''}
                            onChange={(e) =>
                              field.onChange(e.target.value === '' ? 0 : +e.target.value)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {type === 'PERCENTAGE' && (
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
                              value={field.value ? formatNumber(field.value) : ''}
                              onChange={(e) =>
                                field.onChange(e.target.value === '' ? undefined : +e.target.value)
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
                              value={field.value ? formatNumber(field.value) : ''}
                              onChange={(e) =>
                                field.onChange(e.target.value === '' ? undefined : +e.target.value)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                {!isPlanType && (
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
                            value={field.value ? formatNumber(field.value) : ''}
                            onChange={(e) =>
                              field.onChange(e.target.value === '' ? undefined : +e.target.value)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    انصراف
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !foundUser}>
                    {isSubmitting ? 'در حال ذخیره...' : 'ایجاد'}
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
