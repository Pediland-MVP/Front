// src/components/layout/NavBottom.tsx
"use client";

import { cn } from "@befroosh/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

// UI Imports
import { AnimatedGradient } from "@/components/Global/animatedGradient";
import { Button } from "@/components/ui/button";
import { IconProps } from "@phosphor-icons/react";
import React, {
  HTMLAttributeAnchorTarget,
  ReactElement,
  useState,
} from "react";
import { LinkStatusTracker } from "../../app/(Console)/components/linkStatusTracker";

export interface NavItem {
  icon: ReactElement<IconProps>;
  label: ReactElement<HTMLParagraphElement>;
  labelClassName?: string;
  href: string;
  target?: HTMLAttributeAnchorTarget;
  onClick?: () => void;
  isMain?: boolean;
}

interface BottomNavbarProps {
  items: NavItem[];
}

export const NavBottom = ({ items }: BottomNavbarProps) => {
  const [isNavigationPending, setIsNavigationPending] =
    useState<boolean>(false);

  const pathname = usePathname();
  return (
    <nav className="fixed right-0 bottom-0 left-0 z-50 h-14 border-t border-gray-100 bg-gray-50 md:hidden">
      {isNavigationPending && (
        <AnimatedGradient
          colors={["#93c5fd", "#3b82f6", "#1e3a8a"]}
          className="flex h-1 items-center justify-center rounded-lg"
          animationDuration="1s"
        ></AnimatedGradient>
      )}

      <div className="flex items-end justify-around gap-x-2 px-2">
        {items.map((item, index) => {
          const Icon = item.icon;
          const Label = item.label;

          if (item.isMain) {
            return (
              <Button
                key={index}
                asChild
                size="lg"
                className={cn(
                  "z-50 -mt-5 flex h-18 flex-col gap-0.5 rounded-t-xl rounded-b-none bg-blue-200 px-2.5 text-blue-950 shadow-lg [&_svg]:-ml-0 [&_svg]:size-8",
                  pathname.startsWith(item.href) && "bg-blue-500 text-white",
                )}
                type="button"
                {...(item.onClick && { onClick: item.onClick })}
              >
                <Link href={item.href} target={item.target}>
                  {React.cloneElement(Icon, {
                    className: cn(Icon.props.className),
                  })}
                  {React.cloneElement(Label, {
                    className: cn("text-xs font-normal", Label.props.className),
                  })}
                  <LinkStatusTracker
                    setIsNavigationPending={setIsNavigationPending}
                  />
                </Link>
              </Button>
            );
          }

          return (
            <Button
              {...(item.onClick && { onClick: item.onClick })}
              type="button"
              key={index}
              variant="ghost"
              size="lg"
              asChild
              className={cn(
                "flex h-14 w-full flex-col items-center justify-center gap-0.5 rounded-none px-0 [&_svg]:-ml-0 [&_svg]:size-6",
                pathname.startsWith(item.href) && "bg-gray-200/75",
              )}
            >
              <Link href={item.href} target={item.target}>
                {React.cloneElement(Icon, {
                  className: cn(Icon.props.className),
                })}
                {React.cloneElement(Label, {
                  className: cn("text-xs font-normal", Label.props.className),
                })}
                <LinkStatusTracker
                  setIsNavigationPending={setIsNavigationPending}
                />
              </Link>
            </Button>
          );
        })}
      </div>
    </nav>
  );
};
