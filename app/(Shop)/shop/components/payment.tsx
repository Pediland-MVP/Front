"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { CircleNotch, CreditCard, UserRectangle } from "@phosphor-icons/react/dist/ssr";
import { Input } from "@/components/theme/ui/input";
import { Button } from "@/components/theme/ui/button";
import { Label } from "@/components/theme/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/theme/ui/radio-group";
import FileUploader from "@/components/theme/uploader";

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

export default function PaymentDetails() {
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
        <div className="_customer-details md:col-span-4">
            <h2 className="text-lg font-semibold mb-5 border-b pb-2 flex items-center gap-2 text-primary">
                <CreditCard size={28} weight="duotone" className="text-primary" />{t("paymentMethod")}
            </h2>
            <form>
                <div className="grid md:grid-cols-2 gap-4">
                    <RadioGroup defaultValue="2" dir="rtl" className="gap-4 items-start flex flex-col">
                        <div className="flex items-center gap-2">
                            <RadioGroupItem value="1" id="r1" disabled />
                            <Label htmlFor="r1" className="text-base text-gray-400">پرداخت آنلاین (زرین پال) - بزودی</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <RadioGroupItem value="2" id="r2" />
                            <Label htmlFor="r2" className="text-base">کارت به کارت</Label>
                        </div>
                    </RadioGroup>
                    <div className="_uploader">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="picture" className="font-normal mb-2 text-gray-500">لطفا تصویر رسید وجه پرداختی را بارگذاری نمایید.</Label>
                            <FileUploader />
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
