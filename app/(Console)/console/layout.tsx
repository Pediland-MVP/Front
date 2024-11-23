// console/layout.tsx

"use client";

import { AppSidebar } from "./components/app-sidebar";
import { useTranslations } from "next-intl";
// Just UI Imports Below
import { SidebarInset, SidebarProvider } from "@/components/theme/ui/sidebar";

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
