"use client";

import api from "@/hooks/swr/api-client";
import { REGEX_NUMBERICAL_STRING } from "@/utils/regex";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import useSWRImmutable from "swr/immutable";
import { z } from "zod";

import {
  ButtonLoading,
  ErrorMessage,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  Input,
  LoaderSpin,
} from "@components";

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

export default function BankCardPage() {
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

  const {
    data: cardToCardData,
    isLoading: cardToCardLoading,
    error: cardToCardError,
  } = useSWRImmutable(`/payments/cardToCard`, {
    revalidateOnMount: true,
  });

  useEffect(() => {
    if (!cardToCardData) return;
    form.reset(cardToCardData);
  }, [cardToCardData]);

  const onSubmit = async (data: z.infer<typeof bankDetailsSchema>) => {
    setIsSubmitting(true);
    await api
      .post("/payments/cardToCard", data)
      .then((res) => {
        toast.success(t("cardToCardUpdated"));
      })
      .catch((e) => {
        toast.error(t("cardToCardUpdateFailed"));
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const {
    control,
    register,
    formState: { errors },
  } = form;

  return (
    <div className="_card-page flex-1 rounded-t-3xl bg-white md:rounded-t-none md:rounded-b-xl">
      <div className="flex h-full flex-col border-gray-100 px-4 py-5 md:pt-0">
        <div className="mb-5">
          <h2 className="text-primary mb-1 font-semibold">{t("title")}</h2>
          <p className="text-muted-foreground text-sm">{t("description")}</p>
        </div>
        <div className="flex-1">
          {cardToCardLoading ? (
            <LoaderSpin />
          ) : (
            <>
              <FormProvider {...form}>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="w-full md:w-1/2"
                  >
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
                              <ErrorMessage>
                                {t("bankName.required")}
                              </ErrorMessage>
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
                              <Input id="cardnumber" dir="ltr" {...field} />
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
                              <div className="relative w-full">
                                <Input
                                  id="iban"
                                  {...field}
                                  className="pl-10 text-left"
                                  dir="ltr"
                                />
                                <p
                                  className="absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-500"
                                  dir="ltr"
                                >
                                  IR -
                                </p>
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
                      <ButtonLoading
                        isLoading={isSubmitting}
                        className="w-full"
                      >
                        {t("save")}
                      </ButtonLoading>
                    </div>
                  </form>
                </Form>
              </FormProvider>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
