"use client";

import { Controller, useForm, useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { orderFormSchema } from "../checkout.page";
// UI
import { Label } from "@/components/theme/ui/label";
import { Input } from "@/components/theme/ui/input";
import { UserRectangle } from "@phosphor-icons/react/dist/ssr";
import { RadioGroup, RadioGroupItem } from "@/components/theme/ui/radio-group";
import { Button } from "@/components/theme/ui/button";

export default function CustomerDetails() {
  const t = useTranslations("Checkout");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useFormContext<z.infer<typeof orderFormSchema>>();

  return (
    <div className="_customer-details md:col-span-2 p-3">
      <h2 className="text-lg font-semibold mb-4 border-b pb-2 flex items-center gap-2 text-primary">
        <UserRectangle size={28} weight="duotone" className="text-primary" />
        {t("customerDetails")}
      </h2>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="flex items-center gap-6 md:col-span-2">
          <Label className="text-gray-600" htmlFor="gender">
            {t("gender")}
          </Label>
          <Controller
            name="gender"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <RadioGroup dir="rtl" className="flex" id="gender">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female">{t("female")}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male">{t("male")}</Label>
                </div>
              </RadioGroup>
            )}
          />
          {errors.gender && (
            <span className="text-red-500 text-sm">{t("required")}</span>
          )}
        </div>
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
          <Label className="text-gray-600" htmlFor="mobile">
            {t("mobile")}
          </Label>
          <Input id="mobile" {...register("mobile", { required: true })} />
          {errors.mobile && (
            <span className="text-red-500 text-sm">{t("required")}</span>
          )}
        </div>
        <div className="mt-3 w-full">
          <Button className="w-full" variant={"success"}>
            {t("nextStep")}
          </Button>
        </div>
      </div>
    </div>
  );
}
