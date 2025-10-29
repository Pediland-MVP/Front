"use client";

import { useLogout } from "@/hooks/swr/api-client";
import useUser from "@/hooks/useUser";
import { useSubscriptionStore } from "@/store/subscriptionStore";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";

// TODO: Refactor Types & Schemas
import { SubscriptionStatusEnum } from "@/types/subscriptions/enums/subscriptionStatus.enum";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  ButtonLoading,
  CardContent,
  CardSimple,
  LoaderPulse,
  ProgressLine,
} from "@components";
import {
  CircleIcon,
  PlugsConnectedIcon,
  PlugsIcon,
  SignOutIcon,
  UserCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

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

  const expiredSubscription = subscriptions?.find(
    (sub) => sub.status === SubscriptionStatusEnum.EXPIRED,
  );

  const currentSubscription = activeSubscription || expiredSubscription;
  const instagramValid = userData?.instagrams?.[0]?.isIgTokenValid;
  const hasActiveSubscription =
    currentSubscription?.status === SubscriptionStatusEnum.ACTIVE
      ? true
      : false;

  const getRemainingDays = useCallback((expireDate: string) => {
    const now = new Date();
    const expire = new Date(expireDate);
    const diffTime = expire.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 3600 * 24));
  }, []);

  const remainingDays = currentSubscription
    ? Math.max(0, getRemainingDays(currentSubscription.expire))
    : 0;

  const logoutHandler = async () => {
    setIsLogoutLoading(true);

    try {
      const success = await logout();
      if (success) {
        router.push(process.env.NEXT_PUBLIC_LANDING_URL || "/auth");
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLogoutLoading(false);
    }
  };

  return (
    <CardSimple className="border-dashed border-blue-300/70 bg-gradient-to-t from-white/80 to-white/50">
      <CardContent className="flex flex-col gap-1.5 p-3">
        {pathname !== "/" &&
          !isSubscriptionsLoading &&
          activeSubscription?.type !== "credit" && (
            <div className="text-secondary flex flex-col pb-1 text-[13px]">
              <div className="mb-1 flex items-center justify-between">
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

                <Button
                  variant="link"
                  size="sm"
                  className="h-auto gap-0 !px-0"
                  onClick={() => router.push("/settings/subscription")}
                >
                  {hasActiveSubscription ? "جـزئـیـات" : "خرید اشتراک"}
                </Button>
              </div>

              <div className="mb-1 flex items-center gap-1">
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
                <span
                  className={cn(
                    "text-primary",
                    !hasActiveSubscription && "text-muted-foreground",
                  )}
                >
                  {currentSubscription?.type === "credit"
                    ? `${currentSubscription?.credit} پیام`
                    : `${remainingDays} روز`}{" "}
                  مانده
                </span>
              </div>

              <div className="mb-0.5 flex items-center gap-1">
                <span className="text-muted-foreground">همراه:</span>
                <span className="tracking-wider">{userData?.mobile}</span>
              </div>

              <div className="mb-2 flex items-center gap-1">
                <div className="flex items-center gap-1">
                  {instagramValid ? (
                    <PlugsConnectedIcon
                      size={16}
                      weight="duotone"
                      className="text-green-600"
                    />
                  ) : (
                    <PlugsIcon
                      size={16}
                      weight="duotone"
                      className="text-destructive"
                    />
                  )}
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
                    "line-clamp-1 font-semibold tracking-wider",
                    !instagramValid && "text-destructive",
                  )}
                >
                  {userData?.instagrams?.[0]?.username}
                </span>
              </div>

              <ProgressLine
                percentage={isSubscriptionsLoading ? 0 : remainingDays}
                height={5}
                type="days"
                totalDays={currentSubscription?.planDuration?.durationDays}
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
