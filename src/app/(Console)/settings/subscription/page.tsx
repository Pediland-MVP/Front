"use client";

import { useSubscriptionData } from "@/store/subscriptionStore";
import { useTranslations } from "next-intl";

import { ChoosePlan, LayoutSettings, SubscriptionsDetails } from "@components";

export default function SubscriptionPage() {
  const t = useTranslations("Subscription");

  useSubscriptionData();

  return (
    <LayoutSettings className="_subscription-page">
      <div className="mb-3 space-y-1">
        <h2 className="text-primary font-semibold">{t("title")}</h2>
      </div>

      <SubscriptionsDetails />

      <ChoosePlan />
    </LayoutSettings>
  );
}
