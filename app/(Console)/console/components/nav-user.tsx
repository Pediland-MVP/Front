"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import logger from "@/app/utils/logger";
// UI
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/theme/ui/sidebar";
import { toast } from "@/components/ui/use-toast";
import LoadingSpinner from "@/components/ui/loadingSpinner";
import { Sparkle, SignOut, IdentificationBadge, CaretUpDown, UserCircle } from "@phosphor-icons/react/dist/ssr";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/theme/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground focus-visible:ring-none"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-transparent">
                  <UserCircle size={28} weight="duotone" />
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-right text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
              </div>
              <CaretUpDown size={20} className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="start"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuItem className="text-gray-400">
                <Sparkle size={22} className="text-gray-400" />
                {t("upgradeAccount")} <span className="font-light">({t("soon")})</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer hover:text-primary" onClick={() => router.push("/console/profile")} >
                <IdentificationBadge size={22} />
                {t("profile")}
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={logoutHandler} className="cursor-pointer">
              {isLogoutLoading ? <LoadingSpinner /> : <SignOut size={22} />}
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
