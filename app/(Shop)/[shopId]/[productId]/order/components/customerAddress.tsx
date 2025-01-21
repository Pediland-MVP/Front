"use client";

import logger from "@/app/utils/logger";
import { z } from "zod";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { orderFormSchema } from "../checkout.page";
import { zodResolver } from "@hookform/resolvers/zod";
// UI
import { Textarea } from "@/components/theme/ui/textarea";
import { Package } from "@phosphor-icons/react/dist/ssr";
import { Input } from "@/components/theme/ui/input";
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
import useSWRImmutable from "swr/immutable";
import { ProvinceNamespace } from "@/types/province";
import { CityNamespace } from "@/types/city";
import { useEffect } from "react";
import LoadingButton from '@/components/ui/button-loading';
import useShipping from "../hooks/useShipping";
import ErrorMessage from "@/components/ui/errorMessage";
import { Button } from "@/components/theme/ui/button";
import { useCheckout } from "../useCheckout";

export default function Address() {
  const t = useTranslations("Checkout");

  const { setStep } = useCheckout()

  const {
    register,
    getValues,
    control,
    formState: { errors },
    watch,
    trigger
  } = useFormContext<z.infer<typeof orderFormSchema>>();

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
      `${getValues().state}`,
    {
      revalidateOnMount: true,
    }
  );

  useEffect(() => {
    if (getValues().state) {
      fetchCities();
    }
  }, [watch("state")]);

  const { updateShipping, loading: isUpdateShippingLoading } = useShipping()

  const updateShippingHandler = async () => {
    await trigger('address')
    await trigger('cityId')
    await trigger('postalcode')

    if (errors.address || errors.cityId || errors.postalcode) {
      return
    }
    updateShipping()
  }

  return (
    <div className="_customer-address p-3">
      <h2 className="text-lg font-semibold mb-2 border-b pb-2 flex items-center gap-2 text-primary">
        <Package size={28} weight="duotone" className="text-primary" />
        {t("address")}
      </h2>

      {/* <FormProvider {...form}>
        <form onSubmit={form.handleSubmit((data) => console.log(data))}> */}
          <div className="grid gap-2">
            <FormField
              control={control}
              name="state"
              render={({ field, fieldState: {error} }) => (
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
                        <SelectValue placeholder={t("state")} />
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
                    {
                      error && (
                        <ErrorMessage>{t('CustomerAddress.state.Errors.required')}</ErrorMessage>
                      )
                    }
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="cityId"
              render={({ field, fieldState: {error} }) => (
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
                        <SelectValue placeholder={t("city")} />
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
                  {
                    error && (
                      <ErrorMessage>{t('CustomerAddress.cityId.Errors.required')}</ErrorMessage>
                    )
                  }
                </FormItem>
              )}
            />
            {/* <FormField
              control={control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("state")}</FormLabel>
                  <FormControl>
                    <Input
                      id="state"
                      {...register("state", { required: true })} />
                  </FormControl>
                  {errors.state && (
                    <span className="text-red-500 text-sm">{t("required")}</span>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("city")}</FormLabel>
                  <FormControl>
                    <Input id="city" {...register("city", { required: true })} />
                  </FormControl>
                  {errors.city && (
                    <span className="text-red-500 text-sm">{t("required")}</span>
                  )}
                </FormItem>
              )}
            /> */}

            <FormField
              control={control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("address")}</FormLabel>
                  <FormControl>
                    <Textarea
                      id="address"
                      {...register("address", { required: true })}
                    />
                  </FormControl>
                  {errors.address && (
                    <span className="text-red-500 text-sm">
                      {t("required")}
                    </span>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="postalcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("postalCode")}</FormLabel>
                  <FormControl>
                    <Input
                      id="postalcode"
                      {...register("postalcode", { required: true })}
                    />
                  </FormControl>
                  {errors.postalcode && (
                    <span className="text-red-500 text-sm">
                      {t("required")}
                    </span>
                  )}
                </FormItem>
              )}
            />
          </div>
        {/* </form>
      </FormProvider> */}
      <div className="mt-6 w-full flex justify-center items-center gap-x-2">
      <Button onClick={() => setStep(1)} className="3/12 bg-gray-500">
          {t('back')}
        </Button>

        <LoadingButton onClick={updateShippingHandler} isLoading={isUpdateShippingLoading} className="w-9/12" variant={"success"} type="button">
          {t("nextStep")}
        </LoadingButton>
      </div>
    </div>
  );
}
