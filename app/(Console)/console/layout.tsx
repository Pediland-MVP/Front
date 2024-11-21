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
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;
