"use client";

import logger from "@/utils/logger";
import { z } from "zod";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { orderFormSchema } from "../checkout.page";
import { zodResolver } from "@hookform/resolvers/zod";
// UI
import { Textarea } from "@/components/ui/textarea";
import { Package } from "@phosphor-icons/react/dist/ssr";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/select";
import useSWRImmutable from "swr/immutable";
import { ProvinceNamespace } from "@/types/province";
import { CityNamespace } from "@/types/city";
import { useEffect } from "react";
import { ButtonLoading } from "@/components/ui-custom/ButtonLoading";
import useShipping from "../hooks/useShipping";
import { ErrorMessage } from "@components";
import { Button } from "@/components/ui/button";
import { useCheckout } from "../useCheckout";
import { onInputP2EHandler } from "@/utils/p2eNumber";
import useCheckoutStep from "../hooks/useCheckoutStep";
import { ShippingInfo } from "./shippingInfo";

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

export default function Address() {
  const t = useTranslations("Checkout");

  const { setStep, pendingOrder } = useCheckout();
  const { nextStep, prevStep } = useCheckoutStep();

  const {
    register,
    getValues,
    control,
    formState: { errors },
    watch,
    trigger,
  } = useFormContext<z.infer<typeof orderFormSchema>>();

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
    () => `${API_URL}/cities?provinceId=` + `${watch("state")}`,
    {
      revalidateOnMount: true,
    },
  );

  useEffect(() => {
    if (watch("state")) {
      fetchCities();
    }
  }, [watch("state")]);

  const { updateShipping, loading: isUpdateShippingLoading } = useShipping();

  const updateShippingHandler = async () => {
    await trigger("address");
    await trigger("cityId");
    await trigger("postalcode");

    if (errors.address || errors.cityId || errors.postalcode) {
      return;
    }
    updateShipping();
  };

  // useEffect(() => {
  //   console.log("Pending order", pendingOrder);
  // }, [pendingOrder]);

  return (
    <div className="_customer-address p-3">
      <h2 className="text-primary mb-2 flex items-center gap-2 border-b pb-2 text-lg font-semibold">
        <Package size={28} weight="duotone" className="text-primary" />
        {t("address")}
      </h2>

      <ShippingInfo
        shippingCost={pendingOrder?.orderProducts[0]?.shippingCost}
      />
      {/* <FormProvider {...form}>
        <form onSubmit={form.handleSubmit((data) => console.log(data))}> */}
      <div className="grid gap-2">
        <FormField
          control={control}
          name="state"
          render={({ field, fieldState: { error } }) => (
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
              {error && (
                <ErrorMessage>
                  {t("CustomerAddress.state.Errors.required")}
                </ErrorMessage>
              )}
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="cityId"
          render={({ field, fieldState: { error } }) => (
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
              {error && (
                <ErrorMessage>
                  {t("CustomerAddress.cityId.Errors.required")}
                </ErrorMessage>
              )}
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
                <span className="text-sm text-red-500">{t("required")}</span>
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
                  inputMode="numeric"
                  onInput={onInputP2EHandler}
                  {...register("postalcode", { required: true })}
                />
              </FormControl>
              {errors.postalcode && (
                <span className="text-sm text-red-500">{t("required")}</span>
              )}
            </FormItem>
          )}
        />
      </div>
      {/* </form>
      </FormProvider> */}
      <div className="mt-6 flex w-full items-center justify-center gap-x-2">
        <Button
          onClick={() => setStep(prevStep())}
          className="w-4/12 bg-gray-500 hover:bg-gray-400"
        >
          {t("back")}
        </Button>

        <ButtonLoading
          onClick={updateShippingHandler}
          isLoading={isUpdateShippingLoading}
          className="w-8/12"
          type="button"
        >
          {t("nextStep")}
        </ButtonLoading>
      </div>
    </div>
  );
}
