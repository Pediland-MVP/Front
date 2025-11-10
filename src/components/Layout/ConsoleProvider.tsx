"use client";

import { useLocale } from "next-intl";
import { SidebarInset, SidebarProvider } from "../ui";
import { ConsoleHeader } from "./ConsoleHeader";
import { ConsoleSidebar } from "./ConsoleSidebar";

export const ConsoleProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
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
