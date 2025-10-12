"use client";

import { useTranslations } from "next-intl";
import { SubscriptionStatusEnum } from "@/types/subscriptions/enums/subscriptionStatus.enum";
import { useUpgradeContext } from "../context/upgrade.context";
import { useCallback, useEffect, useState } from "react";
// UI
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ClockCounterClockwise } from "@phosphor-icons/react/dist/ssr";

import { ProgressRadial } from "@components";

export default function SubscriptionInfo() {
  const t = useTranslations("Upgrade.Subscriptions");

  const { subscriptions, active, setActive, plans } = useUpgradeContext();

  const activeSubscription = subscriptions?.find(
    (sub) => sub.status === SubscriptionStatusEnum.ACTIVE,
  );

  const reservedSubscriptions = subscriptions?.filter(
    (sub) => sub.status === SubscriptionStatusEnum.RESERVED,
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

  const getPlanById = (planId: number) => {
    return plans?.find((plan) => plan.id === planId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "reserved":
        return "bg-blue-500";
      case "expired":
        return "bg-red-500";
      case "pending":
        return "bg-yellow-500";
      case "cancelled":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!active.subscriptionInfo) {
    return null;
  }

  return (
    <div className="_subscription-info-page flex h-full rounded-t-3xl bg-white md:rounded-t-none">
      <div className="h-full w-full sm:w-3/5">
        <div className="h-full border-gray-100 p-6 md:border-l-2">
          <div className="mb-6">
            <h2 className="text-primary mb-1 font-semibold">{t("title")}</h2>
            <p className="text-muted-foreground text-sm">
              {t("subscriptionStatus")}
            </p>
          </div>

          <div className="_wrapper">
            {activeSubscription ? (
              <div className="_active-subscription mb-6">
                <h3 className="mb-3 text-base font-semibold">
                  {t("activeSubscription")}
                </h3>
                <div className="_subscription-card flex items-center justify-between rounded-lg border-2 border-green-200 bg-green-50/50 p-4">
                  <div className="_info flex flex-col gap-2 text-sm text-green-700">
                    <div className="flex items-center gap-1">
                      <span>وضعیت:</span>
                      <span>{t(activeSubscription.status)}</span>
                    </div>
                    {getPlanById(activeSubscription.planDuration.planId)
                      ?.name && (
                      <div className="flex items-center gap-1">
                        <span>نوع اشتراک:</span>
                        <span>
                          {
                            getPlanById(activeSubscription.planDuration.planId)
                              ?.name
                          }
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <span>مدت اشتراک:</span>
                      <span>{activeSubscription.planDuration.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>زمان باقی مانده:</span>
                      <span>
                        {remainingDays === 1 || remainingDays === 0
                          ? t("lastDay")
                          : `${getRemainingDays(activeSubscription.expire!)} روز`}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <ProgressRadial
                      percentage={
                        (getRemainingDays(activeSubscription.expire!) /
                          activeSubscription.planDuration.durationDays) *
                        100
                      }
                      size={isMobile ? 90 : 100}
                      strokeWidth={10}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p>{t("noActiveSubscription")}</p>
            )}

            {reservedSubscriptions?.length ? (
              <div className="_reserved-subscription mb-6">
                <h3 className="mb-1 text-base font-semibold">
                  {t("reservedSubscriptions")}
                </h3>
                <p className="text-muted-foreground mb-3 text-sm">
                  اشتراک‌های زیر به ترتیب اولویت و بعد از اتمام اشتراک فعال شما،
                  فعال خواهند شد.
                </p>
                {reservedSubscriptions?.map((sub, index) => (
                  <div
                    className="_subscription-card mb-4 flex items-center justify-between rounded-lg border-2 border-stone-200/80 bg-stone-50/50 p-4 last:mb-0"
                    key={sub.id}
                  >
                    <div className="_info flex flex-col gap-2 text-sm text-stone-500">
                      <div className="flex items-center gap-1">
                        <span>نوع اشتراک:</span>
                        <span>
                          {getPlanById(sub.planDuration.planId)?.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>مدت اشتراک:</span>
                        <span>{sub.planDuration.name}</span>
                      </div>
                    </div>
                    <Badge
                      className={`${getStatusColor(sub.status)} rounded-full px-3 py-1 text-white`}
                    >
                      {t(sub.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : null}

            <Button
              variant={"link"}
              size={"lg"}
              onClick={() =>
                setActive({ subscriptionInfo: false, planSelection: true })
              }
            >
              <ClockCounterClockwise className="h-6 w-6" />
              {t("reserve")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
