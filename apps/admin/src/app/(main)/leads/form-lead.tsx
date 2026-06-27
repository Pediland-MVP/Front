// src/app/(main)/leads/form-lead.tsx
'use client';

import api from '@/hooks/swr/api-client';
import { useCategories } from '@/hooks/use-categories';
import { Category } from '@/types/category';
import { MarketingLead } from '@/types/lead';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';

// UI Imports
import { FetchError } from '@/components/fetch-error';
import { Loading } from '@/components/loading';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { formatNumber } from '@/lib/formatNumber';
import { onInputP2EHandler } from '@/lib/p2eNumber';
import { useSelectOnFocus } from '@/hooks/useSelectOnFocus';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const FormSchema = z.object({
  firstname: z
    .string()
    .min(2, 'حداقل دو کاراکتر وارد کنید.')
    .max(50, 'حداکثر 50 کاراکتر وارد کنید.')
    .optional()
    .nullable()
    .or(z.string().max(0)),
  lastname: z
    .string()
    .min(2, 'حداقل دو کاراکتر وارد کنید.')
    .max(50, 'حداکثر 50 کاراکتر وارد کنید.')
    .optional()
    .nullable()
    .or(z.string().max(0)),
  mobile: z
    .string()
    .length(11, 'دقیقاً ۱۱ رقم وارد کنید.')
    .regex(/^09\d{9}$/, 'فرمت شماره موبایل معتبر نیست.')
    .optional()
    .nullable()
    .or(z.string().max(0)),
  instagram: z.object({
    username: z.string().min(3, 'حداقل 3 کاراکتر وارد کنید.'),
    name: z.string(),
    followersCount: z.number(),
    followsCount: z.number(),
    mediaCount: z.number(),
  }),
  categoryId: z.number().min(1, { message: 'یک دسته‌بندی انتخاب کنید.' }).optional(),

  note: z.string().optional().nullable(),
});

