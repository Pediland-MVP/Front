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
import useUser from "@/hooks/useUser";
import { CircleIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export const SubscriptionBoard = () => {
  const router = useRouter();
  const t = useTranslations("Console.Dashboard");
  const { user } = useUser();

  const { subscriptions, isLoading: isSubscriptionsLoading } =
    useSubscriptionStore();

  console.log("subscriptions", subscriptions);
  const activeSubscription = subscriptions?.find(
    (sub) => sub.status === SubscriptionStatusEnum.ACTIVE,
  );

  const expiredSubscription = subscriptions?.find(
    (sub) => sub.status === SubscriptionStatusEnum.EXPIRED,
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

  if (isSubscriptionsLoading) return null;

  return (
    <CardSimple>
      <CardContent className="p-3 md:p-5">
        <div className="flex items-center gap-3 md:gap-5">
          <div>
            <ProgressRadial
              percentage={isSubscriptionsLoading ? 0 : remainingDays}
              size={90}
              strokeWidth={10}
              type="days"
              totalDays={activeSubscription?.planDuration?.durationDays}
            />
          </div>
          <div className="w-full">
            <div className="text-secondary mb-1 text-[13px] font-semibold md:text-sm">
              {user?.firstname} {user?.lastname}، خوش آمدید!
            </div>
            <div className="flex w-full items-center">
              <div className="text-secondary flex flex-1 flex-col gap-0.5 text-[13px] md:gap-1 md:text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">همراه:</span>
                  <span className="font-semibold tracking-wider">
                    {user?.mobile}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">نوع اشتراک:</span>
                  <span className="font-medium">
                    {isSubscriptionsLoading ? (
                      <LoaderPulse />
                    ) : (
                      activeSubscription?.planDuration?.name || "ندارید"
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">وضعیت:</span>
                  {isSubscriptionsLoading ? (
                    <LoaderPulse />
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">
                        {activeSubscription?.status ===
                        SubscriptionStatusEnum.ACTIVE
                          ? "فعال"
                          : "غیرفعال"}
                      </span>
                      <CircleIcon
                        size={10}
                        weight="fill"
                        className={cn(
                          activeSubscription?.status ===
                            SubscriptionStatusEnum.ACTIVE
                            ? "animate-pulse text-green-500"
                            : "text-gray-400/80",
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Button
                  variant="link"
                  size="sm"
                  className="gap-0 !px-0"
                  onClick={() => router.push("/settings/subscription")}
                >
                  {activeSubscription?.status === SubscriptionStatusEnum.ACTIVE
                    ? "جـزئـیـات"
                    : "تمدید"}
                  <ChevronLeftIcon />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </CardSimple>
  );
};
