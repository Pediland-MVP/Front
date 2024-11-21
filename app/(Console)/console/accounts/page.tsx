"use client";
import { Button } from "@/components/ui/button";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import React, { useState } from "react";
import { Suspense } from "react";
import Accounts from "./components/accounts";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { InstagramNamespace } from "@/types/instagram";

export default function AccountPage() {
  const t = useTranslations("Accounts");
  const router = useRouter();
  const [filteredInstagramPages,  setfilteredInstagramPages] = useState<InstagramNamespace.GET['Accounts'] | null>()
  return (
    <div className="_accounts">
      <div className="_header flex justify-between items-center mb-4 h-9">
        <h1 className="text-xl font-bold">{t("title")}</h1>

        <div className="_tools">
          <Button
            onClick={() =>
              router.push(
                `${process.env.NEXT_PUBLIC_BACK_API_URL}/instagram/connectIG`
              )
            }
            className="gap-x-1 w-full lg:w-auto"
            disabled={(filteredInstagramPages?.length || 0) > 0}
          >
            {t("add")} <Plus className="mr-2 h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="_cards grid grid-cols-5 gap-5">
        <Suspense>
          <Accounts  filteredInstagramPages={filteredInstagramPages} setFilteredInstagramPages={setfilteredInstagramPages} />
        </Suspense>
      </div>
    </div>
  );
}
