import Link from "next/link";
import React from "react";
import ProductListTable from "./components/productListTable";

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
  return (
    <div className="_products">
      <header className="px-4 pt-4 flex justify-between items-center gap-4">
        <div className="_wrap flex items-center gap-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/console">داشبورد</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>لیست کالاها / خدمات</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="_tools">
          <Link href="/console/products/add">
            <Button size={"sm"}>
              <span className="hidden sm:inline">افزودن</span>{" "}
              <Plus size={20} />
            </Button>
          </Link>
        </div>
      </header>

      <div className="p-4">
        <ProductListTable />
      </div>
    </div>
  );
}
