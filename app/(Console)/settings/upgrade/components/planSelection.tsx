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

  const { active, setActive, subscriptions, plansData, plans } =
    useUpgradeContext();

  const [period, setPeriod] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loadingPlanId, setLoadingPlanId] = useState<number | null>(null);

  const { pay, isPayLoading } = usePayPlan();

  const [currentPlan, setCurrentPlan] = useState<IPlan>()

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
      await pay(data, setActive);
    } finally {
      setLoadingPlanId(null);
    }
  };

  const getPriceString = (price: number, durationDays: number) => {
    if (price === 0) return t("free");
    logger.debug("period", period, price);
    return e2pNumber(
      (+(price / (durationDays / 30)).toFixed(0)).toLocaleString()
    );
  };

  useEffect(() => {
    console.log("Plans is change", plansData);
    if (!planId || !plansData || !plans) return;

    
    setCurrentPlan(plans.find((p) => p.id === planId))

  }, [planId, plansData])


  useEffect(() => {
    console.log('Plans', plans, planId, currentPlan);
    
  }, [plans, planId, currentPlan])


  if (!active.planSelection || !plans?.length) return null;

  return (
    <div className="_plan-selection-page relative h-full box-border max-h-full text-foreground">
      <Card className="h-full p-6">
        <div className="mb-6">
          <h2 className="font-semibold text-primary mb-1">{t("title")}</h2>
          <p className="text-[15px] text-muted-foreground">
            {t("description")}
          </p>
          <DiscountText />
        </div>

        <DiscountCode />

        <div className="_plans-wrapper">
          <div className="_selector flex flex-col justify-center items-center">
            <div className="inline-flex flex-col md:flex-row w-full md:w-fit items-center p-1 rounded-xl sm:rounded-full border shadow-sm gap-1.5">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => changePlan(plan.id)}
                  className={cn(
                    "w-full md:w-fit px-5 py-2.5 text-sm font-medium rounded-lg md:rounded-full transition-all duration-300",
                    plan.id === form.getValues("planId")
                      ? "bg-gray-300"
                      : "text-zinc-600 hover:text-zinc-900"
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
              className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6"
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
                      "relative group backdrop-blur-sm",
                      "rounded-xl transition-all duration-300",
                      "flex flex-col",
                      "bg-gradient-to-b from-green-100/25 to-transparent",
                      "border shadow-md hover:shadow-lg",
                      "min-h-64"
                    )}
                  >
                    <div className="p-4">
                      <h3 className="text-xl text-center text-teal-900 font-semibold mb-4">
                        {duration.name}
                      </h3>
                      <div className="flex flex-col items-center justify-center">
                        {haveDurationDiscount && duration.discountPrice == 0 ? (
                          <>
                            <span
                              className={cn(
                                "font-bold text-green-700",
                                "line-through text-2xl font-medium text-muted-foreground"
                              )}
                            >
                              {getPriceString(
                                duration.price,
                                duration.durationDays
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
                                "line-through text-2xl font-medium text-muted-foreground"
                              )}
                            >
                              {getPriceString(
                                duration.price,
                                duration.durationDays
                              )}
                            </span>

                            <span
                              className={cn(
                                "text-3xl font-bold text-green-700"
                              )}
                            >
                              {e2pNumber(
                                (+(
                                  (duration?.discountPrice || 0) as number
                                ).toFixed(0)).toLocaleString()
                              )}
                            </span>
                            <span className="text-lg text-muted-foreground font-medium">
                              {t("currency")} در {t("month")}
                            </span>
                          </>
                        ) : haveMonthlyDiscount ? (
                          <>
                            <span
                              className={cn(
                                "font-bold text-green-700",
                                "line-through text-2xl font-medium text-muted-foreground"
                              )}
                            >
                              {e2pNumber(
                                (+(duration.monthlyDiscount as number).toFixed(
                                  0
                                )).toLocaleString()
                              )}
                            </span>

                            <span
                              className={cn(
                                "text-3xl font-bold text-green-700"
                              )}
                            >
                              {getPriceString(
                                duration.price,
                                duration.durationDays
                              )}
                            </span>
                            <span className="text-lg text-muted-foreground font-medium">
                              {t("currency")} در {t("month")}
                            </span>
                          </>
                        ) : (
                          <>
                            <span
                              className={cn(
                                "text-3xl font-bold text-green-700"
                              )}
                            >
                              {getPriceString(
                                duration.price,
                                duration.durationDays
                              )}
                            </span>
                            <span className="text-lg text-muted-foreground font-medium">
                              {t("currency")} در {t("month")}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="p-6 pt-2 mt-auto">
                      <Button
                        type="button"
                        onClick={() => {
                          form.setValue("durationId", duration.id);
                          setTotalPrice(duration.price);
                          form.handleSubmit(onSubmit)();
                        }}
                        className={cn(
                          "w-full h-10 relative transition-all duration-300 bg-green-600 text-white border border-zinc-200 hover:bg-green-700 hover:border-green-700 shadow-sm hover:shadow-md"
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

        {subscriptions.length && (
          <div className="text-left mb-12 md:mb-0">
            <Button
              onClick={() =>
                setActive({ planSelection: false, subscriptionInfo: true })
              }
              variant="link"
              size={"lg"}
            >
              بازگشت به اشتراک‌های من
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
