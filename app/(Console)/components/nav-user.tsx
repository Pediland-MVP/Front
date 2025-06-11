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
import { NavUserSkeleton } from "./nav-user.skeleton";
import { UserNamespace } from "@/types/user";
import api, { clearAccessToken } from "@/hooks/swr/api-client";
import { AxiosResponse } from "axios";

export default function NavUser({
  user,
  isLoading
}: {
  user: UserNamespace.GET.User | undefined
  isLoading: boolean
}) {
  const { isMobile, setOpenMobile } = useSidebar();
  const locale = useLocale();
  const t = useTranslations("Console.Sidebar");
  const [isLogoutLoading, setIsLogoutLoading] = useState<boolean>(false)

  const router = useRouter();
  const logoutHandler = async (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault();
    setIsLogoutLoading(true)
    await api.delete("/auth/logout")
    .then(async (res: AxiosResponse) => {
      clearAccessToken()
      routeHandler(process.env.NEXT_PUBLIC_LANDING_URL)
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


  const routeHandler = (route: string) => {
    router.push(route)
    setOpenMobile(false)
  }

  if (isLoading || !user) {
    return <NavUserSkeleton/>
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu dir="rtl">
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground focus-visible:ring-none"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={undefined} alt={user.firstname} />
                <AvatarFallback className="bg-transparent">
                  <UserCircle size={28} weight="duotone" />
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-right text-sm leading-tight">
                <span className="truncate font-semibold">{user.firstname} {user.lastname}</span>
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
              <DropdownMenuItem className="cursor-pointer hover:text-primary" onClick={() => routeHandler("/settings/upgrade")}>
                <Sparkle size={22} />
                <span>{t("upgradeAccount")}</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer hover:text-primary" onClick={() => routeHandler("/profile")} >
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
