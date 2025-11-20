"use client";

import { useLogout } from "@/hooks/swr/api-client";
import useUser from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import { useSubscriptionStore } from "@/store/subscriptionStore";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

// TODO: Refactor Types & Schemas
import { SubscriptionStatusEnum } from "@/types/subscriptions/enums/subscriptionStatus.enum";

import {
  PlugsConnectedIcon,
  PlugsIcon,
  SignOutIcon,
  UserCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { ProgressLine } from "../Console/ProgressLine";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  CardContent,
} from "../ui";
import { ButtonLoading } from "../ui-custom/ButtonLoading";
import { CardSimple } from "../ui-custom/CardSimple";

export const UserDetailsCard = () => {
  const router = useRouter();
  const pathname = usePathname();
  const logout = useLogout();
  const t = useTranslations("Console.Dashboard");
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);

  const {
    user: userData,
    error: userError,
    isLoading: userIsLoading,
  } = useUser();

  const {
    subscriptions,
    isLoading: isSubscriptionsLoading,
    totalRemainingDays,
    totalPurchasedDays,
  } = useSubscriptionStore();

  const activeSubscription = useMemo(() => {
    if (!subscriptions?.length) return undefined;

    return subscriptions?.find(
      (sub) => sub.status === SubscriptionStatusEnum.ACTIVE,
    );
  }, [subscriptions]);

  const expiredSubscription = useMemo(() => {
    if (!subscriptions?.length) return undefined;

    return subscriptions?.find(
      (sub) => sub.status === SubscriptionStatusEnum.EXPIRED,
    );
  }, [subscriptions]);

  const currentSubscription = activeSubscription || expiredSubscription;
  const instagramValid = userData?.instagrams?.[0]?.isIgTokenValid;
  const hasActiveSubscription =
    currentSubscription?.status === SubscriptionStatusEnum.ACTIVE
      ? true
      : false;

  const logoutHandler = async () => {
    setIsLogoutLoading(true);

    try {
      await logout();
      const subStore = useSubscriptionStore.getState();
      subStore.setSubscriptions([]);
      subStore.setPlans([]);
      subStore.setPlansData(undefined);
      router.replace("/auth");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLogoutLoading(false);
    }
  };

  return (
    <CardSimple className="border-dashed border-blue-300/70 bg-linear-to-t from-white/85 to-white/50">
      <CardContent className="flex flex-col gap-1.5 p-3">
        {!isSubscriptionsLoading && (
          <div className="text-secondary flex flex-col pb-1 text-[13px]">
            {/* <div className="mb-1 flex items-center justify-between">
                <div
                  className={cn(
                    "flex items-center gap-1 text-green-600",
                    hasActiveSubscription
                      ? "text-green-600"
                      : "text-destructive",
                  )}
                >
                  <CircleIcon
                    size={10}
                    weight="fill"
                    className="animate-pulse"
                  />

                  {hasActiveSubscription ? (
                    <span>اشتراک فعال است</span>
                  ) : (
                    <span>اشتراک فعال ندارید</span>
                  )}
                </div>

                <span className="text-muted-foreground">نوع اشتراک:</span>
                <span
                  className={cn(
                    "flex-1",
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
              </div> */}

            {activeSubscription?.type !== "credit" && (
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">مانده اعتبار:</span>
                  <span
                    className={cn(
                      "text-primary",
                      !hasActiveSubscription && "text-muted-foreground",
                    )}
                  >
                    {currentSubscription?.type === "credit"
                      ? `${currentSubscription?.credit} پیام`
                      : `${totalRemainingDays} روز`}
                  </span>
                </div>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto gap-0 px-0!"
                  onClick={() => router.push("/settings/subscription")}
                >
                  تـمـدیـد
                  {/* {hasActiveSubscription ? "جـزئـیـات" : "خرید اشتراک"} */}
                </Button>
              </div>
            )}

            <div className="mb-1 flex items-center gap-1">
              <span className="text-muted-foreground">همراه:</span>
              <span className="tracking-wider">{userData?.mobile}</span>
            </div>

            <div className="mb-2 flex items-center gap-1">
              <div className="flex items-center gap-1">
                <span
                  className={cn(
                    "text-muted-foreground",
                    !instagramValid && "text-destructive",
                  )}
                >
                  اینستاگرام:
                </span>
              </div>
              <span
                className={cn(
                  "line-clamp-1 flex-1 font-semibold tracking-wider",
                  !instagramValid && "text-destructive",
                )}
              >
                {userData?.instagrams?.[0]?.username}
              </span>
              {instagramValid ? (
                <PlugsConnectedIcon
                  size={20}
                  weight="duotone"
                  className="text-green-600"
                />
              ) : (
                <PlugsIcon
                  size={20}
                  weight="duotone"
                  className="text-destructive"
                />
              )}
            </div>

            <ProgressLine
              percentage={isSubscriptionsLoading ? 0 : totalRemainingDays}
              height={5}
              type="days"
              totalDays={totalPurchasedDays}
            />
          </div>
        )}

        <div className="text-secondary flex items-center">
          <div className="flex flex-1 items-center gap-1 text-[13px]">
            <Avatar className="h-6 w-6 rounded-lg border-0 duration-300 focus-within:ring-0">
              <AvatarImage src={undefined} alt={userData.firstname} />
              <AvatarFallback className="bg-transparent">
                <UserCircleIcon size={28} weight="duotone" />
              </AvatarFallback>
            </Avatar>
            <span className="truncate font-medium">
              {userData.firstname} {userData.lastname}
            </span>
          </div>
          <ButtonLoading
            variant="ghost"
            isLoading={isLogoutLoading}
            className="h-auto !p-0 [&_svg:not([class*='size-'])]:size-5"
            onClick={logoutHandler}
          >
            {isLogoutLoading ? (
              ""
            ) : (
              <SignOutIcon className="rotate-180" size={20} />
            )}
          </ButtonLoading>
        </div>
      </CardContent>
    </CardSimple>
  );
};
