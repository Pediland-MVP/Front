// Refactored
"use client";

import { useLocale, useTranslations } from "next-intl";

import {
  ConsoleHeader,
  ConsoleSidebar,
  SidebarInset,
  SidebarProvider,
} from "@components";

export const ConsoleProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const t = useTranslations("ConsoleLayout");
  const locale = useLocale();

  return (
    <SidebarProvider>
      <ConsoleSidebar side={locale === "fa" ? "right" : "left"} />

      <SidebarInset>
        <ConsoleHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
};
