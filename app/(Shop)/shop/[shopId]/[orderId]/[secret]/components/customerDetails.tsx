"use client";

import { useState } from "react";
import { Controller, useForm, useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { CircleNotch, UserRectangle } from "@phosphor-icons/react/dist/ssr";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { orderFormSchema } from "../checkout.page";
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from "@/components/theme/ui/select";

export default function CustomerDetails() {
  const t = useTranslations("Checkout");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useFormContext<z.infer<typeof orderFormSchema>>();

  return (
    <div className="_customer-details md:col-span-2">
      <h2 className="text-lg font-semibold mb-5 border-b pb-2 flex items-center gap-2 text-primary">
        <UserRectangle size={28} weight="duotone" className="text-primary" />
        {t("customerDetails")}
      </h2>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="col-start-1">
          <Label className="text-gray-600" htmlFor="firstname">
            {t("firstName")}
          </Label>
          <Input
            id="firstname"
            {...register("firstname", { required: true })}
          />
          {errors.firstname && (
            <span className="text-red-500 text-sm">{t("required")}</span>
          )}
        </div>

        <div>
          <Label className="text-gray-600" htmlFor="lastname">
            {t("lastName")}
          </Label>
          <Input id="lastname" {...register("lastname", { required: true })} />
          {errors.lastname && (
            <span className="text-red-500 text-sm">{t("required")}</span>
          )}
        </div>

        <div>
          <Label className="text-gray-600" htmlFor="email">
            {t("email")}
          </Label>
          <Input
            id="email"
            type="email"
            {...register("email", { required: true, pattern: /^\S+@\S+$/i })}
          />
          {errors.email && (
            <span className="text-red-500 text-sm">{t("invalidEmail")}</span>
          )}
        </div>
        <div>
          <Label className="text-gray-600" htmlFor="mobile">
            {t("mobile")}
          </Label>
          <Input id="mobile" {...register("mobile", { required: true })} />
          {errors.mobile && (
            <span className="text-red-500 text-sm">{t("required")}</span>
          )}
        </div>
        <div className="md:col-span-2">
          <Label className="text-gray-600" htmlFor="gender">
            {t("gender")}
          </Label>
          <Controller
            name="gender"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger id="gender">
                  <SelectValue placeholder={t('selectGender')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{t("male")}</SelectItem>
                  <SelectItem value="female">{t("female")}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.gender && (
            <span className="text-red-500 text-sm">{t("required")}</span>
          )}
        </div>
      </div>
    </div>
  );
}
