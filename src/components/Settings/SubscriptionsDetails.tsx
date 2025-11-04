"use client";

import { useSubscriptionStore } from "@/store/subscriptionStore";
import { SubscriptionStatusEnum } from "@/types/subscriptions/enums/subscriptionStatus.enum";
import { formatNumber } from "@/utils/formatNumber";
import { toJalaliDate } from "@/utils/jalali";
import { useTranslations } from "next-intl";

import {
  Button,
  CardContent,
  CardSimple,
  LoaderSpin,
  ProgressRadial,
} from "@components";
import { CircleIcon, ClockCountdownIcon } from "@phosphor-icons/react/dist/ssr";
import { ClockIcon, ShoppingCartIcon } from "lucide-react";

export const SubscriptionsDetails = () => {
  const t = useTranslations("Subscription");

  const {
    active,
    setActive,
    subscriptions,
    isLoading: isSubscriptionsLoading,
    totalRemainingDays,
    totalPurchasedDays,
  } = useSubscriptionStore();

  const activeSubscription = subscriptions?.find(
    (sub) => sub.status === SubscriptionStatusEnum.ACTIVE,
  );

  const reservedSubscriptions = subscriptions?.filter(
    (sub) => sub.status === SubscriptionStatusEnum.RESERVED,
  );

  const labelClass = "text-muted-foreground text-sm font-me";

  if (!active.subscriptionInfo) return null;

  if (isSubscriptionsLoading || !subscriptions) return <LoaderSpin />;

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
                    {activeSubscription.type === "credit"
                      ? "300 پیام رایگان"
                      : activeSubscription.planDuration.name}
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
                percentage={
                  isSubscriptionsLoading
                    ? 0
                    : activeSubscription?.type === "credit"
                      ? activeSubscription?.credit
                      : totalRemainingDays
                }
                size={100}
                strokeWidth={10}
                type={activeSubscription?.type === "credit" ? "credit" : "days"}
                totalDays={totalPurchasedDays}
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

          <div className="grid gap-3 md:grid-cols-2">
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

      {activeSubscription ? (
        <Button
          variant={"outline"}
          onClick={() =>
            setActive({ subscriptionInfo: false, choosePlan: true })
          }
          className="w-full md:w-auto"
        >
          <ClockIcon />
          {t("reserve_subscription")}
        </Button>
      ) : (
        <Button
          onClick={() =>
            setActive({ subscriptionInfo: false, choosePlan: true })
          }
          className="w-full md:w-auto"
        >
          <ShoppingCartIcon />
          {t("buy_subscription")}
        </Button>
      )}
    </div>
  );
};
