"use client";

import { z } from "zod";
import { Card } from "@/components/theme/ui/card";
import { Input } from "@/components/theme/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { FormProvider, useForm } from "react-hook-form";
import { Button } from "@/components/theme/ui/button";
import ErrorMessage from "@/components/ui/errorMessage";
import { useEffect, useState } from "react";
import useSWRImmutable from "swr/immutable";
import { CardToCardSkeleton } from "./cardToCard.skeleton";
import { toast } from "@/components/ui/use-toast";
import LoadingButton from '@/components/ui/button-loading';
import { REGEX_NUMBERICAL_STRING } from "@/app/utils/regex";

export const bankDetailsSchema = z.object({
  bankName: z
    .string()
    .min(1, { message: "minimun" })
    .max(255, { message: "maximum" }),
  cardNumber: z
    .string()
    .regex(REGEX_NUMBERICAL_STRING, { message: "required" })
    .min(16, { message: "minimun" })
    .max(16, { message: "maximum" }),
  iban: z
    .string()
    .regex(REGEX_NUMBERICAL_STRING, { message: "required" })
    .min(24, { message: "minimun" })
    .max(24, { message: "maximum" }),
  accountHolder: z
    .string()
    .min(1, { message: "minimun" })
    .max(255, { message: "maximum" }),
});

export default function BankDetails() {
  const t = useTranslations("Settings.BankDetails");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      bankName: "",
      cardNumber: "",
      iban: "",
      accountHolder: "",
    },
    resolver: zodResolver(bankDetailsSchema),
  });

  const { data: cardToCardData, isLoading: cardToCardLoading, error: cardToCardError } = useSWRImmutable(`${process.env.NEXT_PUBLIC_BACK_API_URL}/payments/cardToCard`, {
    revalidateOnMount: true
  })

  useEffect(() => {

    if (!cardToCardData) return;
    form.reset(cardToCardData)

  }, [cardToCardData])

  const onSubmit = async (data: z.infer<typeof bankDetailsSchema>) => {
    setIsSubmitting(true)
    fetch(`${process.env.NEXT_PUBLIC_BACK_API_URL}/payments/cardToCard`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    })
    .then(async (res) => {
      if (res.ok) {
        toast({
          title: t("cardToCardUpdated"),
        });
        return;
      }
      toast({
        title: t("cardToCardUpdateFailed"),
        variant: "destructive"
      });
    })
    .catch(e => {
      toast({
        title: t("cardToCardUpdateFailed"),
        variant: "destructive"
      });
    })
    .finally(() => {
      setIsSubmitting(false)
    })
  };

  const {
    control,
    register,
    formState: { errors },
  } = form;

  if (cardToCardLoading) {
    return (<CardToCardSkeleton/>)
  }

  return (
    <div className="flex h-full">
      <div className="w-3/5 h-full">
        <Card className="border-l-2 border-gray-100 h-full p-6">
          <div className="mb-6">
            <h2 className="font-semibold text-primary">کارت به کارت</h2>
            <p className="text-sm text-muted-foreground">
              برای فعال شدن شیوه پرداخت کارت به کارت اطلاعات زیر را تکمیل کنید.
            </p>
          </div>
          <FormProvider {...form}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid gap-2">
                  <FormField
                    control={control}
                    name="bankName"
                    render={({ field, fieldState: { error } }) => (
                      <FormItem>
                        <FormLabel>{t("bankName.label")}</FormLabel>
                        <FormControl>
                          <Input id="bankname" {...field} />
                        </FormControl>
                        {error && (
                          <ErrorMessage>{t("bankName.required")}</ErrorMessage>
                        )}
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="accountHolder"
                    render={({ field, fieldState: { error } }) => (
                      <FormItem>
                        <FormLabel>{t("accountHolder.label")}</FormLabel>
                        <FormControl>
                          <Input id="accountholder" {...field} />
                        </FormControl>
                        {error && (
                          <ErrorMessage>
                            {t("accountHolder.required")}
                          </ErrorMessage>
                        )}
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="cardNumber"
                    render={({ field, fieldState: { error } }) => (
                      <FormItem>
                        <FormLabel>{t("cardNumber.label")}</FormLabel>
                        <FormControl>
                          <Input id="cardnumber" {...field} />
                        </FormControl>
                        {error && (
                          <ErrorMessage>
                            {t("cardNumber.required")}
                          </ErrorMessage>
                        )}
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="iban"
                    render={({ field, fieldState: { error } }) => (
                      <FormItem>
                        <FormLabel>{t("iban.label")}</FormLabel>
                        <FormControl>
                          <div className="w-full relative">
                            <Input id="iban" {...field} />
                            <p className="absolute top-1/2 transform -translate-y-1/2 left-2 text-gray-500">IR</p>
                          </div>
                        </FormControl>
                        {error && (
                          <ErrorMessage>{t("iban.required")}</ErrorMessage>
                        )}
                      </FormItem>
                    )}
                  />
                </div>
                <div className="mt-6">
                  <LoadingButton isLoading={isSubmitting} className="w-full" variant={"success"}>
                    {t("save")}
                  </LoadingButton>
                </div>
              </form>
            </Form>
          </FormProvider>
        </Card>
      </div>
    </div>
  );
}
