"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HTMLAttributeAnchorTarget, ReactElement } from "react";

import { UserDropdownMenu } from "@components";
import {
  HouseIcon,
  IconProps,
  LightningIcon,
  PlusCircleIcon,
  ShoppingBagIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";

export interface NavItem {
  icon: ReactElement<IconProps>;
  label: ReactElement<HTMLParagraphElement>;
  labelClassName?: string;
  href: string;
  target?: HTMLAttributeAnchorTarget;
  onClick?: () => void;
  isMain?: boolean;
}

export const NavBottom = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed right-0 bottom-0 left-0 z-50 h-14 border-t border-gray-200/50 bg-white shadow-lg shadow-black md:hidden">
      <div className="flex h-full items-center justify-around">
        <Link href="/">
          <HouseIcon
            weight="duotone"
            size={28}
            className={cn(
              "text-muted-foreground",
              pathname === "/" && "text-primary",
            )}
          />
        </Link>

        <Link href="/automations">
          <LightningIcon
            weight="duotone"
            size={28}
            className={cn(
              "text-muted-foreground",
              pathname === "/automations" && "text-primary",
            )}
          />
        </Link>

        <Link href="/automations/add">
          <PlusCircleIcon
            weight="duotone"
            size={32}
            className={cn(
              "text-muted-foreground",
              pathname.startsWith("/automations/add") && "text-primary",
            )}
          />
        </Link>

        <Link href="/orders">
          <ShoppingBagIcon
            weight="duotone"
            size={28}
            className={cn(
              "text-muted-foreground",
              pathname === "/orders" && "text-primary",
            )}
          />
        </Link>

        <UserDropdownMenu size="sm">
          <UserCircleIcon
            size={30}
            weight="duotone"
            className="text-secondary"
          />
        </UserDropdownMenu>
      </div>
    </nav>
  );
};
