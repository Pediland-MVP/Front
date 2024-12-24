"use client";
import Link from "next/link";
import React, { useState } from "react";
import { Suspense } from "react";
import Accounts from "./components/accounts";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { InstagramNamespace } from "@/types/instagram";
// Just UI Imports Below
import SidebarTrigger from "@/components/theme/ui/sidebar";
import { Button } from "@/components/theme/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/theme/ui/breadcrumb";
import { Plus } from "@phosphor-icons/react/dist/ssr";


export default function AccountPage() {
  const t = useTranslations("Accounts");
  const router = useRouter();
  const [filteredInstagramPages, setfilteredInstagramPages] = useState<InstagramNamespace.GET['Accounts'] | null>()
  return (
    <div className="_accounts">
      <header className="bg-white px-4 py-3 h-16 flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4 border-b-2 border-gray-100">
        <div className="_wrap flex items-center gap-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/console">{t("dashboard")}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{t('title')}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="_tools">
          <Link href={`${process.env.NEXT_PUBLIC_BACK_API_URL}/instagram/connectIG`}>
            <Button size={"sm"}>
              <span className="hidden sm:inline">{t("add")}</span>{" "}
              <Plus size={20} />
            </Button>
          </Link>
        </div>
      </header>

      <div className="_cards p-4 grid sm:grid-cols-5 gap-5">
        <Suspense>
          <Accounts filteredInstagramPages={filteredInstagramPages} setFilteredInstagramPages={setfilteredInstagramPages} />
        </Suspense>
      </div>
    </div>
  );
}
