"use client";

import Link from "next/link";
import { useState, use, useEffect } from "react";
import { Suspense } from "react";
import Accounts from "./components/accounts";
import { useTranslations } from "next-intl";
import { InstagramNamespace } from "@/types/instagram";
// UI Imports Here
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import useUser from "@/hooks/useUser";
import StartKit from "../../../../components/Console/startKit";
import { LoaderSpin } from "@/components/ui-custom/LoaderSpin";
import { Plug } from "@phosphor-icons/react/dist/ssr";
import ConnectInstagram from "./components/connectInstagram";

type AccountPageProps = {
  searchParams: Promise<{ isAfterPurchasingPlan?: string; code: string }>;
};
export default function AccountPage({ searchParams }: AccountPageProps) {
  const isAfterPurchasingPlan = use(searchParams)?.isAfterPurchasingPlan;
  const code = use(searchParams)?.code;

  const t = useTranslations("Settings.Accounts");

  const [filteredInstagramPages, setfilteredInstagramPages] = useState<
    InstagramNamespace.GET["Accounts"] | null
  >();

  const { hasSubscription, hasInstagram, isLoading, error } = useUser();

  console.log("hasSubscription", hasSubscription);
  console.log("hasInstagram", hasInstagram);
  console.log("isLoading", isLoading);
  console.log("error", error);

  if (code) {
    return <ConnectInstagram />;
  }

  return (
    <div className="_accounts-page flex h-full rounded-t-3xl bg-white md:rounded-t-none">
      <div className="h-full w-full sm:w-3/5">
        {isLoading ? (
          <LoaderSpin />
        ) : (
          <>
            <div className="h-full border-gray-100 px-4 py-5 md:border-l-2 md:p-6">
              <div className="mb-6">
                <h2 className="text-primary mb-1 font-semibold">
                  {t("title")}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {t("description")}
                </p>
              </div>

              <Suspense>
                <Accounts
                  filteredInstagramPages={filteredInstagramPages}
                  setFilteredInstagramPages={setfilteredInstagramPages}
                />
              </Suspense>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
