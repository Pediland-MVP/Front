"use client";

import useUser from "@/hooks/useUser";
import { usePermissions } from "@/hooks/usePermissions";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
// TODO: Should Refactor
import { useSubscriptionStore } from "@/store/subscriptionStore";
import { SubscriptionStatusEnum } from "@/types/subscriptions/enums/subscriptionStatus.enum";

import { Alert, AlertTitle, Button, CardContent } from "@/components/ui";
import { CardSimple } from "@/components/ui-custom/CardSimple";
import { PlugsConnectedIcon, PlugsIcon } from "@phosphor-icons/react/dist/ssr";
import { ProgressRadial } from "../ProgressRadial";

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;
const INSTAGRAM_CLIENT_ID = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID;

export const SubscriptionBoard = () => {
  const t = useTranslations("Console.Dashboard");
  const locale = useLocale();
  const router = useRouter();
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
  const hasActiveSubscription =
    currentSubscription?.status === SubscriptionStatusEnum.ACTIVE
      ? true
      : false;

  const { workspaceId, can } = usePermissions();
  const { workspaces } = useWorkspaces();
  const currentWorkspace = workspaces.find((w) => w.id === workspaceId);

  const sortedInstagrams = useMemo(() => {
    if (!user?.instagrams?.length) return [];
    return [...user.instagrams]
      .sort((a, b) => Number(a.isIgTokenValid) - Number(b.isIgTokenValid))
      .slice(0, 3);
  }, [user?.instagrams]);

  const instagramValid = user?.instagrams?.[0]?.isIgTokenValid;

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
                {user?.firstname} {user?.lastname}، {t("welcome")}!
              </div>
              <div className="mb-1 flex items-center gap-1">
                <span className="text-muted-foreground">{t("mobile")}:</span>
                <span className="font-semibold tracking-wider">
                  {user?.mobile}
                </span>
              </div>
              {currentWorkspace && (
                <div className="mb-1 flex items-center gap-1">
                  <span className="text-muted-foreground">{t("workspace")}:</span>
                  <span className="line-clamp-1 flex-1 font-semibold">
                    {currentWorkspace.name}
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-1">
                {sortedInstagrams.map((ig) => (
                  <div key={ig.id} className="flex items-center gap-1">
                    <span
                      className={cn(
                        "text-muted-foreground",
                        !ig.isIgTokenValid && "text-destructive",
                      )}
                    >
                      {t("instagram")}
                    </span>
                    <span
                      className={cn(
                        "line-clamp-1 flex-1 font-semibold tracking-wider md:ml-1 md:flex-initial",
                        !ig.isIgTokenValid && "text-destructive",
                      )}
                    >
                      {ig.username}
                    </span>
                    {ig.isIgTokenValid ? (
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
                ))}
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


            {
              !hasActiveSubscription && (
                <Alert variant="destructive" className="col-span-5 mb-3">
                  <AlertTitle className="text-[0.8rem]">{t("promotion_is_active")}</AlertTitle>
                </Alert>
              )
            }

            {instagramValid ? (
              can("billing:view") && (
                <Button
                  size="md"
                  className="w-full"
                  onClick={() => router.push("/settings/subscription")}
                >
                  {t("renewal_subsription")}
                </Button>
              )
            ) : (
              can("instagram:manage") && (
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
              )
            )}
          </div>
        </div>
      </CardContent>
    </CardSimple>
  );
};
