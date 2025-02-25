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
import numberToK from "@/app/utils/numberToK";

// UI Here
import { Form } from "@/components/ui/form";
import { Button } from "@/components/theme/ui/button";
import {
  ArrowLeft,
  ArrowUpLeft
} from "@phosphor-icons/react/dist/ssr";
import LoadingSpinner from "@/components/ui/loadingSpinner";
import { Card } from "@/components/theme/ui/card";
import { ReferralCodeTypeEnum } from "@/types/plans/plans.enum";
import DiscountText from "@/components/discountText";


const planSchema = z.object({
  planId: z.number(),
  durationId: z.number(),
});

type FormValues = z.infer<typeof planSchema>;

export default function PlanSelection() {
  const t = useTranslations("Upgrade.PlanSelection");

  const { plans, active, setActive, subscriptions, plansData } = useUpgradeContext();
  const discountFrom = plansData?.discount?.from
  const discount = plansData?.discount?.discount
  const referralCodeType = plansData?.discount?.type


  const [period, setPeriod] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loadingPlanId, setLoadingPlanId] = useState<number | null>(null);

  const { pay, isPayLoading } = usePayPlan();

  const form = useForm<FormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      planId: 0,
      durationId: 0,
    },
  });

  useEffect(() => {
    if (!plans?.length) return;
    form.setValue("planId", plans[0].id);
    form.setValue("durationId", plans[0].durations[0].id);
    setTotalPrice(plans[0].durations[0].price);
  }, [plans, form]);

  const handlePeriodChange = (newPeriod: number) => {
    setPeriod(newPeriod);
    if (plans) {
      const currentPlanId = form.getValues("planId");
      const currentPlan = plans.find((p) => p.id === currentPlanId);
      if (currentPlan) {
        form.setValue("durationId", currentPlan.durations[newPeriod].id);
        setTotalPrice(currentPlan.durations[newPeriod].price);
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

  if (!active.planSelection || !plans?.length) return null;

  return (
    <div
      className="_plan-selection-page relative h-full box-border max-h-full text-foreground">
      <Card className="h-full p-6">
        <div className="mb-6">
          <h2 className="font-semibold text-primary mb-1">{t("title")}</h2>
          <p className="text-[15px] text-muted-foreground">{t("description")}</p>
          <DiscountText/>
        </div>

        <div className="_plans-wrapper">
          <div className="_selector flex flex-col justify-center items-center">
            <div className="inline-flex flex-col md:flex-row w-full md:w-fit items-center p-1 rounded-xl sm:rounded-full border shadow-sm gap-1.5">
              <button
                type="button"
                onClick={() => handlePeriodChange(0)}
                className={cn(
                  "w-full md:w-fit px-5 py-2.5 text-sm font-medium rounded-lg md:rounded-full transition-all duration-300",
                  period === 0
                    ? "bg-gray-300"
                    : "text-zinc-600 hover:text-zinc-900"
                )}
              >
                {t("monthly")}
              </button>
              <button
                type="button"
                onClick={() => handlePeriodChange(1)}
                className={cn(
                  "w-full md:w-fit px-5 py-2.5 text-sm font-medium rounded-lg md:rounded-full transition-all duration-300",
                  period === 1
                    ? "bg-gray-300"
                    : "text-zinc-600 hover:text-zinc-900"
                )}
              >
                {t("threeMonths")}
              </button>
              <button
                type="button"
                onClick={() => handlePeriodChange(2)}
                className={cn(
                  "w-full md:w-fit px-5 py-2.5 text-sm font-medium rounded-lg md:rounded-full transition-all duration-300",
                  period === 2
                    ? "bg-gray-300"
                    : "text-zinc-600 hover:text-zinc-900"
                )}
              >
                {t("oneYear")}
              </button>
            </div>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6"
            >
              {plans.map((plan, index) => {
                const price = plan.durations[period].price.toLocaleString();
                const discountPrice = plan.durations[period].discountPrice;
                const haveDiscount =
                  typeof discountPrice === "number" && discountPrice >= 0;
                return (
                  <div
                    key={plan.id}
                    className={cn(
                      "relative group backdrop-blur-sm",
                      "rounded-xl transition-all duration-300",
                      "flex flex-col",
                      "bg-gradient-to-b from-green-100/25 to-transparent",
                      "border shadow-md hover:shadow-lg"
                    )}
                  >
                    <div className="p-4">
                      <h3 className="text-xl text-center text-teal-900 font-semibold mb-4">
                        {plan.maxFollowers > 100_000
                          ? `${e2pNumber(numberToK(plan.minFollowers))}+`
                          : `${e2pNumber(numberToK(plan.minFollowers))} تا ${e2pNumber(numberToK(plan.maxFollowers))}`}
                        {` ${t("followers")}`}
                      </h3>
                      <div className="flex flex-col items-center">
                        <span
                          className={cn(
                            "text-3xl font-bold text-green-700",
                            haveDiscount && "line-through text-2xl font-medium text-muted-foreground"
                          )}
                        >
                          {period === 0
                            ? e2pNumber(price)
                            : period === 1
                              ? e2pNumber((+(plan.durations[1].price / 3).toFixed(0)).toLocaleString())
                              : period === 2
                                ? e2pNumber((+(plan.durations[2].price / 12).toFixed(0)).toLocaleString())
                                : null}
                        </span>

                        {haveDiscount && (
                          <span
                            className={cn("text-3xl font-bold text-green-700")}
                          >
                            {e2pNumber(`${discountPrice?.toLocaleString()}`)}
                          </span>
                        )}
                        <span className="text-lg text-muted-foreground font-medium">
                          {t("currency")} در {t("month")}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 pt-2">
                      <Button
                        type="button"
                        onClick={() => {
                          form.setValue("planId", plan.id);
                          form.setValue("durationId", plan.durations[period].id);
                          setTotalPrice(plan.durations[period].price);
                          form.handleSubmit(onSubmit)();
                        }}
                        className={cn(
                          "w-full h-10 relative transition-all duration-300 bg-green-600 text-white border border-zinc-200 hover:bg-green-700 hover:border-green-700 shadow-sm hover:shadow-md"
                        )}
                        disabled={isPayLoading && loadingPlanId === plan.id}
                      >
                        {isPayLoading && loadingPlanId === plan.id ? (
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
