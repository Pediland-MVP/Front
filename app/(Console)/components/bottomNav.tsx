import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LinkStatusTracker } from "./linkStatusTracker";
import React, {
  HTMLAttributeAnchorTarget,
  ReactElement,
  useState,
} from "react";
import { AnimatedGradient } from "@/components/global/animatedGradient";
import { IconProps } from "@phosphor-icons/react";

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

export function BottomNav({ items }: BottomNavbarProps) {
  const [isNavigationPending, setIsNavigationPending] =
    useState<boolean>(false);

  const pathname = usePathname();
  return (
    <nav className="fixed h-[70px] bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
      {isNavigationPending && (
        <AnimatedGradient
          colors={["#93c5fd", "#3b82f6", "#1e3a8a"]}
          className="h-1 rounded-lg flex items-center justify-center"
          animationDuration="1s"
        ></AnimatedGradient>
      )}
      <div className="flex items-end justify-around px-2 py-2 gap-x-1">
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
                  "flex flex-col gap-1 h-16 w-16 rounded-full shadow-lg -mt-6 bg-gray-600 z-50",
                  pathname.startsWith(item.href) && "bg-blue-500"
                )}
                type="button"
                {...(item.onClick && { onClick: item.onClick })}
              >
                <Link href={item.href} target={item.target}>
                  {React.cloneElement(Icon, {
                    className: cn("h-6 w-6", Icon.props.className),
                  })}
                  {React.cloneElement(Label, {
                    className: cn(
                      "text-[10px] font-medium",
                      Label.props.className
                    ),
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
                "flex flex-col gap-1 h-12 w-full p-1",
                pathname.startsWith(item.href) && "bg-gray-200/70"
              )}
            >
              <Link href={item.href} target={item.target}>
                {React.cloneElement(Icon, {
                  className: cn("h-4 w-4", Icon.props.className),
                })}
                {React.cloneElement(Label, {
                  className: cn("text-xs", Label.props.className),
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
}
