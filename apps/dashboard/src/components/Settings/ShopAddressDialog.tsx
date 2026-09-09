'use client';

import { zodResolver } from '@hookform/resolvers/zod';
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

  // Blank the form the MOMENT the target account (or the dialog's open state) changes,
  // before the new account's fetch has a chance to resolve. Without this immediate
  // reset, switching from account A (has a saved address) to account B leaves A's
  // values on screen for the duration of B's fetch — and if the user hits save in that
  // window, A's address gets written onto B's row.
  useEffect(() => {
    form.reset({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, instagramId]);

  // Once the fetch for the CURRENT account resolves, replace the blanked form with the
  // real values. This must run as a separate effect from the one above, keyed on `data`
  // rather than `[open, instagramId]`, because `data` for a brand-new key starts as
  // `undefined` and only becomes the resolved response later — collapsing the two
  // effects would either skip this reset (stale blanked form) or fire on every
  // navigation regardless of whether the fetch actually resolved.
  useEffect(() => {
    if (data === undefined) return; // still loading (or no key yet) — leave the blanked form as-is
    // `data.data` is `null`, not `undefined`, for an account with no saved address —
    // that is a real "loaded, and empty" state and must reset to blanks, not be
    // mistaken for "still loading" (which would leave a previous account's values on
    // screen and risk saving them onto this account).
    const a = data.data;
    form.reset({
      // `''`, not `undefined` — `state`/`cityId` are manually-controlled Selects
      // (`value={field.value ?? ''}`), not plain registered `<input>`s like the four
      // fields below. `reset()` with an explicit `undefined` for a field that
      // previously held a real value does not reliably clear it on a
      // manually-controlled field the way it does on a registered one: switching from
      // an account with a saved city to one with none left the Selects stuck showing
      // the previous account's province/city (a real cross-account leak, caught by a
      // repro test in ShopAddressDialog.test.tsx). `''` matches the pattern already
      // used for address/postalcode/phone/shippingMethod and is what the Selects'
      // `?? ''` fallback already treats as "no selection".
      state: a?.city?.province ? String(a.city.province.id) : '',
      cityId: a?.city ? String(a.city.id) : '',
      address: a?.address ?? '',
      postalcode: a?.postalcode ?? '',
      phone: a?.phone ?? '',
      shippingMethod: a?.shippingMethod ?? '',
    });
  }, [data]);

  const onSubmit = async (values: FormValues) => {
    if (!instagramId) return;
    setIsSubmitting(true);

    await api
      .put<IResponseMessage<IShopAddress>>(`/instagram/${instagramId}/shopAddress`, {
        cityId: values.cityId ? +values.cityId : undefined,
        address: values.address || undefined,
        postalcode: values.postalcode || undefined,
        phone: values.phone || undefined,
        shippingMethod: values.shippingMethod || undefined,
      })
      .then((response) => {
        toast.success(t('saved'));
        // The PUT response is already the saved row WITH city/province resolved — the
        // backend re-reads with relations after saving specifically so this and a GET
        // return the same shape. Write it into the cache directly with
        // `revalidate: false` instead of `mutate(key)`'s default (revalidate-then-
        // refetch, a real extra GET): that extra round trip was both unnecessary and,
        // because it was awaited before `onOpenChange(false)`, delayed the dialog's
        // close for no reason.
        mutate(key, response.data, { revalidate: false });
        onOpenChange(false);
      })
      .catch((error: any) => {
        // Same fallback shape as Commerce/Orders/OrderDetailPage.tsx's onAction: branch on
        // `code` first (a missing key still returns a truthy key-path string from `t_ec`,
        // which would swallow the server message fallback), then fall back to the server
        // message, then to a generic unknown-error copy so a transport failure (no
        // `response` at all) never renders an empty toast.
        const code = error?.response?.data?.code;
        toast.error(code ? t_ec(code) : error?.response?.data?.message || t('errors.unknown'));
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
                      // submit a city that contradicts the province shown. `''`, not
                      // `undefined` -- same reason as the data-driven reset effect
                      // above: cityId is a manually-controlled Select
                      // (`value={field.value ?? ''}`), and `setValue(name, undefined)`
                      // does not reliably notify a Controller-bound field's own
                      // render (the actually-submitted value did clear correctly even
                      // without this fix, confirmed by inspecting the PUT payload in
                      // a repro test -- this was a real but purely VISUAL staleness,
                      // not a wrong-data-gets-saved bug). `shouldValidate: false`
                      // matches this repo's existing convention for a live "clear
                      // this field" setValue (see TeamManager.tsx's inviteType toggle).
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
                    value={field.value ?? ''}
                    dir="rtl"
                    disabled={!canManage}
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
                    {/* text + inputMode, never type="number": the browser blanks
                        Persian digits before onInputP2EHandler can convert them. */}
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
