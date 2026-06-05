"use client";

import { useTranslations } from "next-intl";
import { usePermissions } from "@/hooks/usePermissions";

import { LayoutSettings } from "@/components/Layout/LayoutSettings";
import { ChoosePlan } from "@/components/Settings/ChoosePlan";
import { SubscriptionsDetails } from "@/components/Settings/SubscriptionsDetails";

export default function SubscriptionPage() {
  const t = useTranslations("Subscription");
  const t_ec = useTranslations("ERROR_CODES");
  const { can, isLoading } = usePermissions();

  if (isLoading) {
    return (
      <LayoutSettings className="_subscription-page">
        <div className="flex h-[200px] items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </LayoutSettings>
    );
  }

  if (!can("billing:view")) {
    return (
      <LayoutSettings className="_subscription-page">
        <div className="mb-3 space-y-1">
          <h2 className="text-primary font-semibold">{t("title")}</h2>
        </div>
        <div className="py-12 text-center text-muted-foreground text-sm border rounded-xl bg-white shadow-xs">
          {t_ec("PERMISSION_DENIED")}
        </div>
      </LayoutSettings>
    );
  }

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
