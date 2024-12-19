"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { CircleNotch, Package } from "@phosphor-icons/react/dist/ssr";
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
    state: string;
    person: string;
};

export default function Address() {
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
        <div className="_customer-address md:col-span-2">
            <h2 className="text-lg font-semibold mb-5 border-b pb-2 flex items-center gap-2 text-primary">
                <Package size={28} weight="duotone" className="text-primary" />{t("address")}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid md:grid-cols-2 gap-3">
                    <div>
                        <Label className="text-gray-600" htmlFor="state">{t("state")}</Label>
                        <Input id="state" {...register("state", { required: true })} />
                        {errors.state && (
                            <span className="text-red-500 text-sm">{t("required")}</span>
                        )}
                    </div>
                    <div>
                        <Label className="text-gray-600" htmlFor="city">{t("city")}</Label>
                        <Input id="city" {...register("city", { required: true })} />
                        {errors.city && (
                            <span className="text-red-500 text-sm">{t("required")}</span>
                        )}
                    </div>
                    <div className="md:col-span-2">
                        <Label className="text-gray-600" htmlFor="address">{t("address")}</Label>
                        <Input id="address" {...register("address", { required: true })} />
                        {errors.address && (
                            <span className="text-red-500 text-sm">{t("required")}</span>
                        )}
                    </div>
                    <div>
                        <Label className="text-gray-600" htmlFor="postalCode">{t("postalCode")}</Label>
                        <Input
                            id="postalCode"
                            {...register("postalCode", { required: true })}
                        />
                        {errors.postalCode && (
                            <span className="text-red-500 text-sm">{t("required")}</span>
                        )}
                    </div>
                    <div>
                        <Label className="text-gray-600" htmlFor="person">{t("person")}</Label>
                        <Input id="person" {...register("person", { required: true })} />
                        {errors.person && (
                            <span className="text-red-500 text-sm">{t("required")}</span>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
}
