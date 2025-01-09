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
import { Label } from "@/components/theme/ui/label";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";

export default function Address() {
  const t = useTranslations("Checkout");

  const form = useForm<z.infer<typeof orderFormSchema>>({
    resolver: zodResolver(orderFormSchema),
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useFormContext<z.infer<typeof orderFormSchema>>();

  logger.debug(errors)

  return (
    <div className="_customer-address p-3">
      <h2 className="text-lg font-semibold mb-2 border-b pb-2 flex items-center gap-2 text-primary">
        <Package size={28} weight="duotone" className="text-primary" />
        {t("address")}
      </h2>

      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit((data) => console.log(data))}>
          <div className="grid gap-2">
            <FormField
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
            />

            <FormField
              control={control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("address")}</FormLabel>
                  <FormControl>
                    <Textarea id="address" {...register("address", { required: true })} />
                  </FormControl>
                  {errors.address && (
                    <span className="text-red-500 text-sm">{t("required")}</span>
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
                    <Input id="postalcode" {...register("postalcode", { required: true })} />
                  </FormControl>
                  {errors.postalcode && (
                    <span className="text-red-500 text-sm">{t("required")}</span>
                  )}
                </FormItem>
              )}
            />
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
