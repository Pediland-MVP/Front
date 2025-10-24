"use client";

import { useSubscriptionContext } from "@/app/(Console)/settings/subscription/context/SubscriptionContext";
import usePayPlan from "@/app/(Console)/settings/subscription/hooks/usePayPlan";
import { cn } from "@/lib/utils";
import e2pNumber from "@/utils/e2pNumber";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { IPlan } from "@/types/plans/plans";
import { formatNumber } from "@/utils/formatNumber";
import logger from "@/utils/logger";
import { DiscountAlert, DiscountCode, LoaderSpin } from "@components";
import {
  ClockCountdownIcon,
  PackageIcon,
  SealCheckIcon,
} from "@phosphor-icons/react/dist/ssr";

const planSchema = z.object({
  planId: z.number(),
  durationId: z.number(),
});

type FormValues = z.infer<typeof planSchema>;

export const ChoosePlan = () => {
  const t = useTranslations("Upgrade.PlanSelection");

  const {
    isLoading: isPlansLoading,
    active,
    setActive,
    subscriptions,
    plansData,
    plans,
    discountCode,
  } = useSubscriptionContext();

  console.log("Active...", active);
  console.log("Subscriptions...", subscriptions);
  console.log("PlansData...", plansData);
  console.log("Plans...", plans);
  console.log("DiscountCode...", discountCode);

  const [period, setPeriod] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loadingPlanId, setLoadingPlanId] = useState<number | null>(null);
  const [currentPlan, setCurrentPlan] = useState<IPlan>();
  const { pay, isPayLoading } = usePayPlan();

  useEffect(() => {
    // if (!planId || !plansData || !plans) return;
    const myPlan = plans[0];

    setCurrentPlan(myPlan);
  }, [plans]);
  console.log("plans", currentPlan);

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
    // setLoadingPlanId(data.planId);
    // try {
    //   await pay({ ...data, ...(discountCode && { discountCode }) }, setActive);
    // } finally {
    //   setLoadingPlanId(null);
    // }
  };

  // const getPriceString = (price: number, durationDays: number) => {
  //   if (price === 0) return t("free");

  //   logger.debug("period", period, price);
  //   return e2pNumber(
  //     (
  //       Math.trunc(+(price / (durationDays / 30)).toFixed(0) / 500) * 500
  //     ).toLocaleString(),
  //   );
  // };

  // useEffect(() => {
  //   console.log("p-active", plans, active);
  // }, [active, plans]);

  console.log("ChoosePlan", active.choosePlan);
  if (!active.choosePlan) return null;

  return (
    <div className="flex-1 space-y-4">
      <Card className="border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-violet-50 pb-7">
        <CardContent>
          <h2 className="text-gradient mb-5 flex items-center gap-2 text-lg font-semibold">
            <PackageIcon
              size={26}
              weight="duotone"
              className="text-secondary"
            />
            بسته مناسب برای پیج‌ شما: ({currentPlan?.name})
          </h2>

          {currentPlan?.features.length > 0 && (
            <div>
              <ul className="grid grid-cols-2 gap-2.5 px-1.5">
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
      <DiscountAlert />
      {currentPlan?.durations.length > 0 && (
        <div>
          <h3 className="text-secondary mb-4 flex items-center gap-1 text-[15px] font-medium">
            <ClockCountdownIcon size={20} />
            لطفا اشتراک مناسب خود را انتخاب کنید:
          </h3>

          <div className="flex gap-4">
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
                      "flex w-full flex-col items-center justify-around rounded-t-xl px-4 py-5",
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
                      اشتراک {duration.name}
                    </h4>
                    <div className="flex w-full items-center justify-center gap-1">
                      <div className="flex flex-col items-center">
                        <div className="text-gray-400 line-through">
                          {formatNumber(155000)}
                        </div>
                        {/* <div>{duration.discountPrice}</div> */}
                        <div
                          className={cn(
                            "text-xl font-bold",
                            id === topId
                              ? "text-green-600"
                              : "text-secondary/70",
                          )}
                        >
                          {formatNumber(duration.price)}
                        </div>
                        <div className="text-muted-foreground">تـومـان</div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="w-full p-0">
                    <Button
                      type="button"
                      variant="ghost"
                      className={cn(
                        "h-9 w-full !rounded-t-none !rounded-b-xl",
                        id === topId
                          ? "text-primary hover:text-primary bg-violet-100/90 hover:bg-violet-200/70"
                          : "text-secondary/70 hover:text-secondary bg-blue-100/70 hover:bg-blue-100",
                      )}
                      onClick={() => changePlan(duration.id)}
                    >
                      خرید
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <DiscountCode />
    </div>

    //     <div className="_plans-wrapper">
    //       <div className="_selector flex flex-col items-center justify-center">
    //         <div className="inline-flex w-full flex-col items-center gap-1.5 rounded-xl border p-1 shadow-sm sm:rounded-full md:w-fit md:flex-row">
    //           {plans.map((plan) => (
    //             <button
    //               key={plan.id}
    //               type="button"
    //               onClick={() => changePlan(plan.id)}
    //               className={cn(
    //                 "w-full rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-300 md:w-fit md:rounded-full",
    //                 plan.id === form.getValues("planId")
    //                   ? "bg-gray-300"
    //                   : "text-zinc-600 hover:text-zinc-900",
    //               )}
    //             >
    //               {plan.name}
    //             </button>
    //           ))}
    //         </div>
    //       </div>

    //       <Form {...form}>
    //         <form
    //           onSubmit={form.handleSubmit(onSubmit)}
    //           className="my-6 grid grid-cols-1 gap-4 md:grid-cols-3"
    //         >
    //           {currentPlan?.durations.map((duration) => {
    //             const haveMonthlyDiscount =
    //               typeof duration.monthlyDiscount === "number" &&
    //               duration.monthlyDiscount >= 0;

    //             const haveDurationDiscount =
    //               typeof duration.discountPrice === "number" &&
    //               duration.discountPrice >= 0;

    //             return (
    //               <div
    //                 key={duration.id}
    //                 className={cn(
    //                   "group relative backdrop-blur-sm",
    //                   "rounded-xl transition-all duration-300",
    //                   "flex flex-col",
    //                   "bg-gradient-to-b from-green-100/25 to-transparent",
    //                   "border shadow-md hover:shadow-lg",
    //                   "min-h-64",
    //                 )}
    //               >
    //                 <div className="p-4">
    //                   <h3 className="mb-4 text-center text-xl font-semibold text-teal-900">
    //                     {duration.name}
    //                   </h3>
    //                   <div className="flex flex-col items-center justify-center">
    //                     {haveDurationDiscount && duration.discountPrice == 0 ? (
    //                       <>
    //                         <span
    //                           className={cn(
    //                             "font-bold text-green-700",
    //                             "text-muted-foreground text-2xl font-medium line-through",
    //                           )}
    //                         >
    //                           {getPriceString(
    //                             duration.price,
    //                             duration.durationDays,
    //                           )}
    //                         </span>
    //                         <p className="text-xl font-bold text-green-700">
    //                           {t("free")}
    //                         </p>
    //                       </>
    //                     ) : haveDurationDiscount ? (
    //                       <>
    //                         <span
    //                           className={cn(
    //                             "font-bold text-green-700",
    //                             "text-muted-foreground text-2xl font-medium line-through",
    //                           )}
    //                         >
    //                           {getPriceString(
    //                             duration.price,
    //                             duration.durationDays,
    //                           )}
    //                         </span>

    //                         <span
    //                           className={cn(
    //                             "text-3xl font-bold text-green-700",
    //                           )}
    //                         >
    //                           {e2pNumber(
    //                             (+(
    //                               (duration?.discountPrice || 0) as number
    //                             ).toFixed(0)).toLocaleString(),
    //                           )}
    //                         </span>
    //                         <span className="text-muted-foreground text-lg font-medium">
    //                           {t("currency")} در {t("month")}
    //                         </span>
    //                       </>
    //                     ) : haveMonthlyDiscount ? (
    //                       <>
    //                         <span
    //                           className={cn(
    //                             "font-bold text-green-700",
    //                             "text-muted-foreground text-2xl font-medium line-through",
    //                           )}
    //                         >
    //                           {e2pNumber(
    //                             (+(duration.monthlyDiscount as number).toFixed(
    //                               0,
    //                             )).toLocaleString(),
    //                           )}
    //                         </span>

    //                         <span
    //                           className={cn(
    //                             "text-3xl font-bold text-green-700",
    //                           )}
    //                         >
    //                           {getPriceString(
    //                             duration.price,
    //                             duration.durationDays,
    //                           )}
    //                         </span>
    //                         <span className="text-muted-foreground text-lg font-medium">
    //                           {t("currency")} در {t("month")}
    //                         </span>
    //                       </>
    //                     ) : (
    //                       <>
    //                         <span
    //                           className={cn(
    //                             "text-3xl font-bold text-green-700",
    //                           )}
    //                         >
    //                           {getPriceString(
    //                             duration.price,
    //                             duration.durationDays,
    //                           )}
    //                         </span>
    //                         <span className="text-muted-foreground text-lg font-medium">
    //                           {t("currency")} در {t("month")}
    //                         </span>
    //                       </>
    //                     )}
    //                   </div>
    //                 </div>

    //                 <div className="mt-auto p-6 pt-2">
    //                   <Button
    //                     type="button"
    //                     onClick={() => {
    //                       form.setValue("durationId", duration.id);
    //                       setTotalPrice(duration.price);
    //                       form.handleSubmit(onSubmit)();
    //                     }}
    //                     className={cn(
    //                       "relative h-10 w-full border border-zinc-200 bg-green-600 text-white shadow-sm transition-all duration-300 hover:border-green-700 hover:bg-green-700 hover:shadow-md",
    //                     )}
    //                     disabled={isPayLoading && loadingPlanId === duration.id}
    //                   >
    //                     {isPayLoading && loadingPlanId === duration.id ? (
    //                       <LoaderSpin />
    //                     ) : (
    //                       t("choosePlan")
    //                     )}
    //                   </Button>
    //                 </div>
    //               </div>
    //             );
    //           })}
    //         </form>
    //       </Form>
    //     </div>

    //     {subscriptions?.length ? (
    //       <div className="mb-12 text-left md:mb-0">
    //         <Button
    //           onClick={() =>
    //             setActive({ planSelection: false, subscriptionInfo: true })
    //           }
    //           variant="link"
    //           size={"lg"}
    //         >
    //           بازگشت به اشتراک‌های من
    //           <ArrowLeft className="h-5 w-5" />
    //         </Button>
    //       </div>
    //     ) : null}
    //   </div>
    // </div>
  );
};
