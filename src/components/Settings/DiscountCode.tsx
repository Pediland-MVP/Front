"use client";

import api from "@/hooks/swr/api-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
// TODO: Refactor Types & Schemas
import { useSubscriptionStore } from "@/store/subscriptionStore";

import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  Input,
} from "@components";
import { CheckIcon, TicketIcon, XIcon } from "lucide-react";

const schema = z.object({
  code: z.string().min(1),
});

export const DiscountCode = () => {
  const t = useTranslations("UpdateReferralCode");
  const t_ec = useTranslations("ERROR_CODES");
  const [isCodeSubmitting, setIsCodeSubmitting] = useState(false);

  const {
    active,
    setActive,
    plans,
    subscriptions,
    isLoading: isSubscriptionsLoading,
    discountCode,
    setDiscountCode,
  } = useSubscriptionStore();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setIsCodeSubmitting(true);

    try {
      const res = await api.get(`/plans?discountCode=${values.code}`);
      setDiscountCode(values.code);
    } catch (error) {
      toast.error(t_ec(error?.response?.data?.code));
    } finally {
      setIsCodeSubmitting(false);
    }
  };

  return (
    <div className="flex w-full items-center justify-center md:justify-start">
      {active.showCoupon ? (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 items-center gap-2 md:flex-row md:items-start"
          >
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => {
                return (
                  <FormItem className="flex-1 md:flex-0">
                    <FormControl>
                      <Input
                        type="text"
                        placeholder={t("Code.placeholder")}
                        className="rounded-full md:h-9 md:min-w-[240px]"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                );
              }}
            />
            <Button
              type="button"
              size="icon"
              onClick={form.handleSubmit(onSubmit)}
              className="rounded-full bg-green-600/90 hover:bg-green-600 [&_svg:not([class*='size-'])]:size-5"
              disabled={isCodeSubmitting}
            >
              <CheckIcon />
            </Button>

            <Button
              type="button"
              variant={"outline"}
              size="icon"
              className="rounded-full [&_svg:not([class*='size-'])]:size-5"
              disabled={isCodeSubmitting}
              onClick={() =>
                setActive({
                  ...active,
                  showCoupon: false,
                })
              }
            >
              <XIcon />
            </Button>
          </form>
        </Form>
      ) : (
        <Button
          variant={"link"}
          onClick={() =>
            setActive({
              ...active,
              showCoupon: true,
            })
          }
        >
          <TicketIcon />
          {t("have_coupon")}
        </Button>
      )}
    </div>
  );
};
