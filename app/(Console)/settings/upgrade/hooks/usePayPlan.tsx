import { toast } from "@/components/ui/use-toast";
import { ExceptionMessage } from "@/types/exceptionMessage";
import { SubscriptionNamespace } from "@/types/subscriptions/subscription.namspace";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { UpgradeContext } from "../context/upgrade.context";
import { mutate } from "swr";
import { mutateIncludeStringKey } from "@/app/utils/mutateIncludeStringKey";
import api from "@/hooks/swr/api-client";
import { AxiosError, AxiosResponse } from "axios";

export default function usePayPlan() {
  const [isPayLoading, setIsPayLoading] = useState<boolean>(false);
  const router = useRouter();
  const t_ec = useTranslations("ERROR_CODES");
  const t_rc = useTranslations("RESPONSE_CODES");

  const pay = async (
    values: { planId: number; durationId: number, discountCode?: string },
    setActive: UpgradeContext["setActive"]
  ) => {
    setIsPayLoading(true);
    await api
      .post("/subscriptions/subscribe", values)
      .then(
        async (res: AxiosResponse<SubscriptionNamespace.POST.Subscribe>) => {
          if (res.data.code === "PAID_FREE") {
            toast({
              title: t_rc(res.data.code),
            });
            await mutate(mutateIncludeStringKey("subscriptions"));
            mutate(mutateIncludeStringKey("plans"));
            setActive({
              planSelection: false,
              subscriptionInfo: true,
            });
            return;
          }
          router.push(res.data.data.link);
          return;
        }
      )
      .catch(async (e: AxiosError<ExceptionMessage>) => {
        const error = t_ec(e.response?.data.code);
        toast({
          title: error,
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsPayLoading(false);
      });
  };

  return {
    isPayLoading,
    pay,
  };
}
