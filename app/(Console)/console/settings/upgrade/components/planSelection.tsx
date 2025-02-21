"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import LoadingSpinner from "@/components/ui/loadingSpinner";
import e2pNumber from "@/app/utils/e2pNumber";
import usePayPlan from "../hooks/usePayPlan";
import { useUpgradeContext } from "../context/upgrade.context";
import numberToK from "@/app/utils/numberToK";
import { ArrowRight, Check, CheckCircle, CheckSquare } from "@phosphor-icons/react/dist/ssr";

const planSchema = z.object({
  planId: z.number(),
  durationId: z.number(),
});

type FormValues = z.infer<typeof planSchema>;

export default function PlanSelection() {
  const t = useTranslations("Upgrade.PlanSelection");
  const { plans, active, setActive, subscriptions } = useUpgradeContext();
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
    <section
      className="_plan-selection-page relative h-full box-border max-h-full text-foreground"
      dir="rtl"
    >
      <div className="_wrapper 2xl:max-w-[860px] mx-auto">
        <div className="mb-6">
          <h2 className="font-semibold text-primary mb-1">{t('title')}</h2>
          <p className="text-[15px] text-muted-foreground">
            {t('description')}
          </p>
        </div>

        <div className="_selector flex justify-center">
          <div className="inline-flex items-center p-1.5 rounded-full border shadow-sm gap-1.5">
            <button
              type="button"
              onClick={() => handlePeriodChange(0)}
              className={cn(
                "px-5 py-2.5 text-sm font-medium rounded-full transition-all duration-300",
                period === 0
                  ? "bg-primary text-white shadow-lg"
                  : "text-zinc-600 hover:text-zinc-900"
              )}
            >
              {t("monthly")}
            </button>
            <button
              type="button"
              onClick={() => handlePeriodChange(1)}
              className={cn(
                "px-5 py-2.5 text-sm font-medium rounded-full transition-all duration-300",
                period === 1
                  ? "bg-primary text-white shadow-lg"
                  : "text-zinc-600 hover:text-zinc-900"
              )}
            >
              {t("threeMonths")}
            </button>
          </div>

          {subscriptions.length ? (
            <Button
              onClick={() =>
                setActive({ planSelection: false, subscriptionInfo: true })
              }
              className="absolute left-0 top-1/2 transform -translate-y-1/2"
            >
              <ArrowRight />
              بازگشت
            </Button>
          ) : null}
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6"
          >
            {plans.map((plan, index) => (
              <div
                key={plan.id}
                className={cn(
                  "relative group backdrop-blur-sm",
                  "rounded-xl transition-all duration-300",
                  "flex flex-col",
                  "bg-gradient-to-b from-green-100/25 to-transparent",
                  "border shadow-md hover:shadow-lg",
                )}
              >
                <div className="p-4">
                  <h3 className="text-xl text-center text-teal-900 font-semibold mb-4">
                    {plan.maxFollowers > 100_000
                      ? `${e2pNumber(numberToK(plan.minFollowers))}+`
                      : `${e2pNumber(numberToK(plan.minFollowers))} تا ${e2pNumber(numberToK(plan.maxFollowers))}`}
                    {` ${t("followers")}`}
                  </h3>

                  <div className="mb-6">
                    <div className="flex flex-col items-center">
                      <span className="text-3xl font-bold text-green-700">
                        {period === 0
                          ? e2pNumber(plan.durations[period].price.toLocaleString())
                          : e2pNumber((+(plan.durations[period].price / 3).toFixed(0)).toLocaleString())
                        }
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {t("currency")} / {t("month")}
                      </span>
                    </div>
                    {period === 1 && (
                      <p className="mt-2 font-semibold text-muted-foreground text-center">
                        {period > 0
                          ? `سه ماهه ${e2pNumber(plan.durations[period].price.toLocaleString())} تومان`
                          : null}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="mt-1 p-0.5 rounded-full text-green-600">
                          <Check size={14} weight="bold" />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {feature}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 pt-4">
                  <Button
                    type="button"
                    onClick={() => {
                      form.setValue("planId", plan.id);
                      form.setValue("durationId", plan.durations[period].id);
                      setTotalPrice(plan.durations[period].price);
                      form.handleSubmit(onSubmit)();
                    }}
                    className={cn(
                      "w-full h-10 relative transition-all duration-300 bg-primary text-white border border-zinc-200 hover:bg-green-700 hover:border-green-700 shadow-sm hover:shadow-md",
                      // index === 1
                      //   ? "bg-primary text-white hover:bg-zinc-800 shadow-lg hover:shadow-xl font-semibold"
                      //   : "bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200 shadow-sm hover:shadow-md"
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
            ))}
          </form>
        </Form>
      </div>
    </section>
  );
}