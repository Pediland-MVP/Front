"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";
// TODO: Should Refactor
import { useUpgradeContext } from "@/app/(Console)/settings/upgrade/context/upgrade.context";
import { SubscriptionStatusEnum } from "@/types/subscriptions/enums/subscriptionStatus.enum";

import {
  Button,
  CardContent,
  CardSimple,
  LoaderPulse,
  ProgressRadial,
} from "@components";
import { ChevronLeftIcon } from "lucide-react";

export const SubscriptionBoard = () => {
  const t = useTranslations("Console.Dashboard");
  const { subscriptions, isLoading } = useUpgradeContext();

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
            percentage={isLoading ? 0 : remainingPercentage}
            size={70}
            strokeWidth={9}
          />
          <div className="text-secondary flex flex-1 flex-col justify-center">
            <div className="text-muted-foreground text-[13px]">
              {t("remainingDays")}
            </div>
            <div className="text-gradient flex items-center gap-1 text-xl font-bold">
              {isLoading ? <LoaderPulse /> : remainingDays}
              <span>{t("day")}</span>
            </div>
          </div>
          <div>
            <Button variant="link" size="sm" className="gap-0 !px-0 text-xs">
              {t("view")}
              <ChevronLeftIcon />
            </Button>
          </div>
        </div>
      </CardContent>
    </CardSimple>
  );
};
