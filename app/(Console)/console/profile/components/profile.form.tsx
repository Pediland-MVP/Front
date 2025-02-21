"use client"

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { z } from "zod";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { GENDERS_ENUM } from "@/app/constants/gender.constant";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import DateObject from "react-date-object";
import persian_fa from "react-date-object/locales/persian_fa";
import { useEffect, useState } from "react";
import ProfileFormSkeleton from "./profileForm.sekeleton";
import useSWRImmutable from "swr/immutable";
import logger from "@/app/utils/logger";
import useSWR, { mutate } from "swr";
import { ProvinceNamespace } from "@/types/province";
import { CityNamespace } from "@/types/city";
import { UserNamespace } from "@/types/user";
import { useRouter } from "next/navigation";
// UI
import {
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
} from "@/components/theme/ui/select";
import { Card } from "@/components/theme/ui/card";
import { Input } from "@/components/theme/ui/input";
import { Button } from "@/components/theme/ui/button";
import { toast } from "@/components/ui/use-toast";
import LoadingButton from "@/components/ui/button-loading";
import LoadingSpinner from "@/components/theme/ui/loadingSpinner";

export function ProfileForm() {
  const t = useTranslations("Profile.Form");
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
          code: "custom",
          message: t("Errors.cityRequired"),
          path: ["cityId"],
        });
      }
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cityId: "",
      state: "",
    },
  });

  const {
    data: userData,
    error: userError,
    isLoading: userIsLoading,
  } = useSWRImmutable<UserNamespace.GET>(
    `${process.env.NEXT_PUBLIC_BACK_API_URL}/users/me`,
    {
      revalidateOnMount: true,
      refreshInterval: 30_000
    }
  );

  const resetWithUserData = () => {
    if (!userData || userError) return;
    const cityId = userData.city?.id?.toString();
    const state = userData.city?.province?.id?.toString();
    form.reset({
      ...userData,
      ...(userData.birthDate && {
        birthDate: new Date(userData.birthDate).getTime().toString(),
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
  } = useSWRImmutable<ProvinceNamespace.GET>(
    `${process.env.NEXT_PUBLIC_BACK_API_URL}/cities/provinces`,
    {
      revalidateOnMount: true,
    }
  );

  const {
    data: cities,
    error: citiesError,
    isLoading: citiesIsLoading,
    mutate: fetchCities,
  } = useSWRImmutable<CityNamespace.GET>(
    () =>
      `${process.env.NEXT_PUBLIC_BACK_API_URL}/cities?provinceId=` +
      `${form.getValues().state}`,
    {
      revalidateOnMount: true,
    }
  );

  useEffect(() => {
    if (form.getValues().state) {
      fetchCities();
    }
  }, [form.watch("state")]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    await fetch(`${process.env.NEXT_PUBLIC_BACK_API_URL}/users`, {
      credentials: "include",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then(async (res) => {
        if (res.ok) {
          toast({
            title: t("profileUpdated"),
          });
          mutate(`${process.env.NEXT_PUBLIC_BACK_API_URL}/users/me`);
          return;
        }
        toast({
          title: t("profileUpdateFailed"),
        });
      })
      .catch((e) => {
        toast({
          title: t("profileUpdateFailed"),
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const router = useRouter()
  const onCancel = () => {
    router.push('/console')
  };

  if (userIsLoading) return <LoadingSpinner className="h-full" />;

  return (
    <Card className="h-full md:border-l-2 border-gray-100 p-6 md:p-10">
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-2"
        >
          <div className="grid md:grid-cols-4 gap-2">
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>{t("gender")}</FormLabel>
                  <Select
                    onValueChange={(val) => val && field.onChange(val)}
                    defaultValue={field.value}
                    value={field.value}
                    dir="rtl"
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("genderSelect")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="female">{t("female")}</SelectItem>
                      <SelectItem value="male">{t("male")}</SelectItem>
                      <SelectItem value="other">{t("other")}</SelectItem>
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
                  <FormLabel>{t("birthDate")}</FormLabel>
                  <DatePicker
                    containerClassName="w-full"
                    style={{ width: "100%" }}
                    value={
                      value
                        ? new DateObject(+value)
                          .setLocale(persian_fa)
                          .setCalendar(persian)
                          .format("YYYY/MM/DD")
                        : ""
                    }
                    onChange={(date) => {
                      onChange(
                        date?.isValid ? (date.unix * 1000).toString() : ""
                      );
                    }}
                    format={"YYYY/MM/DD"}
                    calendar={persian}
                    locale={persian_fa}
                    render={<Input name="birthDate" />}
                  />
                  {errors &&
                    errors[name] &&
                    errors[name].type === "required" && (
                      <span>{t("errors.birthDateRequired")}</span>
                    )}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="firstname"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>{t("firstname")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  {form.formState.errors?.firstname && (
                    <span className="text-red-500 text-sm">
                      {t(
                        `Errors.firstname.${form.formState.errors.firstname.type}`
                      )}
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
                  <FormLabel>{t("lastname")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  {form.formState.errors?.lastname && (
                    <span className="text-red-500 text-sm">
                      {t(
                        `Errors.lastname.${form.formState.errors.lastname.type}`
                      )}
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
                  <FormLabel>{t("email")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  {form.formState.errors?.email && (
                    <span className="text-red-500 text-sm">
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
                  <FormLabel>{t("mobile")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  {form.formState.errors?.mobile && (
                    <span className="text-red-500 text-sm">
                      {t(`Errors.mobile.${form.formState.errors.mobile.type}`)}
                    </span>
                  )}
                </FormItem>
              )}
            />
            {locale === "fa" && (
              <>
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>{t("state")}</FormLabel>
                      <Select
                        onValueChange={(val) => val && field.onChange(val)}
                        defaultValue={field.value}
                        value={field.value}
                        dir="rtl"
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("genderSelect")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {provinces?.map((province) => (
                            <SelectItem
                              key={province.id}
                              value={`${province.id}`}
                            >
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
                      <FormLabel>{t("city")}</FormLabel>
                      <Select
                        onValueChange={(val) => val && field.onChange(val)}
                        defaultValue={field.value}
                        dir="rtl"
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("genderSelect")} />
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
          <div className="grid grid-cols-2 gap-3 mt-10">
            <LoadingButton
              isLoading={isSubmitting}
              type="submit"
              className="w-full"
            >
              {t("save")}
            </LoadingButton>
            <Button onClick={onCancel} type="button" className="w-full" variant="outline">
              {t("cancel")}
            </Button>
          </div>
        </form>
      </FormProvider>
    </Card>
  );
}
