import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LinkStatusTracker } from "./linkStatusTracker";
import { useState } from "react";
import { AnimatedGradient } from "@/components/global/animatedGradient";

export interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
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
          {
            isNavigationPending && (
              <AnimatedGradient
              colors={["#93c5fd", "#3b82f6", "#1e3a8a"]}
              className="h-1 rounded-lg flex items-center justify-center"
              animationDuration="1s"
            ></AnimatedGradient>
            )
          }
      <div className="flex items-end justify-around px-2 py-2 gap-x-1">
        {items.map((item, index) => {
          const Icon = item.icon;

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
                <Link href={item.href}>
                  <Icon className="h-6 w-6" />
                  <span className="text-[10px] font-medium">{item.label}</span>
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
              <Link href={item.href}>
                <Icon className="h-4 w-4" />
                <span className="text-xs">{item.label}</span>
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
