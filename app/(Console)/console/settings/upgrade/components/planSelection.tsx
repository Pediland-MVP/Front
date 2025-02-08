"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { usePlanSelection } from "../hooks/usePlanSelection";
import LoadingSpinner from "@/components/ui/loadingSpinner";
import e2pNumber from "@/app/utils/e2pNumber";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import numberToK from "@/app/utils/numberToK";
import LoadingButton from '@/components/ui/button-loading';
import usePayPlan from "../hooks/usePayPlan";
import { useEffect } from "react";

const planSchema = z.object({
  planId: z.number(),
  durationId: z.number(),
});

type FormValues = z.infer<typeof planSchema>;

export function PlanSelection() {
  const { plans, isPlansLoading } = usePlanSelection();

  const form = useForm<FormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      planId: 0,
      durationId: 0,
    },
  });

  const { pay, isPayLoading } = usePayPlan()

  useEffect(() => {
    if (!plans) return;
    form.setValue('planId', plans[0].id)
    form.setValue('durationId', plans[0].durations[0].id)
  }, [plans])

  const onPlanChange = (id: number) => {
    if (!plans) return;
    form.setValue("planId", id)
    const planId = plans?.findIndex(plan => plan.id === id)!
    form.setValue("durationId", plans[planId].durations[0].id)
  }

  const onSubmit = (data: FormValues) => {
    pay(data)
  };

  if (isPlansLoading || !plans) {
    return <LoadingSpinner />;
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full max-w-5xl mx-auto p-4 font-vazirmatn"
        dir="rtl"
      >
        <h1 className="text-3xl font-bold text-right mb-8">
          طرح خود را انتخاب کنید
        </h1>

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
                          دنبال‌کننده
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          {e2pNumber(plan.durations[0]?.price.toLocaleString())}{" "}
                          تومان
                        </p>
                        <p className="text-muted-foreground">
                          برای{" "}
                          {e2pNumber(
                            (
                              plan.durations[0]?.durationDays ?? 0 / 30
                            ).toLocaleString()
                          )}{" "}
                          ماه
                        </p>
                      </CardContent>
                    </Card>
                  </FormControl>
                ))}
              </div>
            </FormItem>
          )}
        />

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">
            مدت زمان را انتخاب کنید
          </h2>
          <FormField
            control={form.control}
            name="durationId"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <RadioGroup
                    className="flex flex-wrap gap-4 flex-row-reverse"
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={field.value.toString()}
                  >
                    {plans
                      .find((p) => p.id === form.watch("planId"))
                      ?.durations.map((duration) => (
                        <div
                          key={duration.id}
                          className="w-[calc(50%-8px)] md:w-[calc(25%-12px)] flex-shrink-0"
                        >
                          <RadioGroupItem
                            value={duration.id.toString()}
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
                              ماه
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {e2pNumber(duration.price.toLocaleString())} تومان
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

        <CardFooter className="mt-8">
          <LoadingButton isLoading={isPayLoading} type="submit" className="w-full" size="lg">
            انتخاب طرح
          </LoadingButton>
        </CardFooter>
      </form>
    </Form>
  );
}
