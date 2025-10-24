"use client";

import api from "@/hooks/swr/api-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useSubscriptionContext } from "@/app/(Console)/settings/subscription/context/SubscriptionContext";
// TODO: Refactor Types & Schemas
import { ExceptionMessage } from "@/types/exceptionMessage";

import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  Input,
} from "@components";

export const DiscountCode = () => {
  const schema = z.object({
    code: z.string().min(1),
  });
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {},
  });

  const t = useTranslations("UpdateReferralCode");
  const t_ec = useTranslations("ERROR_CODES");

  const { setDiscountCode, setActive } = useSubscriptionContext();

  const deleteCode = () => {
    setDiscountCode("");
    form.setValue("code", "");
    setActive({
      choosePlan: true,
      subscriptionInfo: false,
    });
  };

  const onSubmit = (values: z.infer<typeof schema>) => {
    api
      .get(`/plans?discountCode=${values.code}`)
      .then((res) => {
        setDiscountCode(values.code);
      })
      .catch((e: AxiosError<ExceptionMessage>) => {
        toast.error(t_ec(e?.response?.data.code));
      });
    setActive({
      choosePlan: true,
      subscriptionInfo: false,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => {
            return (
              <FormItem>
                <FormControl>
                  <Input
                    type="text"
                    placeholder={t("Code.placeholder")}
                    className="min-w-[200px]"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            );
          }}
        />
        <Button
          type="button"
          onClick={form.handleSubmit(onSubmit)}
          className="bg-green-600"
        >
          {t("update")}
        </Button>
        <Button type="button" variant={"outline"} onClick={deleteCode}>
          {t("delete")}
        </Button>
      </form>
    </Form>
  );
};
