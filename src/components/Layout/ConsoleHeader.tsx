// Refactored
"use client";

import { useHeaderFeatures } from "@/lib/stores/useHeaderFeatures";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import Link from "next/link";

import {
  HeaderBreadcrumb,
  LogoSlogan,
  LogoText,
  SidebarTrigger,
  useSidebar,
} from "@/components";
import { HeadsetIcon, ListIcon, SlidersIcon } from "@phosphor-icons/react";

export const ConsoleHeader = () => {
  const { buttons, tools } = useHeaderFeatures();
  const pathname = usePathname();

  if (pathname === "/") {
    const { toggleSidebar } = useSidebar();

    return (
      <header className="flex h-16 items-center justify-between gap-4 px-4 text-white md:hidden">
        <div className="flex items-center gap-4">
          <ListIcon size={28} onClick={toggleSidebar} />

          <Link href="https://t.me/+989360226688" target="_blank">
            <HeadsetIcon size={28} weight="duotone" />
          </Link>

          <Link href="/settings">
            <SlidersIcon size={28} weight="duotone" />
          </Link>
        </div>

        <div className="flex items-center gap-1.5">
          <LogoSlogan variant="white" />
          <LogoText variant="white" size="sm" />
        </div>
      </header>
    );
  }

  return (
    <header
      className={cn(
        "flex items-center border-gray-100 px-3 py-2.5 md:border-b-2",
        !tools && !buttons && "min-h-12",
      )}
    >
      <div className="flex w-full flex-wrap items-center md:flex-nowrap md:gap-2">
        <div className="flex items-center gap-1.5 md:order-1 md:flex-1">
          <SidebarTrigger />
          <HeaderBreadcrumb />
        </div>

        <div className="flex flex-1 items-center justify-end gap-2 md:order-3 md:flex-initial">
          {buttons && (
            <div className="_buttons flex items-center gap-1.5">{buttons}</div>
          )}
        </div>

        {tools && (
          <div className="_tools w-full md:order-2 md:w-auto">{tools}</div>
        )}
      </div>
    </header>
  );
};
