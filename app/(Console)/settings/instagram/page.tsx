"use client";

import Link from "next/link";
import { useState, use, useEffect } from "react";
import { Suspense } from "react";
import Accounts from "./components/accounts";
import { useTranslations } from "next-intl";
import { InstagramNamespace } from "@/types/instagram";
// UI Imports Here
import { Button } from "@/components/theme/ui/button";
import { Card } from "@/components/theme/ui/card";
import useUser from "@/hooks/useUser";
import StartKit from "../../components/startKit";
import LoadingSpinner from "@/components/theme/ui/loadingSpinner";
import { Plug } from "@phosphor-icons/react/dist/ssr";
import ConnectInstagram from "./components/connectInstagram";

type AccountPageProps = {
  searchParams: Promise<{ isAfterPurchasingPlan?: string, code: string }>;
};
export default function AccountPage({ searchParams }: AccountPageProps) {
  const isAfterPurchasingPlan = use(searchParams)?.isAfterPurchasingPlan;
  const code = use(searchParams)?.code

  const t = useTranslations("Settings.Accounts");

  const [filteredInstagramPages, setfilteredInstagramPages] = useState<
    InstagramNamespace.GET["Accounts"] | null
  >();

  const { hasSubscription, hasInstagram, isLoading, error } = useUser();

  if (code) {
    return (
      <ConnectInstagram/>
    )
  }

  if (isLoading)
    return (
      <div className="_accounts-page flex h-full">
        <div className="sm:w-3/5 h-full">
          <Card className="border-l-2 border-gray-100 h-full p-6">
            <LoadingSpinner className="h-full" />
          </Card>
        </div>
      </div>
    );

  if (!hasInstagram) {
    return <StartKit isAfterPurchasingPlan />;
  }

  return (
    <div className="_accounts-page flex h-full">
      <div className="sm:w-3/5 h-full">
        <Card className="border-l-2 border-gray-100 h-full p-6">

            <div className="mb-6">
              <h2 className="font-semibold text-primary mb-1">{t("title")}</h2>
              <p className="text-[15px] text-muted-foreground">
                {t("description")}
              </p>
            </div>

            <Suspense>
              <Accounts
                filteredInstagramPages={filteredInstagramPages}
                setFilteredInstagramPages={setfilteredInstagramPages}
              />
            </Suspense>
        </Card>
      </div>
    </div>
  );
}
