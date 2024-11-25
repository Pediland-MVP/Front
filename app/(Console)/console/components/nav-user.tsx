"use client";

import {
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/theme/ui/sidebar";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { SignOut } from "@phosphor-icons/react/dist/ssr";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import logger from "@/app/utils/logger";
import { useState } from "react";
import LoadingSpinner from "@/components/ui/loadingSpinner";

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

  const t = useTranslations("General");
  const [isLogoutLoading, setIsLogoutLoading] = useState<boolean>(false)

  const router = useRouter();
  const logoutHandler = async () => {
    setIsLogoutLoading(true)
    await fetch("/api/logout", {
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
      <SidebarMenuItem>
        <Button onClick={logoutHandler} size={"icon"} variant={"outline"}>
          {
            isLogoutLoading ? <LoadingSpinner/> : <SignOut size={24} />
          }
        </Button>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
