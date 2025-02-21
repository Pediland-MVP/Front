"use client";

import { Input } from "@/components/theme/ui/input";
import { Card } from "@/components/theme/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";
import LoadingButton from "@/components/ui/button-loading";
import { useEffect, useState } from "react";
import ErrorMessage from "@/components/ui/errorMessage";
import useSWRImmutable from "swr/immutable";
import { toast } from "@/components/ui/use-toast";
import { ExceptionMessage } from "@/types/exceptionMessage";
import LoadingSpinner from "@/components/theme/ui/loadingSpinner";

export default function Zarinpal() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const zarinpalFormSchema = z.object({
    merchantCode: z.string().uuid(),
  });

  const form = useForm({
    resolver: zodResolver(zarinpalFormSchema),
    defaultValues: {
      merchantCode: "",
    },
  });

  const t = useTranslations("Settings.Zarinpal");
  const t_ec = useTranslations("ERROR_CODES");

  const {
    data: zarinpal,
    isLoading: isZarinpalLoading,
    error: zarinpalError,
  } = useSWRImmutable(
    `${process.env.NEXT_PUBLIC_BACK_API_URL}/payments/zarinpal`
  );

  useEffect(() => {
    if (zarinpal) {
      form.reset({ ...zarinpal });
    }
  }, [zarinpal]);

  const onSubmit = async (values: z.infer<typeof zarinpalFormSchema>) => {
    setIsSubmitting(true)
    await fetch(`${process.env.NEXT_PUBLIC_BACK_API_URL}/payments/zarinpal`, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      credentials: "include",
      body: JSON.stringify(values),
    })
      .then(async (res) => {
        if (res.ok) {
          toast({
            title: t("success"),
          });
          return;
        }

        const json = (await res.json()) as ExceptionMessage;
        const errMessage = t_ec(json.code);
        toast({
          title: errMessage,
        });
      })
      .catch((err) => {
        toast({
          title: t_ec("CHECK_CONNECTION"),
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  if (isZarinpalLoading) {
    return <LoadingSpinner className="h-full" />;
  }

  return (
    <div className="flex h-full">
      <div className="w-3/5 h-full"> 
        <Card className="border-l-2 border-gray-100 h-full p-6">
          <div className="mb-6">
            <h2 className="font-semibold text-primary mb-1">{t("title")}</h2>
            <p className="text-[15px] text-muted-foreground">{t("description")}</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="merchantCode"
                  render={({ field, fieldState: { error } }) => (
                    <FormItem>
                      <FormLabel>{t("merchantCode.label")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      {error && (
                        <ErrorMessage>
                          {t("merchantCode.Errors.required")}
                        </ErrorMessage>
                      )}
                    </FormItem>
                  )}
                />
              </div>
              <div className="mt-6">
                <LoadingButton
                  isLoading={isSubmitting}
                  className="w-full"
                  variant={"success"}
                >
                  {t("save")}
                </LoadingButton>
              </div>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}
