"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactElement } from "react";
import { useTranslations } from "next-intl";

import {
  HouseIcon,
  IconProps,
  LightningIcon,
  PlusCircleIcon,
  ShoppingBagIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";
import { UserDropdownMenu } from "../Console/UserDropdownMenu";

// Interface kept for reference or external use if needed, but internal logic uses a specific shape
export interface NavItem {
  icon: ReactElement<IconProps>;
  label: ReactElement<HTMLParagraphElement>;
  labelClassName?: string;
  href: string;
  target?: "_blank" | "_self" | "_parent" | "_top";
  onClick?: () => void;
  isMain?: boolean;
}

export const NavBottom = () => {
  const pathname = usePathname();
  const t = useTranslations("NavBottom");

  // Defined navigation items array
  const navItems = [
    {
      href: "/",
      icon: HouseIcon,
      labelKey: "home",
      isActive: (path: string) => path === "/",
    },
    {
      href: "/automations",
      icon: LightningIcon,
      labelKey: "list",
      isActive: (path: string) => path === "/automations",
    },
    {
      href: "/automations/add",
      icon: PlusCircleIcon,
      labelKey: "add",
      isActive: (path: string) => path.startsWith("/automations/add"),
      size: 32, // Specific size for the 'Add' button as per original code
    },
    {
      href: "/orders",
      icon: ShoppingBagIcon,
      labelKey: "orders",
      isActive: (path: string) => path === "/orders",
    },
    {
      isProfile: true,
      icon: UserCircleIcon,
      labelKey: "profile",
      size: 30, // Specific size for Profile as per original code
    },
  ];

  return (
    <nav className="fixed right-0 bottom-0 left-0 z-50 h-14 border-t border-gray-200/50 bg-white shadow-lg shadow-black md:hidden">
      <div className="flex h-full items-center justify-around">
        {navItems.map((item) => {
          // Render Profile Dropdown
          if (item.isProfile) {
            return (
              <UserDropdownMenu key={item.labelKey} size="sm">
                <div className="flex flex-col items-center justify-center">
                  <item.icon
                    size={item.size || 28}
                    weight="duotone"
                    className="text-secondary"
                  />
                  <span className="text-[10px] text-secondary">
                    {t(item.labelKey)}
                  </span>
                </div>
              </UserDropdownMenu>
            );
          }

          // Render Standard Links
          const isActive = item.isActive(pathname);
          const iconSize = item.size || 28;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center"
            >
              <item.icon
                weight="duotone"
                size={iconSize}
                className={cn(
                  "text-muted-foreground",
                  isActive && "text-primary"
                )}
              />
              <span
                className={cn(
                  "text-xs mt-1",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
