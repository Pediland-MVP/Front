'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { AxiosError } from 'axios';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import useSWRImmutable from 'swr/immutable';
import { mutate } from 'swr';
import * as z from 'zod';

import { ButtonLoading } from '@/components/ui-custom/ButtonLoading';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import api from '@/hooks/swr/api-client';
import type { IResponseMessage } from '@/types/responseMessage';
import type { ExceptionMessage } from '@/types/exceptionMessage';
import type { IShopAddress } from '@/types/instagram/shopAddress';
import { onInputP2EHandler } from '@/utils/p2eNumber';

// Same pattern as components/Settings/ProfileForm.tsx and InstagramAccounts.tsx — no
// shared `@/constants/api` module exists in this app, every consumer defines its own.
const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

const schema = z.object({
  state: z.string().optional(),
  cityId: z.string().optional(),
  address: z.string().max(500).optional(),
  // Optional, but a value that IS present must be a real 10-digit postal code —
  // a half-typed one on a parcel is worse than none.
  postalcode: z
    .string()
    .regex(/^\d{10}$/)
    .optional()
    .or(z.literal('')),
  phone: z.string().max(20).optional(),
  shippingMethod: z.string().max(50).optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  instagramId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage: boolean;
}

export function ShopAddressDialog({ instagramId, open, onOpenChange, canManage }: Props) {
  const t = useTranslations('Settings.ShopAddress');
  const t_ec = useTranslations('ERROR_CODES');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: {} });

  const key = open && instagramId ? `/instagram/${instagramId}/shopAddress` : null;
  const { data } = useSWRImmutable<IResponseMessage<IShopAddress | null>>(key);

  // Same cascade as components/Settings/ProfileForm.tsx: provinces load once, cities
  // reload whenever the picked province changes.
  const { data: provinces } = useSWRImmutable<{ id: number; name: string }[]>(
    open ? `${API_URL}/cities/provinces` : null,
  );
  const stateValue = form.watch('state');
  const { data: cities } = useSWRImmutable<{ id: number; name: string }[]>(
    open && stateValue ? `${API_URL}/cities?provinceId=${stateValue}` : null,
  );

  useEffect(() => {
    const a = data?.data;
    if (!a) return;
    form.reset({
      state: a.city?.province ? String(a.city.province.id) : undefined,
      cityId: a.city ? String(a.city.id) : undefined,
      address: a.address ?? '',
      postalcode: a.postalcode ?? '',
      phone: a.phone ?? '',
      shippingMethod: a.shippingMethod ?? '',
    });
  }, [data]);

  const onSubmit = async (values: FormValues) => {
    if (!instagramId) return;
    setIsSubmitting(true);

    await api
      .put(`/instagram/${instagramId}/shopAddress`, {
        cityId: values.cityId ? +values.cityId : undefined,
        address: values.address || undefined,
        postalcode: values.postalcode || undefined,
        phone: values.phone || undefined,
        shippingMethod: values.shippingMethod || undefined,
      })
      .then(async () => {
        toast.success(t('saved'));
        await mutate(key);
        onOpenChange(false);
      })
      .catch((e: AxiosError<ExceptionMessage>) => {
        toast.error(t_ec(e.response?.data.code) || e.response?.data.message);
      })
      .finally(() => setIsSubmitting(false));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">{t('description')}</p>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('state')}</FormLabel>
                  <Select
                    onValueChange={(val) => {
                      if (!val) return;
                      field.onChange(val);
                      // The old city belongs to the old province; keeping it would
                      // submit a city that contradicts the province shown.
                      form.setValue('cityId', undefined);
                    }}
                    value={field.value}
                    dir="rtl"
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('state')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {provinces?.map((p) => (
                        <SelectItem key={p.id} value={`${p.id}`}>
                          {p.name}
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
              name="cityId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('city')}</FormLabel>
                  <Select
                    onValueChange={(val) => val && field.onChange(val)}
                    value={field.value}
                    dir="rtl"
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('city')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cities?.map((c) => (
                        <SelectItem key={c.id} value={`${c.id}`}>
                          {c.name}
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
              name="address"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>{t('address')}</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="postalcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('postalCode')}</FormLabel>
                  <FormControl>
                    {/* text + inputMode, never type="number": the browser blanks
                        Persian digits before onInputP2EHandler can convert them. */}
                    <Input type="text" inputMode="numeric" onInput={onInputP2EHandler} {...field} />
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.postalcode && t('postalcodeInvalid')}
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('phone')}</FormLabel>
                  <FormControl>
                    <Input type="text" inputMode="numeric" onInput={onInputP2EHandler} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shippingMethod"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>{t('shippingMethod')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('shippingMethodPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <ButtonLoading
              isLoading={isSubmitting}
              disabled={!canManage}
              type="submit"
              className="col-span-2"
            >
              {t('save')}
            </ButtonLoading>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
