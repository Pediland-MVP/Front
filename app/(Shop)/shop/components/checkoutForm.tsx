"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type FormData = {
  firstName: string;
  lastName: string;
  postalCode: string;
  address: string;
  mobile: string;
  email: string;
  city: string;
  country: string;
};

export default function CheckoutForm() {
  const t = useTranslations("Form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log(data);
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">{t("firstName")}</Label>
          <Input
            id="firstName"
            {...register("firstName", { required: true })}
          />
          {errors.firstName && (
            <span className="text-red-500 text-sm">{t("required")}</span>
          )}
        </div>
        <div>
          <Label htmlFor="lastName">{t("lastName")}</Label>
          <Input id="lastName" {...register("lastName", { required: true })} />
          {errors.lastName && (
            <span className="text-red-500 text-sm">{t("required")}</span>
          )}
        </div>
      </div>
      <div>
        <Label htmlFor="address">{t("address")}</Label>
        <Input id="address" {...register("address", { required: true })} />
        {errors.address && (
          <span className="text-red-500 text-sm">{t("required")}</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="postalCode">{t("postalCode")}</Label>
          <Input
            id="postalCode"
            {...register("postalCode", { required: true })}
          />
          {errors.postalCode && (
            <span className="text-red-500 text-sm">{t("required")}</span>
          )}
        </div>
        <div>
          <Label htmlFor="city">{t("city")}</Label>
          <Input id="city" {...register("city", { required: true })} />
          {errors.city && (
            <span className="text-red-500 text-sm">{t("required")}</span>
          )}
        </div>
      </div>
      <div>
        <Label htmlFor="country">{t("country")}</Label>
        <Input id="country" {...register("country", { required: true })} />
        {errors.country && (
          <span className="text-red-500 text-sm">{t("required")}</span>
        )}
      </div>
      <div>
        <Label htmlFor="email">{t("email")}</Label>
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
        <Label htmlFor="mobile">{t("mobile")}</Label>
        <Input id="mobile" {...register("mobile", { required: true })} />
        {errors.mobile && (
          <span className="text-red-500 text-sm">{t("required")}</span>
        )}
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <CircleNotch className="mr-2 h-4 w-4 animate-spin" />
            {t("submitting")}
          </>
        ) : (
          t("submit")
        )}
      </Button>
    </form>
  );
}
