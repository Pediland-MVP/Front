"use client";

import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { orderFormSchema } from "../checkout.page";
// UI
import { Input } from "@/components/theme/ui/input";
import { UserRectangle } from "@phosphor-icons/react/dist/ssr";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import LoadingButton from "@/components/ui/button-loading";
import useOrder from "../hooks/useOrder";
import { Button } from "@/components/theme/ui/button";
import { useCheckout } from "../useCheckout";
import useUpdateContact from "../hooks/useUpdateContact";
import p2eNumbers, { onInputP2EHandler } from "@/app/utils/p2eNumber";
import { ProductFieldTypeEnum } from "@/types/product.enum";
import { useEffect, useState } from "react";
import ErrorMessage from "@/components/ui/errorMessage";
import { Textarea } from "@/components/theme/ui/textarea";

export default function CustomerDetails() {
  const t = useTranslations("Checkout");

  const { pendingOrder, product } = useCheckout();

  const {
    register,
    control,
    formState: { errors },
    trigger,
    clearErrors,
    getValues,
    watch
  } = useFormContext<z.infer<typeof orderFormSchema>>();

  const { createOrder, loading: isCreateOrderLoading } = useOrder();

  const { updateContact, loading: isUpdateContactLoading } = useUpdateContact();

  const [isProductFieldsError, setIsProductFieldsError] = useState<{ [key: number]: boolean }>({});

  
  

  const createOrderHandler = async () => {
    await trigger("firstname");
    await trigger("lastname");
    await trigger("mobile");

    if (errors.firstname || errors.lastname || errors.mobile) {
      return;
    }

    const productFieldValues = watch('productFieldValues')
    if ((product?.fields?.length || 0) > 0) {
      let haveError = false
      productFieldValues?.forEach((pf, index) => {
        if (pf.isRequired && !pf.value) {
          setIsProductFieldsError((prevState: any) => ({
            ...prevState,
            [index]: true,
          }));
          haveError = true
        }
      })

      if (haveError) return;
    }

    if (pendingOrder) {
      await updateContact();
      clearErrors();
      return;
    }

    await createOrder();
    clearErrors();
  };


  return (
    <div className="_customer-details p-3">
      <h2 className="text-lg font-semibold mb-2 border-b pb-2 flex items-center gap-2 text-primary">
        <UserRectangle size={28} weight="duotone" className="text-primary" />
        {t("customerDetails")}
      </h2>

      <div className="grid gap-2">
        <FormField
          control={control}
          name="firstname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("firstName")}</FormLabel>
              <FormControl>
                <Input
                  id="firstname"
                  {...register("firstname", { required: true })}
                />
              </FormControl>
              {errors.firstname && (
                <span className="text-red-500 text-sm">{t("required")}</span>
              )}
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="lastname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("lastName")}</FormLabel>
              <FormControl>
                <Input
                  id="lastname"
                  {...register("lastname", { required: true })}
                />
              </FormControl>
              {errors.lastname && (
                <span className="text-red-500 text-sm">{t("required")}</span>
              )}
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="mobile"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("mobile")}</FormLabel>
              <FormControl>
                <Input
                  id="mobile"
                  type="tel"
                  onInput={onInputP2EHandler}
                  {...register("mobile", { required: true })}
                />
              </FormControl>
              {errors.mobile && (
                <span className="text-red-500 text-sm">{t("required")}</span>
              )}
            </FormItem>
          )}
        />

        {watch('productFieldValues')?.map((f, index) => (
          <FormField
            key={index}
            control={control}
            name={`productFieldValues.${index}.value`}
            render={({ field, fieldState: {error} }) => (
              <FormItem>
                <FormLabel>{f.label}</FormLabel>
                <FormControl>
                  {f.type === ProductFieldTypeEnum.TEXTAREA ? (
                    <Textarea {...field} />
                  ) : (
                    f.type === ProductFieldTypeEnum.TEXT && <Input {...field} />
                  )}
                </FormControl>
                  {
                    isProductFieldsError[index] && <ErrorMessage>{t('required')}</ErrorMessage>
                  }
              </FormItem>
            )}
          />
        ))}
      </div>
      <div className="mt-6 w-full flex justify-center items-center gap-x-2">
        <LoadingButton
          onClick={createOrderHandler}
          isLoading={isCreateOrderLoading}
          className="w-full"
          type="button"
          disabled={!product?.isInfinite && product?.quantity === 0}
        >
          {t("nextStep")}
        </LoadingButton>
      </div>
    </div>
  );
}
