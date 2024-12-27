"use client";

import { z } from "zod";
import { Card } from "@/components/theme/ui/card";
import { Input } from "@/components/theme/ui/input";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { FormProvider, useForm } from "react-hook-form";
import { Button } from "@/components/theme/ui/button";

const schema = z.object({
    cardnumber: z.string().min(1, { message: "This field is required" }),
});

export default function BankDetails() {
    const t = useTranslations("Settings.BankDetails");

    const formMethods = useForm({
        defaultValues: {
            bankname: "",
            cardnumber: "",
            iban: "",
            accountholder: "",
        },
        resolver: zodResolver(schema),
    });

    const { control, register, formState: { errors } } = formMethods;

    return (
        <div className="flex h-full">
            <div className="w-3/5 h-full">
                <Card className="border-l-2 border-gray-100 h-full p-6">
                    <div className="mb-6">
                        <h2 className="font-semibold text-primary">کارت به کارت</h2>
                        <p className="text-sm text-muted-foreground">برای فعال شدن شیوه پرداخت کارت به کارت اطلاعات زیر را تکمیل کنید.</p>
                    </div>
                    <FormProvider {...formMethods}>
                        <form>
                            <div className="grid gap-2">
                                <FormField
                                    control={control}
                                    name="bankname"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("bankName")}</FormLabel>
                                            <FormControl>
                                                <Input id="bankname" {...field} />
                                            </FormControl>
                                            {errors.bankname && (
                                                <span className="text-red-500 text-sm">{t("required")}</span>
                                            )}
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={control}
                                    name="accountholder"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("accountHolder")}</FormLabel>
                                            <FormControl>
                                                <Input id="accountholder" {...field} />
                                            </FormControl>
                                            {errors.accountholder && (
                                                <span className="text-red-500 text-sm">{t("required")}</span>
                                            )}
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={control}
                                    name="cardnumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("cardNumber")}</FormLabel>
                                            <FormControl>
                                                <Input id="cardnumber" {...field} />
                                            </FormControl>
                                            {errors.cardnumber && (
                                                <span className="text-red-500 text-sm">{t("required")}</span>
                                            )}
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={control}
                                    name="iban"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("iban")}</FormLabel>
                                            <FormControl>
                                                <Input id="iban" {...field} />
                                            </FormControl>
                                            {errors.iban && (
                                                <span className="text-red-500 text-sm">{t("required")}</span>
                                            )}
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </form>
                    </FormProvider>
                    <div className="mt-6">
                        <Button className="w-full" variant={"success"}>
                            {t("save")}
                        </Button>
                    </div>
                </Card>
            </div>
            <div></div>
        </div>
    );
}
