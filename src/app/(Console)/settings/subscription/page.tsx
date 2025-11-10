"use client";

import { useTranslations } from "next-intl";

import { LayoutSettings } from "@/components/Layout/LayoutSettings";
import { ChoosePlan } from "@/components/Settings/ChoosePlan";
import { SubscriptionsDetails } from "@/components/Settings/SubscriptionsDetails";

export default function SubscriptionPage() {
  const t = useTranslations("Subscription");

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
