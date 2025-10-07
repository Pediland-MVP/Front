// Refactored
"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, {
  HTMLAttributeAnchorTarget,
  ReactElement,
  useState,
} from "react";

import { Avatar, AvatarFallback, AvatarImage, Button } from "@/components";
import { AnimatedGradient } from "@/components/Global/animatedGradient";
import { IconProps } from "@phosphor-icons/react";
import {
  ChatCenteredDotsIcon,
  ChatIcon,
  HouseIcon,
  PlusCircleIcon,
  ShoppingBagIcon,
  UserCircleIcon,
} from "@phosphor-icons/react/dist/ssr";

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
            size={28}
            className={cn(
              "text-muted-foreground",
              pathname === "/" && "text-primary",
            )}
          />
        </Link>

        <Link href="/directs">
          <ChatIcon
            size={28}
            className={cn(
              "text-muted-foreground",
              pathname === "/directs" && "text-primary",
            )}
          />
        </Link>

        <Link href="/automations">
          <PlusCircleIcon
            size={32}
            className={cn(
              "text-muted-foreground",
              pathname.startsWith("/automations") && "text-primary",
            )}
          />
        </Link>

        <Link href="/orders">
          <ShoppingBagIcon
            size={28}
            className={cn(
              "text-muted-foreground",
              pathname === "/orders" && "text-primary",
            )}
          />
        </Link>

        <UserCircleIcon size={30} weight="duotone" className="text-secondary" />
      </div>
    </nav>
  );
};
