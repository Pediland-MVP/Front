"use client";

import { useSubscriptionStore } from "@/store/subscriptionStore";
import { Button, Card, CardContent, CardFooter } from "../ui";
import {
  ClockCountdownIcon,
  PackageIcon,
  SealCheckIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { IPlan } from "@/types/plans/plans";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/utils/formatNumber";
import { ButtonLoading, CardSimple } from "../ui-custom";
import usePayPlan from "@/app/(Console)/settings/subscription/hooks/usePayPlan";
import { AlertCircleIcon, ArrowLeftIcon, MoveLeftIcon } from "lucide-react";
import { DiscountAlert } from "./DiscountAlert";
import { DiscountCode } from "./DiscountCode";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useUser from "@/hooks/useUser";
import { InstagramInvalid } from "../Console";

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
  } = useSubscriptionStore();

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

  if (!active.choosePlan) return null;

  return (
    <div className="flex-1 space-y-4">
      {isIgTokenInvalid ? (
        <InstagramInvalid />
      ) : (
        <Card className="border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-violet-50 pb-7">
          <CardContent>
            <h2 className="text-gradient mb-5 flex items-center gap-2 text-lg font-semibold">
              <PackageIcon
                weight="duotone"
                className="text-secondary h-8 w-8"
              />
              {t("plan_title")}:<br className="md:hidden" /> (
              {currentPlan?.name})
            </h2>

            {currentPlan?.features.length > 0 && (
              <div>
                <ul className="grid gap-2.5 px-1.5 md:grid-cols-2">
                  {currentPlan.features.map((feature, id) => (
                    <li
                      key={id}
                      className="text-secondary flex items-center gap-2 text-sm font-medium"
                    >
                      <SealCheckIcon
                        size={16}
                        weight="duotone"
                        className="text-green-700/80"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* <DiscountAlert /> */}

      {currentPlan?.durations.length > 0 && (
        <div>
          <h3 className="text-secondary mb-4 flex items-center gap-1 text-[15px] font-medium">
            <ClockCountdownIcon size={20} />
            {t("package_title")}:
          </h3>

          <div className="flex flex-col gap-4 md:flex-row">
            asas
            {currentPlan.durations.map((duration, id) => {
              const topId = 2;

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
                      "flex w-full flex-1 flex-col items-center justify-around rounded-t-xl px-4 py-5",
                      id === topId ? "bg-violet-50/50" : "bg-blue-50/30",
                    )}
                  >
                    <h4
                      className={cn(
                        "mb-3",
                        id === topId
                          ? "text-primary font-semibold"
                          : "text-secondary/70 font-medium",
                      )}
                    >
                      {t("subscription")} {duration.name}
                    </h4>
                    <div className="flex w-full items-center justify-center gap-1">
                      <div className="flex flex-col items-center">
                        {duration.discountPrice != null && (
                          <div className="text-gray-400 line-through">
                            {formatNumber(duration.price)}
                          </div>
                        )}

                        <div
                          className={cn(
                            "text-xl font-bold",
                            id === topId
                              ? "text-green-600"
                              : "text-secondary/70",
                          )}
                        >
                          {duration.discountPrice != null
                            ? duration.discountPrice !== 0 &&
                              formatNumber(duration.discountPrice)
                            : formatNumber(duration.price)}
                        </div>
                        {duration.discountPrice !== 0 ? (
                          <div className="text-muted-foreground">
                            {t("toman")}
                          </div>
                        ) : (
                          <div className="text-xl font-semibold text-green-600">
                            {t("free")}
                          </div>
                        )}
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
                      className={cn(
                        "h-9 w-full !rounded-t-none !rounded-b-xl font-semibold",
                        id === topId
                          ? "text-primary hover:text-primary bg-violet-100/90 hover:bg-violet-200/70"
                          : "text-secondary/70 hover:text-secondary bg-blue-100/70 hover:bg-blue-100",
                      )}
                      onClick={() => selectPlanHandler(duration.id)}
                    >
                      {t("buy")}
                    </ButtonLoading>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div className="my-6 flex flex-col items-center justify-between gap-3 md:mb-0 md:flex-row">
        {!isIgTokenInvalid && <DiscountCode />}

        {subscriptions?.length > 0 && (
          <Button
            onClick={() =>
              setActive({ choosePlan: false, subscriptionInfo: true })
            }
            variant="link"
            className="font-normal"
          >
            اشتراک‌های من
            <MoveLeftIcon />
          </Button>
        )}
      </div>
    </div>
  );
};
