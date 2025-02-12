"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import LoadingSpinner from "@/components/ui/loadingSpinner";
import e2pNumber from "@/app/utils/e2pNumber";
import usePayPlan from "../hooks/usePayPlan";
import { useUpgradeContext } from "../context/upgrade.context";
import numberToK from "@/app/utils/numberToK";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

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

  if (!active.planSelection || !plans) return null;

  return (
    <section
      className="relative h-full box-border max-h-full text-foreground"
      dir="rtl"
    >
      <div className="w-full max-w-5xl mx-auto">
        <div className="flex flex-col items-center gap-4 mb-12 relative">
          <h2 className="text-3xl font-bold">{t("selectPlan")}</h2>
          <div className="inline-flex items-center p-1.5 dark:bg-zinc-800/50 rounded-full border dark:border-zinc-700 shadow-sm">
            <button
              type="button"
              onClick={() => handlePeriodChange(0)}
              className={cn(
                "px-8 py-2.5 text-sm font-medium rounded-full transition-all duration-300",
                period === 0
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-lg"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
              )}
            >
              {t("monthly")}
            </button>
            <button
              type="button"
              onClick={() => handlePeriodChange(1)}
              className={cn(
                "px-8 py-2.5 text-sm font-medium rounded-full transition-all duration-300",
                period === 1
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-lg"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
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
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {plans.map((plan, index) => (
              <div
                key={plan.id}
                className={cn(
                  "min-w-80 h-[500px]",
                  "relative group backdrop-blur-sm",
                  "rounded-3xl transition-all duration-300",
                  "flex flex-col",
                  "bg-gradient-to-b from-zinc-100/80 to-transparent dark:from-zinc-400/[0.15]",
                  "border",
                  "border-zinc-400/50 dark:border-zinc-400/20 shadow-xl",
                  "hover:translate-y-0 hover:shadow-lg"
                )}
              >
                <div className="p-8 flex-1">
                  <h3 className="text-xl font-semibold mb-4">
                    {plan.maxFollowers > 100_000
                      ? "+"
                      : `${e2pNumber(numberToK(plan.maxFollowers))} - `}
                    {e2pNumber(numberToK(plan.minFollowers))} {" "}
                    {t("followers")}
                  </h3>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">
                        {e2pNumber(
                          plan.durations[period].price.toLocaleString()
                        )}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {t("currency")} / {t("month")}
                      </span>
                    </div>
                    {period === 1 && (
                      <p className="mt-2 text-md text-muted-foreground">
                        {period > 0
                          ? `${e2pNumber((+(plan.durations[period].price / 3).toFixed(0)).toLocaleString())} در ماه`
                          : null}
                      </p>
                    )}
                  </div>

                  <div className="space-y-4">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="mt-1 p-0.5 rounded-full text-emerald-600">
                          <CheckIcon className="w-4 h-4" />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {feature}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-8 pt-0">
                  <Button
                    type="button"
                    onClick={() => {
                      form.setValue("planId", plan.id);
                      form.setValue("durationId", plan.durations[period].id);
                      setTotalPrice(plan.durations[period].price);
                      form.handleSubmit(onSubmit)();
                    }}
                    className={cn(
                      "w-full h-12 relative transition-all duration-300",
                      index === 1
                        ? "bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg hover:shadow-xl font-semibold"
                        : "bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200 shadow-sm hover:shadow-md"
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