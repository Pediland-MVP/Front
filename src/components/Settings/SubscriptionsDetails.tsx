"use client";

import { useSubscriptionStore } from "@/store/subscriptionStore";
import { SubscriptionStatusEnum } from "@/types/subscriptions/enums/subscriptionStatus.enum";
import { useTranslations } from "next-intl";
import { CardSimple, LoaderPulse } from "../ui-custom";
import { Button, CardContent } from "../ui";
import { ProgressRadial } from "../Console";
import { useCallback } from "react";
import { Badge, ClockIcon } from "lucide-react";
import { toJalaliDate } from "@/utils/jalali";
import { formatNumber } from "@/utils/formatNumber";
import {
  CircleIcon,
  ClockCountdownIcon,
  PackageIcon,
} from "@phosphor-icons/react/dist/ssr";

export const SubscriptionsDetails = () => {
  const t = useTranslations("Subscription");

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

  const remainingPercentage = activeSubscription
    ? (getRemainingDays(activeSubscription.expire) /
        activeSubscription.planDuration.durationDays) *
      100
    : 0;

  const labelClass = "text-muted-foreground text-sm font-me";

  if (!active.subscriptionInfo) return null;

  return (
    <div className="space-y-3">
      {activeSubscription ? (
        <CardSimple className="border-violet-200 bg-violet-50/50">
          <CardContent className="flex flex-col gap-2 p-4 text-[15px] md:p-5">
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className={labelClass}>وضعیت:</span>
                  <span className="text-primary flex items-center gap-1 font-semibold">
                    {t(activeSubscription.status)}
                  </span>
                  <CircleIcon
                    size={10}
                    weight="fill"
                    className="animate-pulse text-green-500"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={labelClass}>نوع اشتراک:</span>
                  <span className="text-primary font-semibold">
                    {activeSubscription.planDuration.name}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={labelClass}>تاریخ شروع:</span>
                  <span className="text-primary font-semibold">
                    {toJalaliDate(activeSubscription.planDuration.createDate)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={labelClass}>قیمت بسته:</span>
                  <span className="text-primary font-semibold">
                    {formatNumber(activeSubscription.planDuration.price)}{" "}
                    تـومـان
                  </span>
                </div>
              </div>
              <ProgressRadial
                percentage={isSubscriptionsLoading ? 0 : remainingDays}
                size={100}
                strokeWidth={10}
                type="days"
                totalDays={activeSubscription.planDuration.durationDays}
              />
            </div>
          </CardContent>
        </CardSimple>
      ) : (
        <p className="text-muted-foreground text-sm">
          {t("no_active_subscription")}
        </p>
      )}

      {reservedSubscriptions?.length > 0 && (
        <div className="_reserved-subscription mt-6">
          <div className="text-secondary mb-3 flex items-center gap-1.5">
            <div>
              <ClockCountdownIcon size={20} />
            </div>
            <p className="text-sm">
              اشتراک‌های زیر پس از اتمام اشتراک فعال به ترتیب اولویت فعال خواهند
              شد.
            </p>
          </div>

          <div className="grid md:grid-cols-2">
            {reservedSubscriptions?.map((sub, index) => (
              <CardSimple
                className="border-dashed border-blue-200/80 bg-blue-50/50"
                key={sub.id}
              >
                <CardContent className="text-secondary/70 flex flex-col gap-1 p-4 text-[15px] md:p-5">
                  <div className="flex items-center gap-1.5">
                    <span className={labelClass}>وضعیت:</span>
                    <span className="font-medium">{t(sub.status)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={labelClass}>نوع اشتراک:</span>
                    <span className="font-medium">{sub.planDuration.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={labelClass}>قیمت بسته:</span>
                    <span className="font-medium">
                      {formatNumber(sub.planDuration.price)} تـومـان
                    </span>
                  </div>
                </CardContent>
              </CardSimple>
            ))}
          </div>
        </div>
      )}

      <Button
        variant={"outline"}
        onClick={() => setActive({ subscriptionInfo: false, choosePlan: true })}
        className="w-full md:w-auto"
      >
        <ClockIcon />
        {t("reserve")}
      </Button>
    </div>
  );
};
