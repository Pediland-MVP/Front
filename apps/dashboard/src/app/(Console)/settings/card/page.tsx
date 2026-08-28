'use client';

import api from '@/hooks/swr/api-client';
import { onInputP2EHandler } from '@/utils/p2eNumber';
import { REGEX_NUMBERICAL_STRING } from '@/utils/regex';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { mutate } from 'swr';
import useSWRImmutable from 'swr/immutable';
import { z } from 'zod';

import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { MoneyField } from '@/components/Commerce/Shipping/MoneyField';
import { ButtonLoading } from '@/components/ui-custom/ButtonLoading';
import { ErrorMessage } from '@/components/ui-custom/ErrorMessage';
import { LoaderSpin } from '@/components/ui-custom/LoaderSpin';
import { usePermissions } from '@/hooks/usePermissions';

export const bankDetailsSchema = z.object({
  bankName: z.string().min(1).max(255),
  accountHolder: z.string().min(1).max(255),
  cardNumber: z
    .string()
    .regex(REGEX_NUMBERICAL_STRING, { message: 'required' })
    .length(16, { message: 'must be 16 digits' }),
  iban: z
    .string()
    .transform((val) => (val === '' ? undefined : val))
    .optional()
    .refine((val) => !val || REGEX_NUMBERICAL_STRING.test(val), {
      message: 'required',
    })
    .refine((val) => !val || val.length === 24, {
      message: 'must be 24 digits',
    }),
  /**
   * پرداخت در محل. It rides this form because the backend writes it through this same endpoint —
   * `POST /payments/cardToCard` — on the reasoning that this page is the one place a merchant
   * says how their shop gets paid. It is a payment method and is entirely independent of
   * پس‌کرایه, which is a *shipping* pricing mode set per method on /products/shipping.
   */
  codEnabled: z.boolean(),
  /** `null` means COD at any order total; a number caps it. */
  codMaxOrderValue: z.number().int().min(0).nullable(),
});

