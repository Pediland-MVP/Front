'use client';

import { GENDERS_ENUM } from '@/constants/gender.constant';
import api from '@/hooks/swr/api-client';
import logger from '@/utils/logger';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import DateObject from 'react-date-object';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import DatePicker from 'react-multi-date-picker';
import { toast } from 'sonner';
import { mutate } from 'swr';
import useSWRImmutable from 'swr/immutable';
import { z } from 'zod';
// TODO: Refactor Types & Schemas
import { CityNamespace } from '@/types/city';
import { ProvinceNamespace } from '@/types/province';
import { UserNamespace } from '@/types/user';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoaderSpin } from '../ui-custom/LoaderSpin';
import { ButtonLoading } from '../ui-custom/ButtonLoading';

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

export function ProfileForm() {
  const t = useTranslations('Profile.Form');
  const locale = useLocale();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formSchema = z
    .object({
      gender: z
        .nativeEnum(GENDERS_ENUM)
        .optional()
        .nullable()
        .transform((data) => data || undefined),
      birthDate: z
        .string()
        .optional()
        .nullable()
        .transform((data) => data || undefined),
      firstname: z
        .string()
        .optional()
        .nullable()
        .transform((data) => data || undefined),
      lastname: z
        .string()
        .optional()
        .nullable()
        .transform((data) => data || undefined),
      email: z
        .string()
        .email()
        .readonly()
        .optional()
        .nullable()
        .transform((data) => data || undefined),
      mobile: z
        .string()
        .readonly()
        .optional()
        .nullable()
        .transform((data) => data || undefined),
      state: z
        .string()
        .optional()
        .nullable()
        .transform((data) => data || undefined),
      cityId: z
        .string()
        .optional()
        .nullable()
        .transform((data) => data || undefined),
    })
    .superRefine((data, ctx) => {
      if (data.state && !data.cityId) {
        ctx.addIssue({
          code: 'custom',
          message: t('Errors.cityRequired'),
          path: ['cityId'],
        });
      }
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cityId: '',
      state: '',
    },
  });

  const {
    data: userData,
    error: userError,
    isLoading: userIsLoading,
  } = useSWRImmutable<UserNamespace.GET.User>(`${API_URL}/users/me`, {
    revalidateOnMount: true,
    refreshInterval: 30_000,
  });

  const resetWithUserData = () => {
    if (!userData?.data || userError) return;
    const user = userData.data;
    const cityId = user.city?.id?.toString();
    const state = user.city?.province?.id?.toString();
    form.reset({
      ...user,
      ...(user.birthDate && {
        birthDate: new Date(user.birthDate).getTime().toString(),
      }),
      ...(cityId && { cityId }),
      ...(state && { state }),
    });
  };

  useEffect(() => {
    resetWithUserData();

    if (userError) {
      logger.debug(userError.data);
    }
  }, [userData, userError]);

  const {
    data: provinces,
    error: provincesError,
    isLoading: provincesIsLoading,
    mutate: fetchProvinces,
  } = useSWRImmutable<ProvinceNamespace.GET>(`${API_URL}/cities/provinces`, {
    revalidateOnMount: true,
  });

  const {
    data: cities,
    error: citiesError,
    isLoading: citiesIsLoading,
    mutate: fetchCities,
  } = useSWRImmutable<CityNamespace.GET>(
    () => `${API_URL}/cities?provinceId=` + `${form.getValues().state}`,
    {
      revalidateOnMount: true,
    },
  );

  useEffect(() => {
    if (form.getValues().state) {
      fetchCities();
    }
  }, [form.watch('state')]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    await api
      .post('/users', {
        ...data,
      })
      .then((res) => {
        toast.success(t('profileUpdated'));
        mutate(`${API_URL}/users/me`);
      })
      .catch((e) => {
        toast.error(t('profileUpdateFailed'));
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const router = useRouter();
  const onCancel = () => {
    router.push('/');
  };

  if (userIsLoading) return <LoaderSpin />;

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full md:w-2/3">
        <div className="grid gap-2 md:grid-cols-4">
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>{t('gender')}</FormLabel>
                <Select
                  onValueChange={(val) => val && field.onChange(val)}
                  defaultValue={field.value}
                  value={field.value}
                  dir="rtl"
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('genderSelect')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="female">{t('female')}</SelectItem>
                    <SelectItem value="male">{t('male')}</SelectItem>
                    <SelectItem value="other">{t('other')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <Controller
            control={form.control}
            name="birthDate"
            rules={{ required: true }}
            render={({
              field: { onChange, name, value },
              fieldState: { invalid, isDirty },
              formState: { errors },
            }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>{t('birthDate')}</FormLabel>
                <DatePicker
                  containerClassName="w-full"
                  style={{ width: '100%' }}
                  value={
                    value
                      ? new DateObject(+value)
                          .setLocale(persian_fa)
                          .setCalendar(persian)
                          .format('YYYY/MM/DD')
                      : ''
                  }
                  onChange={(date) => {
                    onChange(date?.isValid ? (date.unix * 1000).toString() : '');
                  }}
                  format={'YYYY/MM/DD'}
                  calendar={persian}
                  locale={persian_fa}
                  render={<Input name="birthDate" />}
                />
                {errors && errors[name] && errors[name].type === 'required' && (
                  <span>{t('errors.birthDateRequired')}</span>
                )}
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="firstname"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>{t('firstname')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                {form.formState.errors?.firstname && (
                  <span className="text-sm text-red-500">
                    {t(`Errors.firstname.${form.formState.errors.firstname.type}`)}
                  </span>
                )}
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastname"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>{t('lastname')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                {form.formState.errors?.lastname && (
                  <span className="text-sm text-red-500">
                    {t(`Errors.lastname.${form.formState.errors.lastname.type}`)}
                  </span>
                )}
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            disabled
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>{t('email')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                {form.formState.errors?.email && (
                  <span className="text-sm text-red-500">
                    {t(`Errors.email.${form.formState.errors.email.type}`)}
                  </span>
                )}
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="mobile"
            disabled
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>{t('mobile')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                {form.formState.errors?.mobile && (
                  <span className="text-sm text-red-500">
                    {t(`Errors.mobile.${form.formState.errors.mobile.type}`)}
                  </span>
                )}
              </FormItem>
            )}
          />
          {locale === 'fa' && (
            <>
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{t('state')}</FormLabel>
                    <Select
                      onValueChange={(val) => val && field.onChange(val)}
                      defaultValue={field.value}
                      value={field.value}
                      dir="rtl"
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('genderSelect')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {provinces?.map((province) => (
                          <SelectItem key={province.id} value={`${province.id}`}>
                            {province.name}
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
                  <FormItem className="md:col-span-2">
                    <FormLabel>{t('city')}</FormLabel>
                    <Select
                      onValueChange={(val) => val && field.onChange(val)}
                      defaultValue={field.value}
                      dir="rtl"
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('genderSelect')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cities?.map((city) => (
                          <SelectItem key={city.id} value={`${city.id}`}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </div>
        <ButtonLoading isLoading={isSubmitting} type="submit" className="mt-4 w-full">
          {t('save')}
        </ButtonLoading>
      </form>
    </FormProvider>
  );
}