export default function LeadForm({
  data,
  onOpenChange,
  mutateLeads,
}: {
  data?: MarketingLead;
  onOpenChange: (open: boolean) => void;
  mutateLeads?: () => void;
}) {
  const { categories, isError, isLoading } = useCategories();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      firstname: data?.firstname ?? null,
      lastname: data?.lastname ?? null,
      mobile: data?.mobile ?? null,
      instagram: {
        username: data?.instagram?.username ?? '',
        name: data?.instagram?.name ?? '',
        followersCount: data?.instagram?.followersCount ?? 0,
        followsCount: data?.instagram?.followsCount ?? 0,
        mediaCount: data?.instagram?.mediaCount ?? 0,
      },
      categoryId: data?.categoryId ?? undefined,
      note: data?.note ?? '',
    },
  });

  const { onFocus } = useSelectOnFocus();

  const isDisabled = form.formState.isSubmitting;

  useEffect(() => {
    if (data) {
      form.reset({
        firstname: data.firstname ?? null,
        lastname: data.lastname ?? null,
        mobile: data.mobile ?? null,
        instagram: {
          username: data.instagram.username ?? '',
          name: data.instagram.name ?? '',
          followersCount: data.instagram.followersCount ?? 0,
          followsCount: data.instagram.followsCount ?? 0,
          mediaCount: data.instagram.mediaCount ?? 0,
        },
        categoryId: data.categoryId ?? undefined,
        note: data.note ?? '',
      });
    }
  }, [data, form]);

  async function onSubmit(values: z.infer<typeof FormSchema>) {
    const payload = {
      ...values,
      note: values.note ?? '',
    };

    try {
      if (data?.id) {
        await api.patch(`/marketingLeads/${data.id}`, payload);
        mutateLeads?.();
        toast.success('سرنخ با موفقیت ویرایش شد.');
      } else {
        await api.post('/marketingLeads', payload);
        mutateLeads?.();
        toast.success('سرنخ با موفقیت ایجاد شد.');
      }

      form.reset();
      onOpenChange(false);
    } catch (error: unknown) {
      const err = error as AxiosError<{ code?: string }>;
      const code = err.response?.data?.code;

      if (err.response?.status === 409) {
        switch (code) {
          case 'MARKETINGLEAD_MOBILE_IS_EXIST_IN_USERS_TABLE':
            toast.error('این شماره موبایل در لیست مشتریان ثبت شده است.');
            form.setError('mobile', {});
            break;
          case 'MARKETINGLEAD_MOBILE_IS_EXIST':
            toast.error('این شماره موبایل در سرنخ‌ها ثبت شده است.');
            form.setError('mobile', {});
            break;
          case 'MARKETINGLEAD_USERNAME_IS_EXIST_IN_INSTAGRAM_TABLE':
            toast.error('این آیدی اینستاگرام در لیست مشتریان ثبت شده است.');
            form.setError('instagram.username', {});
            break;
          case 'MARKETINGLEAD_USERNAME_IS_EXIST':
            toast.error('این آیدی اینستاگرام در سرنخ‌ها ثبت شده است.');
            form.setError('instagram.username', {});
            break;
          default:
            toast.error('خطای تکراری ناشناخته.');
        }
      } else {
        toast.error('خطا در ایجاد سرنخ.');
      }
    }
  }

  if (isLoading) return <Loading />;
  if (isError) return <FetchError />;

  return (
    <Form {...form}>
      <fieldset disabled={isDisabled}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 pt-2">
          <div className="grid gap-3 md:grid-cols-3 md:gap-2">
            <FormField
              control={form.control}
              name="firstname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نام</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نام خانوادگی</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
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
                  <FormLabel>همراه</FormLabel>
                  <FormControl>
                    <Input
                      dir="ltr"
                      className="text-center text-sm"
                      {...field}
                      value={field.value ?? ''}
                      maxLength={11}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-3 md:gap-2">
            <FormField
              control={form.control}
              name="instagram.username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>آیدی اینستاگرام</FormLabel>
                  <FormControl>
                    <Input
                      className="text-center text-sm"
                      dir="ltr"
                      {...field}
                      disabled={data !== undefined}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="instagram.name"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>عنوان پیج اینستاگرام</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-9 gap-3 md:gap-2">
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field, fieldState }) => (
                <FormItem className="col-span-9 md:col-span-3">
                  <FormLabel>دسته‌بندی</FormLabel>
                  <FormControl>
                    <Select
                      name="categoryId"
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(val) => field.onChange(Number(val))}
                    >
                      <SelectTrigger className="w-full" aria-invalid={!!fieldState.error}>
                        <SelectValue placeholder="انتخاب کنید" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat: Category) => (
                          <SelectItem key={cat.id} value={String(cat.id)}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="instagram.followersCount"
              render={({ field }) => (
                <FormItem className="col-span-3 md:col-span-2">
                  <FormLabel>فالوور</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric"
                      onInput={onInputP2EHandler}
                      onFocus={onFocus}
                      value={
                        field.value === undefined ||
                        field.value === null ||
                        Number.isNaN(field.value)
                          ? ''
                          : formatNumber(field.value)
                      }
                      onChange={(e) => field.onChange(e.target.value === '' ? 0 : +e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="instagram.followsCount"
              render={({ field }) => (
                <FormItem className="col-span-3 md:col-span-2">
                  <FormLabel>فالووینگ</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric"
                      onInput={onInputP2EHandler}
                      onFocus={onFocus}
                      value={
                        field.value === undefined ||
                        field.value === null ||
                        Number.isNaN(field.value)
                          ? ''
                          : formatNumber(field.value)
                      }
                      onChange={(e) => field.onChange(e.target.value === '' ? 0 : +e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="instagram.mediaCount"
              render={({ field }) => (
                <FormItem className="col-span-3 md:col-span-2">
                  <FormLabel>پست</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric"
                      onInput={onInputP2EHandler}
                      onFocus={onFocus}
                      value={
                        field.value === undefined ||
                        field.value === null ||
                        Number.isNaN(field.value)
                          ? ''
                          : formatNumber(field.value)
                      }
                      onChange={(e) => field.onChange(e.target.value === '' ? 0 : +e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="col-span-6 flex justify-end space-x-2 pt-4">
            <Button type="submit" className="w-1/2 md:w-auto" disabled={isDisabled}>
              {isDisabled ? 'در حال ثبت...' : 'ذخیره'}
            </Button>
            <Button
              type="button"
              color={'cancel'}
              className="w-1/2 md:w-auto"
              disabled={isDisabled}
              onClick={() => onOpenChange(false)}
            >
              انصراف
            </Button>
          </div>
        </form>
      </fieldset>
    </Form>
  );
}
