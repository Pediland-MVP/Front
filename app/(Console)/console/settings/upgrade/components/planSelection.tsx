"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import LoadingSpinner from "@/components/ui/loadingSpinner";
import e2pNumber from "@/app/utils/e2pNumber";
import numberToK from "@/app/utils/numberToK";
import usePayPlan from "../hooks/usePayPlan";
import { useUpgradeContext } from "../context/upgrade.context";
import { ArrowRight, Plus } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import usePlanDurationMap from "../hooks/usePlanDurationMap";

const planSchema = z.object({
  planId: z.number(),
  durationId: z.number(),
});

type FormValues = z.infer<typeof planSchema>;

export default function PlanSelection() {
  const t = useTranslations("Upgrade.PlanSelection");
  const { plans, active, setActive, subscriptions } = useUpgradeContext();

  const [totalPrice, setTotalPrice] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      planId: 0,
      durationId: 0,
    },
  });

  useEffect(() => {
    const selectedPlan = plans.find((p) => p.id === form.watch("planId"));
    const selectedDuration = selectedPlan?.durations.find(
      (d) => d.id === form.watch("durationId")
    );

    if (selectedDuration) {
      setTotalPrice(selectedDuration.price);
    }
  }, [form.watch(), plans]);

  const { pay, isPayLoading } = usePayPlan();

  useEffect(() => {
    if (!plans) return;
    form.setValue("planId", plans[0].id);
    form.setValue("durationId", plans[0].durations[0].id);
  }, [plans, form]);

  const onPlanChange = (id: number) => {
    if (!plans) return;
    form.setValue("planId", id);
    const planId = plans?.findIndex((plan) => plan.id === id)!;
    form.setValue("durationId", plans[planId].durations[0].id);
  };

  const onSubmit = (data: FormValues) => {
    pay(data);
  };

  if (!active.planSelection) {
    return null;
  }

  if (!plans) {
    return <LoadingSpinner />;
  }

  return (
    <Card>
      <div className="flex justify-between items-center p-7">
        <div>
          <CardTitle className="">{t("selectPlan")}</CardTitle>
          <CardDescription>{t("planDescription")}</CardDescription>
        </div>
        {subscriptions.length ? (
          <Button
            onClick={() =>
              setActive({ subscriptionInfo: true, planSelection: false })
            }
          >
            <ArrowRight /> {t("back")}
          </Button>
        ) : null}
      </div>

      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full max-w-5xl mx-auto space-y-8"
            dir="rtl"
          >
            <FormField
              control={form.control}
              name="planId"
              render={({ field }) => (
                <FormItem>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {plans.map((plan) => (
                      <FormControl key={plan.id}>
                        <Card
                          className={`cursor-pointer transition-all ${field.value === plan.id ? "ring-2 ring-primary" : ""}`}
                          onClick={() => onPlanChange(plan.id)}
                        >
                          <CardHeader>
                            <CardTitle>{plan.name}</CardTitle>
                            <CardDescription>
                              {e2pNumber(numberToK(plan.minFollowers))} -{" "}
                              {plan.maxFollowers === Number.POSITIVE_INFINITY
                                ? "∞"
                                : e2pNumber(numberToK(plan.maxFollowers))}{" "}
                              {t("followers")}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-2xl font-bold">
                              از{" "}
                              {e2pNumber(
                                plan.durations[0]?.price.toLocaleString()
                              )}{" "}
                              {t("currency")}
                            </p>
                            <p className="text-muted-foreground">
                              {t("for")}{" "}
                              {e2pNumber(
                                (
                                  plan.durations[0]?.durationDays ?? 0 / 30
                                ).toLocaleString()
                              )}{" "}
                              {t("months")}
                            </p>
                          </CardContent>
                        </Card>
                      </FormControl>
                    ))}
                  </div>
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">{t("selectDuration")}</h2>
              <FormField
                control={form.control}
                name="durationId"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        className="flex gap-4 flex-row-reverse"
                        onValueChange={(value) => field.onChange(Number(value))}
                        value={field.value.toString()}
                      >
                        {plans
                          .find((p) => p.id === form.watch("planId"))
                          ?.durations.map((duration) => (
                            <div
                              key={duration.id}
                              className={cn(
                                "w-full rounded-md",
                                `${field.value === duration.id ? "ring-2 ring-primary" : ""}`
                              )}
                            >
                              <RadioGroupItem
                                value={`${duration.id.toString()}`}
                                id={`duration-${duration.id}`}
                                className="peer sr-only"
                              />
                              <Label
                                htmlFor={`duration-${duration.id}`}
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                              >
                                <span className="text-lg font-semibold">
                                  {e2pNumber(
                                    Math.floor(
                                      duration.durationDays / 30
                                    ).toString()
                                  )}{" "}
                                  {t("months")}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {e2pNumber(duration.price.toLocaleString())}{" "}
                                  {t("currency")}
                                </span>
                              </Label>
                            </div>
                          ))}
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center gap-x-1 text-sm font-semibold">
              <span>{t("totalPayment")}:</span>
              <span className="text-primary">
                {e2pNumber(totalPrice.toLocaleString())} {t("currency")}
              </span>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isPayLoading}
            >
              {isPayLoading ? <LoadingSpinner /> : t("choosePlan")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
