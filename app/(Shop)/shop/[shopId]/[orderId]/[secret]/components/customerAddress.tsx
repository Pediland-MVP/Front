"use client";

import logger from "@/app/utils/logger";
import { z } from "zod";
import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { orderFormSchema } from "../checkout.page";
// UI
import { Textarea } from "@/components/theme/ui/textarea";
import { Package } from "@phosphor-icons/react/dist/ssr";
import { Input } from "@/components/theme/ui/input";
import { Label } from "@/components/theme/ui/label";

export default function Address() {
  const t = useTranslations("Checkout");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useFormContext<z.infer<typeof orderFormSchema>>();

  logger.debug(errors)

  return (
    <div className="_customer-address md:col-span-2 p-3">
      <h2 className="text-lg font-semibold mb-4 border-b pb-2 flex items-center gap-2 text-primary">
        <Package size={28} weight="duotone" className="text-primary" />
        {t("address")}
      </h2>
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <Label className="text-gray-600" htmlFor="state">
            {t("state")}
          </Label>
          <Input id="state" {...register("state", { required: true })} />
          {errors.state && (
            <span className="text-red-500 text-sm">{t("required")}</span>
          )}
        </div>
        <div>
          <Label className="text-gray-600" htmlFor="city">
            {t("city")}
          </Label>
          <Input id="city" {...register("city", { required: true })} />
          {errors.city && (
            <span className="text-red-500 text-sm">{t("required")}</span>
          )}
        </div>
        <div className="md:col-span-2">
          <Label className="text-gray-600" htmlFor="address">
            {t("address")}
          </Label>
          <Textarea id="address" {...register("address", { required: true })} />
          {errors.address && (
            <span className="text-red-500 text-sm">{t("required")}</span>
          )}
        </div>
        <div className="md:col-span-2">
          <Label className="text-gray-600" htmlFor="postalCode">
            {t("postalCode")}
          </Label>
          <Input
            id="postalcode"
            type="number"
            {...register("postalcode", { required: true })}
          />
          {errors.postalcode && (
            <span className="text-red-500 text-sm">{t(`Errors.postalcode.${errors.postalcode.type}`)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
