// src/components/layout/navUser.tsx
"use client";

import api, { clearAccessToken } from "@/hooks/swr/api-client";
import { UserNamespace } from "@/types/user";
import { AxiosResponse } from "axios";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

// UI Imports
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@befroosh/ui";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@befroosh/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@befroosh/ui";
import { LoaderSpin } from "@befroosh/ui-custom";
import { toast } from "sonner";
import {
  CaretUpDownIcon,
  IdentificationBadgeIcon,
  SignOutIcon,
  SparkleIcon,
  UserCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { NavUserSkeleton } from "@components/index";

const NavUser = ({
  user,
  isLoading,
}: {
  user: UserNamespace.GET.User | undefined;
  isLoading: boolean;
}) => {
  const { isMobile, setOpenMobile } = useSidebar();
  const locale = useLocale();
  const t = useTranslations("Console.Sidebar");
  const [isLogoutLoading, setIsLogoutLoading] = useState<boolean>(false);

  const router = useRouter();
  const logoutHandler = async (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    e.preventDefault();
    setIsLogoutLoading(true);
    await api
      .delete("/auth/logout")
      .then(async (res: AxiosResponse) => {
        clearAccessToken();
        routeHandler(process.env.NEXT_PUBLIC_LANDING_URL);
      })
      .catch((e) => {
        toast.error(t("logoutFailed"));
      })
      .finally(() => {
        setIsLogoutLoading(false);
      });
  };

  const itemClickHandler = (path: string) => {
    setOpenMobile(false);
    router.push(path);
  };

  const routeHandler = (route: string) => {
    router.push(route);
    setOpenMobile(false);
  };

  if (isLoading || !user) {
    return <NavUserSkeleton />;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu dir="rtl">
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground focus-visible:ring-none group-data-[collapsible=icon]:px-0"
            >
              <Avatar className="h-7 w-7 rounded-lg">
                <AvatarImage src={undefined} alt={user.firstname} />
                <AvatarFallback className="bg-transparent">
                  <UserCircleIcon size={28} weight="duotone" />
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-right text-sm leading-tight">
                <span className="truncate font-semibold">
                  {user.firstname} {user.lastname}
                </span>
              </div>
              <CaretUpDownIcon size={20} className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side="top"
            align="start"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="hover:text-primary cursor-pointer"
                onClick={() => routeHandler("/settings/upgrade")}
              >
                <SparkleIcon size={22} />
                <span>{t("upgradeAccount")}</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem
                className="hover:text-primary cursor-pointer"
                onClick={() => routeHandler("/profile")}
              >
                <IdentificationBadgeIcon size={22} />
                {t("profile")}
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={logoutHandler}
              className="cursor-pointer"
            >
              {isLogoutLoading ? <LoaderSpin /> : <SignOutIcon size={22} />}
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

export default NavUser;
