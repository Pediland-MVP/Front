"use client";

import { useLogout } from "@/hooks/swr/api-client";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Spinner,
  useSidebar,
} from "@components";
import { CrownIcon, LogOutIcon, UserRoundPenIcon } from "lucide-react";

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
  const logout = useLogout();

  const t = useTranslations("Console.Sidebar");

  const routeHandler = (route: string) => {
    router.push(route);
    setOpenMobile(false);
  };

  const logoutHandler = async () => {
    setIsLogoutLoading(true);

    try {
      const success = await logout();
      if (success) {
        router.push(process.env.NEXT_PUBLIC_LANDING_URL || "/auth");
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLogoutLoading(false);
    }
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
            className="hover:text-primary text-secondary cursor-pointer"
            onClick={() => routeHandler("/settings/upgrade")}
          >
            <CrownIcon />
            <span>{t("upgradeAccount")}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem
            className="hover:text-primary text-secondary cursor-pointer"
            onClick={() => routeHandler("/profile")}
          >
            <UserRoundPenIcon />
            {t("profile")}
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={logoutHandler}
          className="text-secondary flex cursor-pointer items-center"
        >
          {isLogoutLoading ? <Spinner /> : <LogOutIcon />}
          {t("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
