"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";
// TODO: Should Refactor
import { useSubscriptionStore } from "@/store/subscriptionStore";
import { SubscriptionStatusEnum } from "@/types/subscriptions/enums/subscriptionStatus.enum";

import {
  Button,
  CardContent,
  CardSimple,
  LoaderPulse,
  ProgressRadial,
} from "@components";
import { ChevronLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export const SubscriptionBoard = () => {
  const router = useRouter();
  const t = useTranslations("Console.Dashboard");
  
  const {
    active,
    setActive,
    plans,
    subscriptions,
    isLoading: isSubscriptionsLoading,
    discountCode,
    setDiscountCode,
  } = useSubscriptionStore();

  const activeSubscription = subscriptions?.find(
    (sub) => sub.status === SubscriptionStatusEnum.ACTIVE,
  );

  const getRemainingDays = useCallback((expireDate: string) => {
    const now = new Date();
    const expire = new Date(expireDate);
    const diffTime = expire.getTime() - now.getTime();

    return Math.ceil(diffTime / (1000 * 3600 * 24));
  }, []);

  const remainingDays = activeSubscription
    ? getRemainingDays(activeSubscription.expire)
    : 0;

  const remainingPercentage = activeSubscription
    ? (getRemainingDays(activeSubscription.expire) /
        activeSubscription.planDuration.durationDays) *
      100
    : 0;

  return (
    <CardSimple>
      <CardContent className="p-3 md:p-5">
        <div className="flex items-center gap-4">
          <ProgressRadial
            percentage={isSubscriptionsLoading ? 0 : remainingDays}
            size={100}
            strokeWidth={10}
            type="days"
            totalDays={activeSubscription?.planDuration?.durationDays}
          />
          <div className="text-secondary flex flex-1 flex-col justify-center">
            <div className="text-muted-foreground text-[13px]">
              {t("remainingDays")}
            </div>
            <div className="text-gradient flex items-center gap-1 text-xl font-bold">
              {isSubscriptionsLoading ? <LoaderPulse /> : remainingDays}
              <span>{t("day")}</span>
            </div>
          </div>
          <div>
            <Button
              variant="link"
              size="sm"
              className="gap-0 !px-0 text-xs"
              onClick={() => router.push("/settings/subscription")}
            >
              {t("view")}
              <ChevronLeftIcon />
            </Button>
          </div>
        </div>
      </CardContent>
    </CardSimple>
  );
};
