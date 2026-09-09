'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { ButtonLoading } from '@/components/ui-custom/ButtonLoading';
import { LoaderSpin } from '@/components/ui-custom/LoaderSpin';
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
import { usePermissions } from '@/hooks/usePermissions';
import { useShippingDestinations } from '@/hooks/useShippingDestinations';
import { useShopAddress } from '@/hooks/useShopAddress';
import { onInputP2EHandler } from '@/utils/p2eNumber';

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

/**
 * The whole "آدرس فروشگاه" screen — the workspace's own return address, printed as the فرستنده
 * block of every order's shipping label / invoice. One row per WORKSPACE (not per Instagram
 * account): a workspace has a single return address regardless of how many Instagram pages it
 * connects, matching the sibling `/products/shipping` settings page's shape.
 *
 * `usePermissions().can('order:manage')` gates editing — same split as `ShippingSettings`
 * (reads need `order:view`, writes need `order:manage`), matching the backend controller.
 */
export function ShopAddressSettings() {
  const t = useTranslations('Settings.ShopAddress');
  const t_ec = useTranslations('ERROR_CODES');
  const { can } = usePermissions();
  const canManage = can('order:manage');

  const { address, isLoading, mutate, save } = useShopAddress();
  const { provinces, cities, isLoading: isDestinationsLoading } = useShippingDestinations();

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: {} });

  const stateValue = form.watch('state');
  const citiesInProvince = useMemo(
    () => cities.filter((c) => String(c.provinceId) === stateValue),
    [cities, stateValue],
  );

  // Adopt the server row once it resolves. `data === undefined` (still loading) is left alone —
  // this only fires once per real fetch, never mid-edit, since there is no re-keying trigger any
  // more (a single fixed SWR key for the whole component lifetime, unlike the old per-Instagram
  // dialog this replaced).
  useEffect(() => {
    if (isLoading) return;
    // `''`, not `undefined` -- `state`/`cityId` are manually-controlled Selects
    // (`value={field.value ?? ''}`), not plain registered `<input>`s like the four fields below.
    // `reset()` with an explicit `undefined` for a field that previously held a real value does
    // not reliably clear it on a manually-controlled field the way it does on a registered one.
    form.reset({
      state: address?.city?.province ? String(address.city.province.id) : '',
      cityId: address?.city ? String(address.city.id) : '',
      address: address?.address ?? '',
      postalcode: address?.postalcode ?? '',
      phone: address?.phone ?? '',
      shippingMethod: address?.shippingMethod ?? '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, address]);

  const onSubmit = async (values: FormValues) => {
    await save({
      cityId: values.cityId ? +values.cityId : undefined,
      address: values.address || undefined,
      postalcode: values.postalcode || undefined,
      phone: values.phone || undefined,
      shippingMethod: values.shippingMethod || undefined,
    })
      .then((response) => {
        toast.success(t('saved'));
        // The PUT response is already the saved row WITH city/province resolved — the backend
        // re-reads with relations after saving specifically so this and a GET return the same
        // shape. Write it into the cache directly with `revalidate: false` instead of the
        // default (revalidate-then-refetch, an unnecessary extra GET).
        mutate(response.data, { revalidate: false });
      })
      .catch((error: any) => {
        const code = error?.response?.data?.code;
        toast.error(code ? t_ec(code) : error?.response?.data?.message || t('errors.unknown'));
      });
  };

  if (isLoading) return <LoaderSpin />;

  return (
    <FormProvider {...form}>
      <p className="text-mut mb-4 max-w-xl text-sm text-pretty">{t('description')}</p>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid max-w-2xl grid-cols-2 gap-4">
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
                  // The old city belongs to the old province; keeping it would submit a city
                  // that contradicts the province shown. `''`, not `undefined` -- same reason as
                  // the data-driven reset above: cityId is a manually-controlled Select, and
                  // `setValue(name, undefined)` does not reliably notify its own render.
                  form.setValue('cityId', '', { shouldValidate: false });
                }}
                value={field.value ?? ''}
                dir="rtl"
                disabled={!canManage}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('state')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {provinces.map((p) => (
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
                value={field.value ?? ''}
                dir="rtl"
                disabled={!canManage || !stateValue}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('city')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {citiesInProvince.map((c) => (
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
                <Textarea rows={2} disabled={!canManage} {...field} />
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
                {/* text + inputMode, never type="number": the browser blanks Persian digits
                    before onInputP2EHandler can convert them. */}
                <Input
                  type="text"
                  inputMode="numeric"
                  onInput={onInputP2EHandler}
                  disabled={!canManage}
                  {...field}
                />
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
                <Input
                  type="text"
                  inputMode="numeric"
                  onInput={onInputP2EHandler}
                  disabled={!canManage}
                  {...field}
                />
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
                <Input
                  placeholder={t('shippingMethodPlaceholder')}
                  disabled={!canManage}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <ButtonLoading
          isLoading={form.formState.isSubmitting}
          disabled={!canManage || isLoading || isDestinationsLoading}
          type="submit"
          className="col-span-2 w-fit"
        >
          {t('save')}
        </ButtonLoading>
      </form>
    </FormProvider>
  );
}
