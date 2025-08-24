"use client";

import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import { ErrorMessage } from "@/components/index";
import useSWRImmutable from "swr/immutable";
import { toast } from "@/components/ui-custom/use-toast";
import { ExceptionMessage } from "@/types/exceptionMessage";
import LoadingSpinner from "@/components/ui-custom/LoaderSpin";
import useUser from "@/hooks/useUser";
import api from "@/hooks/swr/api-client";
import { AxiosError } from "axios";
import { mutate } from "swr";

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
  } = useSWRImmutable(`/payments/zarinpal`);

  useEffect(() => {
    if (zarinpal) {
      form.reset({ ...zarinpal });
    }
  }, [zarinpal]);

  const onSubmit = async (values: z.infer<typeof zarinpalFormSchema>) => {
    setIsSubmitting(true);
    await api.post(`/payments/zarinpal`, values)
      .then(async res => {
        toast({
          title: t("success"),
        });
        await mutate('/payments/methods');
      })
      .catch((e: AxiosError<ExceptionMessage>) => {
        toast({
          title: t_ec(e.response?.data?.code),
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  if (isZarinpalLoading) {
    return (
      <div className="flex h-full">
        <div className="w-full sm:w-3/5 h-full">
          <Card className="border-l-2 border-gray-100 h-full w-full p-6">
            <LoadingSpinner className="h-full" />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="sm:w-3/5 h-full">
        <Card className="border-l-2 border-gray-100 h-full p-6">
          <div className="mb-6">
            <h2 className="font-semibold text-primary mb-1">{t("title")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("description")}
            </p>
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
                <LoadingButton isLoading={isSubmitting} className="w-full">
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
