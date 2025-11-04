"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
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
import { PlugsConnectedIcon, PlugsIcon } from "@phosphor-icons/react/dist/ssr";

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;
const INSTAGRAM_CLIENT_ID = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID;

export const SubscriptionBoard = () => {
  const router = useRouter();
  const t = useTranslations("Console.Dashboard");
  const { user } = useUser();
  const [isMobile, setIsMobile] = useState(false);

  const {
    subscriptions,
    isLoading: isSubscriptionsLoading,
    totalRemainingDays,
    totalPurchasedDays,
  } = useSubscriptionStore();

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  const activeSubscription = subscriptions?.find(
    (sub) => sub.status === SubscriptionStatusEnum.ACTIVE,
  );

  const expiredSubscription = subscriptions?.find(
    (sub) => sub.status === SubscriptionStatusEnum.EXPIRED,
  );

  const currentSubscription = activeSubscription || expiredSubscription;
  const instagramValid = user?.instagrams?.[0]?.isIgTokenValid;
  const hasActiveSubscription =
    currentSubscription?.status === SubscriptionStatusEnum.ACTIVE
      ? true
      : false;

  if (isSubscriptionsLoading || activeSubscription?.type === "credit")
    return null;

  return (
    <CardSimple>
      <CardContent className="p-3 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-5">
          <div className="flex w-full items-center gap-3 md:gap-5">
            <div>
              <ProgressRadial
                percentage={
                  isSubscriptionsLoading
                    ? 0
                    : currentSubscription?.type === "credit"
                      ? currentSubscription?.credit
                      : totalRemainingDays
                }
                size={isMobile ? 85 : 95}
                strokeWidth={isMobile ? 8 : 9}
                type={
                  currentSubscription?.type === "credit" ? "credit" : "days"
                }
                totalDays={totalPurchasedDays}
              />
            </div>
            <div className="text-secondary flex-1 text-sm">
              <div className="mb-1.5 font-semibold">
                {user?.firstname} {user?.lastname}، خوش آمدید!
              </div>
              <div className="mb-1 flex items-center gap-1">
                <span className="text-muted-foreground">همراه:</span>
                <span className="font-semibold tracking-wider">
                  {user?.mobile}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span
                  className={cn(
                    "text-muted-foreground",
                    !instagramValid && "text-destructive",
                  )}
                >
                  اینستاگرام:
                </span>
                <span
                  className={cn(
                    "line-clamp-1 flex-1 font-semibold tracking-wider md:ml-1 md:flex-initial",
                    !instagramValid && "text-destructive",
                  )}
                >
                  {user?.instagrams?.[0]?.username}
                </span>
                {instagramValid ? (
                  <PlugsConnectedIcon
                    size={22}
                    weight="duotone"
                    className="text-green-600"
                  />
                ) : (
                  <PlugsIcon
                    size={22}
                    weight="duotone"
                    className="text-destructive"
                  />
                )}
              </div>

              {/* <div className="flex items-center gap-1">
                <span className="text-muted-foreground">نوع اشتراک:</span>
                <span
                  className={cn(
                    "font-medium",
                    !hasActiveSubscription && "text-muted-foreground",
                  )}
                >
                  {isSubscriptionsLoading ? (
                    <LoaderPulse />
                  ) : currentSubscription?.type === "credit" ? (
                    "رایـگـان"
                  ) : (
                    currentSubscription?.planDuration?.name
                  )}
                </span>

                <div className="flex items-center gap-1">
                  {isSubscriptionsLoading ? (
                    <LoaderPulse />
                  ) : hasActiveSubscription ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <CircleIcon
                        size={10}
                        weight="fill"
                        className={cn("animate-pulse")}
                      />
                      فعال
                    </div>
                  ) : (
                    <div className="text-destructive flex items-center gap-1">
                      <CircleIcon
                        size={10}
                        weight="fill"
                        className={cn("animate-pulse")}
                      />
                      غیرفعال
                    </div>
                  )}
                </div>
              </div> */}
            </div>
          </div>
          <div>
            {instagramValid ? (
              <Button
                size="md"
                className="w-full"
                onClick={() => router.push("/settings/subscription")}
              >
                {hasActiveSubscription ? "جـزئـیـات" : "تمدید اشتراک"}
              </Button>
            ) : (
              <Button
                size="md"
                className="bg-destructive/90 hover:bg-destructive w-full text-white"
                onClick={() =>
                  router.push(
                    `https://www.instagram.com/oauth/authorize?client_id=${INSTAGRAM_CLIENT_ID}&redirect_uri=${API_URL}/instagram/redirectToFrontend&response_type=code&scope=instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments`,
                  )
                }
              >
                ورود مجدد
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </CardSimple>
  );
};
