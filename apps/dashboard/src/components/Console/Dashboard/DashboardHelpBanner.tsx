import { HelpMeDialog } from "@/components/Global/HelpMeDialog";
import { CardContent } from "@/components/ui";
import { CardSimple } from "@/components/ui-custom/CardSimple";
import useUser from "@/hooks/useUser";
import { useSubscriptionStore } from "@/store/subscriptionStore";
import { SubscriptionStatusEnum } from "@/types/subscriptions/enums/subscriptionStatus.enum";
import { QuestionIcon } from "@phosphor-icons/react/dist/ssr";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

export const DashboardHelpBanner = () => {
  const { user } = useUser();
  const t = useTranslations("Home.DashboardHelpBanner");

  const {
    subscriptions,
    isLoading: isSubscriptionsLoading,
    totalRemainingDays,
    totalPurchasedDays,
  } = useSubscriptionStore();

  const activeSubscription = subscriptions?.find(
    (sub) => sub.status === SubscriptionStatusEnum.ACTIVE,
  );

  const helpButtonRef = useRef<HTMLDivElement>(null)

  if (isSubscriptionsLoading || activeSubscription?.type !== "credit")
    return null;


  return (
    <div onClick={() => helpButtonRef.current?.click()} className="mb-5">
      <CardSimple className="my-2 border-[#9ed5b5] bg-[#eaf7f0] bg-linear-to-bl">
        <CardContent className="flex items-center justify-between gap-3.5 p-3.5 md:gap-6 md:p-6">
          <div>
            <p className="text-sm font-bold text-[#1f6f43] md:text-lg">
              {t("title")}
            </p>
            <div className="w-10/12 text-xs leading-relaxed font-medium text-[#1f6f43] md:w-6/12 md:text-base">
              {t.rich("des", {
                firstname: user.firstname,
                lastname: user.lastname,
              })}
            </div>
          </div>
          <div className="flex w-2/12 flex-col items-center gap-1">
            <HelpMeDialog
              title={t("how_to_connect")}
              videoSrc="https://befroosh.s3.ir-thr-at1.arvanstorage.ir/learn%2F828c43efc1b5fc5d5807dc1ca2da790a67648285-480p.mp4?versionId="
              videoPoster="/images/photo_2025-02-26_22-00-50.jpg"
              noAbsolute
            >
              <div ref={helpButtonRef} className="flex flex-col items-center justify-center">
                <QuestionIcon
                  weight="duotone"
                  className="h-16 w-16 text-[#1f6f43] md:h-10 md:w-10"
                />
                <span className="w-full text-center text-xs font-semibold text-[#1f6f43] md:text-sm">
                  دیدن راهنما
                </span>
              </div>
            </HelpMeDialog>
          </div>
        </CardContent>
      </CardSimple>
    </div>
  );
};
