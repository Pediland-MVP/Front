"use client";
import { Button } from "@/components/theme/ui/button";
import { AppSidebar } from "./components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/theme/ui/sidebar";
import { UserNamespace } from "@/types/user";
import { Rocket } from "@phosphor-icons/react/dist/ssr";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import useSWRImmutable from "swr/immutable";
import Header from "./components/header";
import { HeaderToolsProvider } from "./components/context/headerToolsContext";

const Layout = ({ children }: { children: React.ReactNode }) => {
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
    }
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

  const pathname = usePathname();

  const lockedPaths = [
    "/console/inbox",
    "/console/comments",
    "/console/actions/content-cycle/",
    "/console/automations",,
    '/console/actions/content-cycle/',
    '/console/automations'
  ];

  const isLocked = lockedPaths.some((path) => pathname.startsWith(path));

  return (
    <SidebarProvider>
      <AppSidebar side={locale === "fa" ? "right" : "left"} />
      <SidebarInset>
        <HeaderToolsProvider>
          <Header />
          <div className="relative">
            {isLimited && isLocked && (
              <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center bg-white z-50">
                <Rocket className="w-40 h-40" />
                <h1 className="text-4xl font-bold">
                  {t("youDontHaveSubscription")}
                </h1>
                <p className="text-lg">{t("youShouldBuySubscription")}</p>
                <Link
                  href="/console/settings/upgrade"
                  className="mt-5 w-full flex justify-center items-center"
                >
                  <Button className="w-40 flex justify-center items-center gap-y-1">
                    <Rocket size={22} />
                    <span>خرید اشتراک</span>
                  </Button>
                </Link>
              </div>
            )}
            {children}
          </div>
        </HeaderToolsProvider>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;
