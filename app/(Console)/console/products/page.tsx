import Link from "next/link";
import React from "react";
import ProductListTable from "./components/productListTable";
import { useTranslations } from "next-intl";
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

export default function Page() {
  const t = useTranslations('Products')
  return (
    <div className="_products">
      <header className="bg-white px-4 py-3 h-16 flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4 border-b-2 border-gray-100">
        <div className="_wrap flex items-center gap-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/console">{t('dashboard')}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{t('title')}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="_tools">
          <Link href="/console/products/add">
            <Button size={"sm"}>
              <span className="hidden sm:inline"> {t('add')}</span>{" "}
              <Plus size={20} />
            </Button>
          </Link>
        </div>
      </header>

      <ProductListTable />
    </div>
  );
}
