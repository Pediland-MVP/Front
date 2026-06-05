"use client";

import api from "@/hooks/swr/api-client";
import { ExceptionMessage } from "@/types/exceptionMessage";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { mutate } from "swr";
import useSWRImmutable from "swr/immutable";
import { z } from "zod";

import { ButtonLoading } from "@/components/ui-custom/ButtonLoading";
import { ErrorMessage } from "@/components/ui-custom/ErrorMessage";
import { LoaderSpin } from "@/components/ui-custom/LoaderSpin";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

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
    await api
      .post(`/payments/zarinpal`, values)
      .then(async (res) => {
        toast.success(t("success"));
        await mutate("/payments/methods");
      })
      .catch((e: AxiosError<ExceptionMessage>) => {
        toast.error(t_ec(e.response?.data?.code));
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <div className="flex h-full rounded-t-3xl bg-white md:rounded-t-none">
      <div className="h-full w-full sm:w-3/5">
        <div className="h-full border-gray-100 p-6 md:border-l-2">
          {isZarinpalLoading ? (
            <LoaderSpin />
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-primary mb-1 font-semibold">
                  {t("title")}
                </h2>
                <p className="text-muted-foreground text-sm">
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
                    <ButtonLoading isLoading={isSubmitting} className="w-full">
                      {t("save")}
                    </ButtonLoading>
                  </div>
                </form>
              </Form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
