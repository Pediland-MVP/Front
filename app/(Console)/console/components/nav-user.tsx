"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import logger from "@/app/utils/logger";

import {
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/theme/ui/sidebar";
import { Button } from "@/components/theme/ui/button";
import { toast } from "@/components/ui/use-toast";
import LoadingSpinner from "@/components/ui/loadingSpinner";
import { SignOut } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";


export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { isMobile } = useSidebar();
  const locale = useLocale();
  const t = useTranslations("General");
  const [isLogoutLoading, setIsLogoutLoading] = useState<boolean>(false)

  const router = useRouter();
  const logoutHandler = async () => {
    setIsLogoutLoading(true)
    await fetch(`${process.env.NEXT_PUBLIC_BACK_API_URL}/auth/logout`, {
      method: "DELETE",
      credentials: "include",
    })
      .then(async (res) => {

        logger.debug("res", await res.text())
        if (!res.ok) {
          toast({
            title: t("logoutFailed"),
            variant: "destructive",
          });
          return;
        }
        toast({
          title: t("logoutSuccess"),
        });
        router.push("/");
      })
      .catch(e => {
        toast({
          title: t("logoutFailed"),
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLogoutLoading(false)
      })
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem className="flex items-center justify-center sm:justify-end">
        <Button onClick={logoutHandler} variant={"link"} className="flex-row-reverse px-0">
          {
            isLogoutLoading ? <LoadingSpinner /> : <SignOut size={20} className={cn(locale === "fa" ? "rotate-180" : "")} />
          }
          <span>{t("logout")}</span>
        </Button>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
