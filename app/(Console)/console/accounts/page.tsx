"use client";
import Link from "next/link";
import React from "react";
import { Suspense } from "react";
import Accounts from "./components/accounts";

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
  return (
    <div className="_accounts">
      <header className="px-4 pt-4 flex justify-between items-center gap-4">
        <div className="_wrap flex items-center gap-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink>
                  <Link href="/console">داشبورد</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>مدیریت اکانت‌ها</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="_tools">
          <Link href="#">
            <Button size={"sm"}>
              <span className="hidden sm:inline">افزودن</span>{" "}
              <Plus size={20} />
            </Button>
          </Link>
        </div>
      </header>

      <div className="_cards p-4 grid sm:grid-cols-5 gap-5">
        <Suspense>
          <Accounts />
        </Suspense>
      </div>
    </div>
  );
}
