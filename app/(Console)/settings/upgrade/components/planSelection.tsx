"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import e2pNumber from "@/app/utils/e2pNumber";
import usePayPlan from "../hooks/usePayPlan";
import { useUpgradeContext } from "../context/upgrade.context";

// UI Here
import { Form } from "@/components/ui/form";
import { Button } from "@/components/theme/ui/button";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import LoadingSpinner from "@/components/ui/loadingSpinner";
import { Card } from "@/components/theme/ui/card";
import DiscountText from "@/components/discountText";
import logger from "@/app/utils/logger";
import { DiscountCode } from "./discountCode";
import { usePlanSelection } from "../hooks/usePlanSelection";
import { IPlan } from "@/types/plans/plans";

const planSchema = z.object({
  planId: z.number(),
  durationId: z.number(),
});

type FormValues = z.infer<typeof planSchema>;

export default function PlanSelection() {
  const t = useTranslations("Upgrade.PlanSelection");

  const { active, setActive, subscriptions, plansData, plans, discountCode } =
    useUpgradeContext();

  const [period, setPeriod] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loadingPlanId, setLoadingPlanId] = useState<number | null>(null);

  const { pay, isPayLoading } = usePayPlan();

  const [currentPlan, setCurrentPlan] = useState<IPlan>();

  const form = useForm<FormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      planId: 0,
      durationId: 0,
    },
  });

  const planId = form.watch("planId");

  useEffect(() => {
    if (!plans?.length) return;
    form.setValue("planId", plans[0].id);
    form.setValue("durationId", plans[0].durations[0].id);
    setTotalPrice(plans[0].durations[0].price);
  }, [plans, form]);

  const changePlan = (planId: number) => {
    form.setValue("planId", planId);
    if (plans) {
      const currentPlan = plans.find((p) => p.id === planId);
      if (currentPlan) {
        form.setValue("durationId", currentPlan.durations[0].id);
        setTotalPrice(currentPlan.durations[0].price);
      }
    }
  };

  const onSubmit = async (data: FormValues) => {
    setLoadingPlanId(data.planId);
    try {
      await pay({ ...data, ...(discountCode && { discountCode }) }, setActive);
    } finally {
      setLoadingPlanId(null);
    }
  };

  const getPriceString = (price: number, durationDays: number) => {
    if (price === 0) return t("free");
    logger.debug("period", period, price);
    return e2pNumber(
      (
        Math.trunc(+(price / (durationDays / 30)).toFixed(0) / 500) * 500
      ).toLocaleString(),
    );
  };

  useEffect(() => {
    if (!planId || !plansData || !plans) return;

    setCurrentPlan(plans.find((p) => p.id === planId));
  }, [planId, plansData]);

  // useEffect(() => {
  //   console.log("p-active", plans, active);
  // }, [active, plans]);

  if (!active.planSelection || !plans?.length) return null;

  return (
    <div className="_plan-selection-page text-foreground relative box-border h-full max-h-full">
      <Card className="h-full p-6">
        <div className="mb-6">
          <h2 className="text-primary mb-1 font-semibold">{t("title")}</h2>
          <p className="text-muted-foreground text-[15px]">
            {t("description")}
          </p>
          <DiscountText />
        </div>

        <DiscountCode />

        <div className="_plans-wrapper">
          <div className="_selector flex flex-col items-center justify-center">
            <div className="inline-flex w-full flex-col items-center gap-1.5 rounded-xl border p-1 shadow-sm sm:rounded-full md:w-fit md:flex-row">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => changePlan(plan.id)}
                  className={cn(
                    "w-full rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-300 md:w-fit md:rounded-full",
                    plan.id === form.getValues("planId")
                      ? "bg-gray-300"
                      : "text-zinc-600 hover:text-zinc-900",
                  )}
                >
                  {plan.name}
                </button>
              ))}
            </div>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="my-6 grid grid-cols-1 gap-4 md:grid-cols-3"
            >
              {currentPlan?.durations.map((duration) => {
                const haveMonthlyDiscount =
                  typeof duration.monthlyDiscount === "number" &&
                  duration.monthlyDiscount >= 0;

                const haveDurationDiscount =
                  typeof duration.discountPrice === "number" &&
                  duration.discountPrice >= 0;

                return (
                  <div
                    key={duration.id}
                    className={cn(
                      "group relative backdrop-blur-sm",
                      "rounded-xl transition-all duration-300",
                      "flex flex-col",
                      "bg-gradient-to-b from-green-100/25 to-transparent",
                      "border shadow-md hover:shadow-lg",
                      "min-h-64",
                    )}
                  >
                    <div className="p-4">
                      <h3 className="mb-4 text-center text-xl font-semibold text-teal-900">
                        {duration.name}
                      </h3>
                      <div className="flex flex-col items-center justify-center">
                        {haveDurationDiscount && duration.discountPrice == 0 ? (
                          <>
                            <span
                              className={cn(
                                "font-bold text-green-700",
                                "text-muted-foreground text-2xl font-medium line-through",
                              )}
                            >
                              {getPriceString(
                                duration.price,
                                duration.durationDays,
                              )}
                            </span>
                            <p className="text-xl font-bold text-green-700">
                              {t("free")}
                            </p>
                          </>
                        ) : haveDurationDiscount ? (
                          <>
                            <span
                              className={cn(
                                "font-bold text-green-700",
                                "text-muted-foreground text-2xl font-medium line-through",
                              )}
                            >
                              {getPriceString(
                                duration.price,
                                duration.durationDays,
                              )}
                            </span>

                            <span
                              className={cn(
                                "text-3xl font-bold text-green-700",
                              )}
                            >
                              {e2pNumber(
                                (+(
                                  (duration?.discountPrice || 0) as number
                                ).toFixed(0)).toLocaleString(),
                              )}
                            </span>
                            <span className="text-muted-foreground text-lg font-medium">
                              {t("currency")} در {t("month")}
                            </span>
                          </>
                        ) : haveMonthlyDiscount ? (
                          <>
                            <span
                              className={cn(
                                "font-bold text-green-700",
                                "text-muted-foreground text-2xl font-medium line-through",
                              )}
                            >
                              {e2pNumber(
                                (+(duration.monthlyDiscount as number).toFixed(
                                  0,
                                )).toLocaleString(),
                              )}
                            </span>

                            <span
                              className={cn(
                                "text-3xl font-bold text-green-700",
                              )}
                            >
                              {getPriceString(
                                duration.price,
                                duration.durationDays,
                              )}
                            </span>
                            <span className="text-muted-foreground text-lg font-medium">
                              {t("currency")} در {t("month")}
                            </span>
                          </>
                        ) : (
                          <>
                            <span
                              className={cn(
                                "text-3xl font-bold text-green-700",
                              )}
                            >
                              {getPriceString(
                                duration.price,
                                duration.durationDays,
                              )}
                            </span>
                            <span className="text-muted-foreground text-lg font-medium">
                              {t("currency")} در {t("month")}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="mt-auto p-6 pt-2">
                      <Button
                        type="button"
                        onClick={() => {
                          form.setValue("durationId", duration.id);
                          setTotalPrice(duration.price);
                          form.handleSubmit(onSubmit)();
                        }}
                        className={cn(
                          "relative h-10 w-full border border-zinc-200 bg-green-600 text-white shadow-sm transition-all duration-300 hover:border-green-700 hover:bg-green-700 hover:shadow-md",
                        )}
                        disabled={isPayLoading && loadingPlanId === duration.id}
                      >
                        {isPayLoading && loadingPlanId === duration.id ? (
                          <LoadingSpinner />
                        ) : (
                          t("choosePlan")
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </form>
          </Form>
        </div>

        {subscriptions?.length ? (
          <div className="mb-12 text-left md:mb-0">
            <Button
              onClick={() =>
                setActive({ planSelection: false, subscriptionInfo: true })
              }
              variant="link"
              size={"lg"}
            >
              بازگشت به اشتراک‌های من
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