export default function BankCardPage() {
  const t = useTranslations('Settings.BankDetails');
  const t_ec = useTranslations('ERROR_CODES');
  const { can, isLoading: permissionsLoading } = usePermissions();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof bankDetailsSchema>>({
    defaultValues: {
      bankName: '',
      cardNumber: '',
      iban: '',
      accountHolder: '',
      codEnabled: false,
      codMaxOrderValue: null,
    },
    resolver: zodResolver(bankDetailsSchema),
  });

  const canView = can('billing:view');
  const canManage = can('billing:manage');

  const {
    data: cardToCardData,
    isLoading: cardToCardLoading,
    error: cardToCardError,
  } = useSWRImmutable(canView ? `/payments/cardToCard` : null, {
    revalidateOnMount: true,
  });

  useEffect(() => {
    if (!cardToCardData) return;

    form.reset({
      bankName: cardToCardData.bankName ?? '',
      cardNumber: cardToCardData.cardNumber ?? '',
      iban: cardToCardData.iban ?? '',
      accountHolder: cardToCardData.accountHolder ?? '',
      codEnabled: cardToCardData.codEnabled ?? false,
      codMaxOrderValue: cardToCardData.codMaxOrderValue ?? null,
    });
  }, [cardToCardData]);

  const onSubmit = async (data: z.infer<typeof bankDetailsSchema>) => {
    setIsSubmitting(true);

    try {
      const res = await api.post('/payments/cardToCard', data);
      if (res.status >= 200 && res.status < 300) {
        toast.success(t('cardToCardUpdated'));
        // Other pages (e.g. the products list) hold their own `useSWRImmutable('/payments/cardToCard')`
        // and never revalidate on their own — without this they keep showing the pre-save data.
        await mutate('/payments/cardToCard');
      } else {
        toast.error(t('cardToCardUpdateFailed'));
      }
    } catch (e) {
      toast.error(t('cardToCardUpdateFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const {
    control,
    register,
    formState: { errors },
  } = form;

  if (permissionsLoading || (canView && cardToCardLoading)) {
    return (
      <div className="_card-page flex h-[300px] flex-1 items-center justify-center rounded-t-3xl bg-white md:rounded-t-none md:rounded-b-xl">
        <LoaderSpin />
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="_card-page flex-1 rounded-t-3xl bg-white md:rounded-t-none md:rounded-b-xl">
        <div className="flex h-full flex-col border-gray-100 px-4 py-5 md:pt-0">
          <div className="mb-5">
            <h2 className="text-primary mb-1 font-semibold">{t('title')}</h2>
            <p className="text-muted-foreground text-sm">{t('description')}</p>
          </div>
          <div className="text-muted-foreground rounded-xl border bg-white py-12 text-center text-sm shadow-xs">
            {t_ec('PERMISSION_DENIED')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="_card-page flex-1 rounded-t-3xl bg-white md:rounded-t-none md:rounded-b-xl">
      <div className="flex h-full flex-col border-gray-100 px-4 py-5 md:pt-0">
        <div className="mb-5">
          <h2 className="text-primary mb-1 font-semibold">{t('title')}</h2>
          <p className="text-muted-foreground text-sm">{t('description')}</p>
        </div>
        <div className="flex-1">
          {cardToCardLoading ? (
            <LoaderSpin />
          ) : (
            <>
              <FormProvider {...form}>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="w-full md:w-1/2">
                    <div className="grid gap-2">
                      <FormField
                        control={control}
                        name="bankName"
                        render={({ field, fieldState: { error } }) => (
                          <FormItem>
                            <FormLabel>{t('bankName.label')}</FormLabel>
                            <FormControl>
                              <Input id="bankname" disabled={!canManage} {...field} />
                            </FormControl>
                            {error && <ErrorMessage>{t('bankName.required')}</ErrorMessage>}
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name="accountHolder"
                        render={({ field, fieldState: { error } }) => (
                          <FormItem>
                            <FormLabel>{t('accountHolder.label')}</FormLabel>
                            <FormControl>
                              <Input id="accountholder" disabled={!canManage} {...field} />
                            </FormControl>
                            {error && <ErrorMessage>{t('accountHolder.required')}</ErrorMessage>}
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name="cardNumber"
                        render={({ field, fieldState: { error } }) => (
                          <FormItem>
                            <FormLabel>{t('cardNumber.label')}</FormLabel>
                            <FormControl>
                              <Input
                                id="cardnumber"
                                dir="ltr"
                                maxLength={16}
                                disabled={!canManage}
                                {...field}
                                onChange={(e) => {
                                  onInputP2EHandler(e);
                                  field.onChange(e);
                                }}
                              />
                            </FormControl>
                            {error && <ErrorMessage>{t('cardNumber.required')}</ErrorMessage>}
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name="iban"
                        render={({ field, fieldState: { error } }) => (
                          <FormItem>
                            <FormLabel>{t('iban.label')}</FormLabel>
                            <FormControl>
                              <div className="relative w-full">
                                <Input
                                  id="iban"
                                  {...field}
                                  className="pl-10 text-left"
                                  dir="ltr"
                                  maxLength={24}
                                  disabled={!canManage}
                                  onChange={(e) => {
                                    onInputP2EHandler(e);
                                    field.onChange(e);
                                  }}
                                />
                                <p
                                  className="absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-500"
                                  dir="ltr"
                                >
                                  IR -
                                </p>
                              </div>
                            </FormControl>
                            {error && <ErrorMessage>{t('iban.required')}</ErrorMessage>}
                          </FormItem>
                        )}
                      />
                    </div>

                    {/*
                      پرداخت در محل — a payment method, not a shipping mode. The courier collects
                      the whole order (goods + postage) at the door and the merchant settles it
                      later from the orders screen. Deliberately NOT the same thing as پس‌کرایه on
                      /products/shipping, which only covers the postage; the two are orthogonal and
                      all four combinations are valid.
                    */}
                    <div className="border-lnv bg-tint mt-6 rounded-xl border p-3">
                      <FormField
                        control={control}
                        name="codEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start gap-2.5 space-y-0">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                disabled={!canManage}
                                onCheckedChange={field.onChange}
                                aria-label={t('cod.label')}
                              />
                            </FormControl>
                            <div className="flex min-w-0 flex-col gap-0.5">
                              <FormLabel className="text-sm font-semibold">
                                {t('cod.label')}
                              </FormLabel>
                              <span className="text-muted-foreground text-xs text-pretty">
                                {t('cod.description')}
                              </span>
                            </div>
                          </FormItem>
                        )}
                      />

                      {form.watch('codEnabled') && (
                        <FormField
                          control={control}
                          name="codMaxOrderValue"
                          render={({ field }) => (
                            <FormItem className="mt-3 space-y-1.5">
                              <FormLabel className="text-muted-foreground text-xs font-bold">
                                {t('cod.ceilingLabel')}
                              </FormLabel>
                              <FormControl>
                                <MoneyField
                                  value={field.value}
                                  onChange={field.onChange}
                                  disabled={!canManage}
                                  size="sm"
                                  ariaLabel={t('cod.ceilingLabel')}
                                  placeholder={t('cod.ceilingPlaceholder')}
                                  unit={t('cod.unit')}
                                  className="[&_input]:bg-card w-52"
                                />
                              </FormControl>
                              <span className="text-muted-foreground block text-xs text-pretty">
                                {t('cod.ceilingHint')}
                              </span>
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    <div className="mt-6">
                      <ButtonLoading
                        isLoading={isSubmitting}
                        className="w-full"
                        disabled={!canManage}
                      >
                        {t('save')}
                      </ButtonLoading>
                    </div>
                  </form>
                </Form>
              </FormProvider>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
