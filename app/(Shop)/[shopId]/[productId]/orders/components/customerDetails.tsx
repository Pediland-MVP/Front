"use client";

import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { orderFormSchema } from "../checkout.page";
import { zodResolver } from "@hookform/resolvers/zod";
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

export default function CustomerDetails() {
  const t = useTranslations("Checkout");

  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<z.infer<typeof orderFormSchema>>();

  const form = useForm<z.infer<typeof orderFormSchema>>({
    resolver: zodResolver(orderFormSchema),
  });

  const { createOrder, loading: isCreateOrderLoading } = useOrder();

  const createOrderHandler = async () => {
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
      <div className="mt-6 w-full">
        <LoadingButton
          onClick={createOrderHandler}
          isLoading={isCreateOrderLoading}
          className="w-full"
          variant={"success"}
        >
          {t("nextStep")}
        </LoadingButton>
      </div>
    </div>
  );
}
