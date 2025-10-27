"use client";

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
  ProgressLine,
} from "@components";
import {
  CircleIcon,
  SignOutIcon,
  UserCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useLogout } from "@/hooks/swr/api-client";

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

  const getRemainingDays = useCallback((expireDate: string) => {
    const now = new Date();
    const expire = new Date(expireDate);
    const diffTime = expire.getTime() - now.getTime();

    return Math.ceil(diffTime / (1000 * 3600 * 24));
  }, []);

  const remainingDays = activeSubscription
    ? getRemainingDays(activeSubscription.expire)
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
      <CardContent className="flex flex-col gap-2 p-3">
        {pathname !== "/" &&
          pathname !== "/settings/subscription" &&
          !isSubscriptionsLoading && (
            <div className="flex flex-1 flex-col pb-1">
              <div className="text-secondary mb-3 flex flex-col gap-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">وضعیت:</span>
                    <span>{t(activeSubscription?.status || "unknown")}</span>
                    <CircleIcon
                      size={10}
                      weight="fill"
                      className="animate-pulse text-green-500"
                    />
                  </div>

                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto gap-0 !px-0"
                    onClick={() => router.push("/settings/subscription")}
                  >
                    {activeSubscription?.status ===
                    SubscriptionStatusEnum.ACTIVE
                      ? "جـزئـیـات"
                      : "تمدید"}
                  </Button>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">نوع اشتراک:</span>
                  <span className="flex-1">
                    {activeSubscription?.planDuration?.name}
                  </span>
                  <span className="text-primary text-[13px]">
                    {remainingDays} روز مانده
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">همراه:</span>
                  <span className="tracking-wider">{userData?.mobile}</span>
                </div>
              </div>
              <ProgressLine
                percentage={isSubscriptionsLoading ? 0 : remainingDays}
                height={5}
                type="days"
                totalDays={activeSubscription?.planDuration?.durationDays}
              />
            </div>
          )}

        <div className="text-secondary flex items-center">
          <div className="flex flex-1 items-center gap-1 text-sm">
            <Avatar className="h-7 w-7 rounded-lg border-0 duration-300 focus-within:ring-0">
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
