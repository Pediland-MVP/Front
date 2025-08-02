// app/(Console)/components/layout/consoleProvider.tsx
"use client";

import { UserNamespace } from "@/types/user";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import useSWRImmutable from "swr/immutable";

// UI Imports Here
import { SidebarInset, SidebarProvider } from "@/components/theme/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { HeaderFeaturesProvider } from "../context/headerFeaturesContext";
import Header from "../header";

const ConsoleProvider = ({ children }: { children: React.ReactNode }) => {
  const t = useTranslations("ConsoleLayout");
  const locale = useLocale();
  const [isLimited, setIsLimited] = useState(false);

  const {
    data: userData,
    error: userError,
    isLoading: userIsLoading,
  } = useSWRImmutable<UserNamespace.GET.User>(
    `${process.env.NEXT_PUBLIC_BACK_API_URL}/users/me`,
    {
      revalidateOnMount: true,
      refreshInterval: 30_000,
    },
  );

  useEffect(() => {
    if (!userIsLoading && userData) {
      if (userData.subscriptions.length === 0) {
        setIsLimited(true);
      } else {
        setIsLimited(false);
      }
    }
  }, [userData, userError, userIsLoading]);

  return (
    <SidebarProvider>
      <AppSidebar side={locale === "fa" ? "right" : "left"} />

      <SidebarInset>
        <HeaderFeaturesProvider>
          <Header />
          {children}
        </HeaderFeaturesProvider>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default ConsoleProvider;
