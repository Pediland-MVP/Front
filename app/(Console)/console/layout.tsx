// console/layout.tsx

"use client";

import { AppSidebar } from "./components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/theme/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/theme/ui/sidebar";
import { useTranslations } from "next-intl";

const Layout = ({ children }: { children: React.ReactNode }) => {

  const t = useTranslations("Console");

  return (
    <SidebarProvider>
      <AppSidebar side="right" />
      <SidebarInset>
        <header className="px-4 pt-4 flex shrink-0 items-center gap-2">
          <div className="_wrap flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />

            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>{t('console')}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <main className="p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;
