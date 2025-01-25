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

export default function CustomerDetails() {
  const t = useTranslations("Checkout");
  
  const { pendingOrder, product } = useCheckout()

  const {
    register,
    control,
    formState: { errors },
    trigger,
  } = useFormContext<z.infer<typeof orderFormSchema>>();


  const { createOrder, loading: isCreateOrderLoading } = useOrder();

  const { updateContact, loading: isUpdateContactLoading } = useUpdateContact()

  const createOrderHandler = async () => {
    await trigger('firstname')
    await trigger('lastname')
    await trigger('mobile')

    if (errors.firstname || errors.lastname || errors.mobile) {
      return
    }

    if (pendingOrder) {
      await updateContact()
      return
    }

    createOrder();
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
                  {...register("mobile", { required: true })}
                />
              </FormControl>
              {errors.mobile && (
                <span className="text-red-500 text-sm">{t("required")}</span>
              )}
            </FormItem>
          )}
        />
      </div>
      <div className="mt-6 w-full flex justify-center items-center gap-x-2">
        <LoadingButton
          onClick={createOrderHandler}
          isLoading={isCreateOrderLoading}
          className="w-full"
          variant={"success"}
          type="button"
          disabled={!product?.isInfinite && product?.quantity===0}
        >
          {t("nextStep")}
        </LoadingButton>
      </div>
    </div>
  );
}
