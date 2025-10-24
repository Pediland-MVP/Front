import { SubscriptionProvider } from "./context/SubscriptionContext";

import { ChoosePlan, SubscriptionsDetails } from "@components";
import { useTranslations } from "next-intl";

export default function Upgrade() {
  const t = useTranslations("Upgrade");

  return (
    <SubscriptionProvider>
      <div className="_subscription-page flex-1 rounded-t-3xl bg-white md:rounded-t-none md:rounded-b-xl">
        <div className="flex h-full flex-col border-gray-100 px-4 py-5 md:pt-0">
          <div className="mb-3 space-y-1">
            <h2 className="text-primary font-semibold">{t("title")}</h2>
            {/* <p className="text-muted-foreground text-sm">{t("description")}</p> */}
          </div>

          <SubscriptionsDetails />
          <ChoosePlan />
        </div>
      </div>
    </SubscriptionProvider>
  );
}
