"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { CircleNotch, UserRectangle } from "@phosphor-icons/react/dist/ssr";
import { Input } from "@/components/ui/input";
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
  gender: string;
};

export default function CustomerDetails() {
  const t = useTranslations("Checkout");
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
    <div className="_customer-details md:col-span-2">
      <h2 className="text-lg font-semibold mb-5 border-b pb-2 flex items-center gap-2 text-primary">
        <UserRectangle size={28} weight="duotone" className="text-primary" />{t("customerDetails")}
      </h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <Label className="text-gray-600" htmlFor="gender">{t("gender")}</Label>
            <Input id="gender" {...register("gender", { required: true })} />
            {errors.gender && (
              <span className="text-red-500 text-sm">{t("required")}</span>
            )}
          </div>
          <div className="col-start-1">
            <Label className="text-gray-600" htmlFor="firstName">{t("firstName")}</Label>
            <Input
              id="firstName"
              {...register("firstName", { required: true })}
            />
            {errors.firstName && (
              <span className="text-red-500 text-sm">{t("required")}</span>
            )}
          </div>

          <div>
            <Label className="text-gray-600" htmlFor="lastName">{t("lastName")}</Label>
            <Input id="lastName" {...register("lastName", { required: true })} />
            {errors.lastName && (
              <span className="text-red-500 text-sm">{t("required")}</span>
            )}
          </div>

          <div>
            <Label className="text-gray-600" htmlFor="email">{t("email")}</Label>
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
            <Label className="text-gray-600" htmlFor="mobile">{t("mobile")}</Label>
            <Input id="mobile" {...register("mobile", { required: true })} />
            {errors.mobile && (
              <span className="text-red-500 text-sm">{t("required")}</span>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
