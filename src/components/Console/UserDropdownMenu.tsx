"use client";

import api, { clearAccessToken } from "@/hooks/swr/api-client";
import { AxiosResponse } from "axios";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  LoaderSpin,
  useSidebar,
} from "@components";
import { CrownIcon, LogOutIcon, UserRoundPenIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserDropdownMenuProps {
  children: React.ReactNode;
  size?: "md" | "sm";
}

export const UserDropdownMenu = ({
  children,
  size = "md",
}: UserDropdownMenuProps) => {
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();
  const [isLogoutLoading, setIsLogoutLoading] = useState<boolean>(false);

  const t = useTranslations("Console.Sidebar");

  const routeHandler = (route: string) => {
    router.push(route);
    setOpenMobile(false);
  };

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

  return (
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>

      <DropdownMenuContent
        className={cn(
          "w-[--radix-dropdown-menu-trigger-width] rounded-lg",
          size === "md" && "min-w-56",
          size === "sm" && "min-w-40",
        )}
        side="top"
        align="start"
        sideOffset={4}
      >
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="hover:text-primary cursor-pointer"
            onClick={() => routeHandler("/settings/upgrade")}
          >
            <CrownIcon />
            <span>{t("upgradeAccount")}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem
            className="hover:text-primary cursor-pointer"
            onClick={() => routeHandler("/profile")}
          >
            <UserRoundPenIcon />
            {t("profile")}
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={logoutHandler}
          className="hover:text-primary cursor-pointer"
        >
          {isLogoutLoading ? <LoaderSpin /> : <LogOutIcon />}
          {t("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
