"use client";
import Link from "next/link";
import { useState } from "react";
import { Suspense } from "react";
import Accounts from "./components/accounts";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { InstagramNamespace } from "@/types/instagram";
// Just UI Imports Below
import { Button } from "@/components/theme/ui/button";
import { Plus } from "@phosphor-icons/react/dist/ssr";


export default function AccountPage() {
  const t = useTranslations("Settings.Accounts");
  const router = useRouter();
  const [filteredInstagramPages, setfilteredInstagramPages] = useState<InstagramNamespace.GET['Accounts'] | null>()

  return (
    <div className="_accounts-page">
      <div className="_tools px-5 py-3 flex flex-col xl:flex-row xl:justify-end xl:items-center gap-4">
        <Link href={`${process.env.NEXT_PUBLIC_BACK_API_URL}/instagram/connectIG`}>
          <Button size={"sm"}>
            <span className="hidden sm:inline">{t("add")}</span>{" "}
            <Plus size={20} />
          </Button>
        </Link>
      </div>

      <div className="_cards p-5 grid sm:grid-cols-5 gap-5">
        <Suspense>
          <Accounts filteredInstagramPages={filteredInstagramPages} setFilteredInstagramPages={setfilteredInstagramPages} />
        </Suspense>
      </div>
    </div>
  );
}
