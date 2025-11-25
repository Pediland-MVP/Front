"use client";

import usePayPlan from "@/app/(Console)/settings/subscription/hooks/usePayPlan";
import useUser from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import { useSubscriptionStore } from "@/store/subscriptionStore";
import { IPlan } from "@/types/plans/plans";
import { formatNumber } from "@/utils/formatNumber";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CircleIcon,
  ClockCountdownIcon,
  PackageIcon,
  SealCheckIcon,
} from "@phosphor-icons/react/dist/ssr";
import {
  MoveLeftIcon,
  ShoppingBagIcon,
  ShoppingBasketIcon,
  ShoppingCartIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { InstagramInvalid } from "../Console/InstagramInvalid";
import { Alert, Button, Card, CardContent, CardFooter } from "../ui";
import { ButtonLoading } from "../ui-custom/ButtonLoading";
import { DiscountAlert } from "./DiscountAlert";
import { DiscountCode } from "./DiscountCode";
import { SubscriptionStatusEnum } from "@/types/subscriptions/enums/subscriptionStatus.enum";
import { CardSimple } from "../ui-custom/CardSimple";
import { toJalaliDate } from "@/utils/jalali";
import { ProgressRadial } from "../Console/ProgressRadial";

const planSchema = z.object({
  planId: z.number(),
  durationId: z.number(),
  discountCode: z.string().optional(),
});

type FormValues = z.infer<typeof planSchema>;

export const ChoosePlan = () => {
  const router = useRouter();
  const t = useTranslations("Subscription");
  const [currentPlan, setCurrentPlan] = useState<IPlan>();
  const [selectedDurationId, setSelectedDurationId] = useState<number | null>(
    null,
  );

  const { user } = useUser();

  const isIgTokenInvalid = user?.instagrams[0]?.isIgTokenValid === false;

  const {
    active,
    setActive,
    plans,
    subscriptions,
    isLoading: isSubscriptionsLoading,
    discountCode,
    setDiscountCode,
    totalRemainingDays,
    totalPurchasedDays,
  } = useSubscriptionStore();

  const activeSubscription = subscriptions?.find(
    (sub) => sub.status === SubscriptionStatusEnum.ACTIVE,
  );

  const reservedSubscriptions = subscriptions?.filter(
    (sub) => sub.status === SubscriptionStatusEnum.RESERVED,
  );

  useEffect(() => {
    setCurrentPlan(plans[0]);
  }, [plans]);

  const { pay, isPayLoading } = usePayPlan();

  const form = useForm<FormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      planId: 0,
      durationId: 0,
      discountCode: "",
    },
  });

  useEffect(() => {
    if (currentPlan?.id) {
      form.setValue("planId", currentPlan.id);
    }
  }, [currentPlan, form]);

  const selectPlanHandler = (durationId: number) => {
    setSelectedDurationId(durationId);
    form.setValue("durationId", durationId);
    onSubmit(form.getValues());
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const paymentData = {
        planId: data.planId,
        durationId: data.durationId,
        ...(discountCode && { discountCode }),
      };
      await pay(paymentData, setActive);
    } catch (error) {
      console.error("Error in onSubmit", error);
      toast.error(error);
    }
  };

  const labelClass = "text-muted-foreground text-sm font-me";

  if (!active.choosePlan) return null;

  return (
    <div className="flex-1 space-y-4">
      {activeSubscription ? (
        <CardSimple className="border-violet-200 bg-violet-50/50">
          <CardContent className="flex flex-col gap-2 p-3 text-[15px] md:p-5">
            <div className="flex items-center gap-2">
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

      {isIgTokenInvalid ? (
        <InstagramInvalid />
      ) : (
        !currentPlan && (
          <Alert className="border-yellow-600/40 bg-yellow-50 text-sm text-yellow-600">
            متاسفانه هیچ بسته اشتراکی برای شما وجود ندارد.
          </Alert>
          // <Card className="border-dashed border-blue-200 bg-linear-to-br from-blue-50 to-violet-50 p-0">
          //   <CardContent className="p-4">
          //     <h2 className="text-gradient flex items-center gap-3 text-lg font-semibold">
          //       <PackageIcon
          //         weight="duotone"
          //         className="text-secondary size-8"
          //       />
          //       {t("plan_title")}:<br className="md:hidden" /> (
          //       {currentPlan?.name})
          //     </h2>

          //     {currentPlan?.features.length > 0 && (
          //       <div>
          //         <ul className="grid gap-2.5 px-1.5 md:grid-cols-2">
          //           {currentPlan.features.map((feature, id) => (
          //             <li
          //               key={id}
          //               className="text-secondary flex items-center gap-2 text-sm font-medium"
          //             >
          //               <SealCheckIcon
          //                 size={16}
          //                 weight="duotone"
          //                 className="text-green-700/80"
          //               />
          //               {feature}
          //             </li>
          //           ))}
          //         </ul>
          //       </div>
          //     )}
          //   </CardContent>
          // </Card>
        )
      )}

      <DiscountAlert />

      {currentPlan?.durations.length > 0 && (
        <div>
          <h3 className="text-secondary mb-4 flex items-center gap-1 text-[15px] font-medium">
            <ClockCountdownIcon size={20} />
            {t("package_title")}:
          </h3>

          <div className="flex flex-col gap-4 md:flex-row">
            {currentPlan.durations
              .sort((a, b) => b.id - a.id)
              .map((duration, id) => {
                console.log("discountPrice", duration.discountPrice);
                console.log("price", duration.price);

                const unitPrice =
                  duration.discountPrice > 0
                    ? Number(duration.discountPrice)
                    : Number(duration.price);
                var totalBasePrice: number | string;
                var monthlyPrice: number | string;

                if (duration.durationDays === 30) {
                  monthlyPrice = unitPrice / 1000;
                  totalBasePrice = formatNumber(unitPrice);
                } else if (duration.durationDays === 90) {
                  monthlyPrice = Math.floor(Math.floor(unitPrice / 3) / 1000);
                  totalBasePrice = formatNumber(unitPrice);
                } else if (duration.durationDays === 365) {
                  monthlyPrice = Math.round(Math.round(unitPrice / 12) / 1000);
                  totalBasePrice = formatNumber(unitPrice);
                }

                const topId = 0;

                return (
                  <Card
                    key={id}
                    className={cn(
                      "flex-1 gap-0 p-0",
                      id === topId
                        ? "border-violet-200 shadow-violet-200"
                        : "border-blue-200/60 shadow-blue-200/60",
                    )}
                  >
                    <CardContent
                      className={cn(
                        "flex w-full flex-1 flex-col items-center gap-3 rounded-t-xl px-4 py-5 sm:px-3",
                        id === topId ? "bg-violet-50/50" : "bg-blue-50/30",
                      )}
                    >
                      <div className="flex items-center gap-1">
                        <h4
                          className={cn(
                            "font-bold sm:text-[15px]",
                            id === topId ? "text-primary" : "text-secondary/80",
                          )}
                        >
                          {t("subscription")} {duration.name}
                        </h4>
                      </div>
                      <div
                        className={cn(
                          "text-center text-lg",
                          id === topId
                            ? "font-semibold text-green-600"
                            : "font-medium",
                        )}
                      >
                        {monthlyPrice}{" "}
                        <span className="text-base sm:text-[15px]">
                          هزار تومان ماهانه
                        </span>
                      </div>

                      <div className="flex h-full">
                        <div className="text-muted-foreground flex items-center gap-1.5 text-[15px] sm:text-sm">
                          (جمع {totalBasePrice} {t("toman")})
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="w-full p-0">
                      <ButtonLoading
                        isLoading={
                          selectedDurationId === duration.id && isPayLoading
                        }
                        type="button"
                        variant="ghost"
                        size="lg"
                        className={cn(
                          "h-9 w-full rounded-t-none! rounded-b-xl! font-semibold",
                          id === topId
                            ? "text-primary hover:text-primary bg-violet-100/90 hover:bg-violet-200/70"
                            : "text-secondary/70 hover:text-secondary bg-blue-100/70 hover:bg-blue-100",
                        )}
                        onClick={() => selectPlanHandler(duration.id)}
                      >
                        <ShoppingBagIcon />
                        {t("buy")}
                      </ButtonLoading>
                    </CardFooter>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      <div className="flex flex-col items-center justify-between gap-3 sm:pb-6 md:mb-0 md:flex-row">
        {!isIgTokenInvalid && currentPlan && <DiscountCode />}

        {reservedSubscriptions?.length > 0 && (
          <Button
            onClick={() =>
              setActive({ choosePlan: false, subscriptionInfo: true })
            }
            variant="link"
            className="font-normal"
          >
            اشتراک‌های رزرو شده
            <MoveLeftIcon />
          </Button>
        )}
      </div>
    </div>
  );
};
