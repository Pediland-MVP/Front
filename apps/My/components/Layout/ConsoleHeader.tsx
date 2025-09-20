// src/components/layout/consoleHeader.tsx
"use client";

import { useHeaderFeatures } from "@/lib/stores/useHeaderFeatures";
import { usePathname } from "next/navigation";

import { HeaderBreadcrumb, SidebarTrigger } from "@befroosh/ui";
import { cn } from "@befroosh/lib";

export const ConsoleHeader = () => {
  const { buttons, tools } = useHeaderFeatures();
  const pathname = usePathname();

  if (pathname === "/") return null;

  return (
    <header
      className={cn(
        "flex items-center border-b-2 border-gray-100 px-3 py-2.5",
        !tools && !buttons && "min-h-12",
      )}
    >
      <div className="flex w-full flex-wrap items-center md:flex-nowrap md:gap-2">
        <div className="flex items-center gap-1.5 md:order-1 md:flex-1">
          <SidebarTrigger />
          <HeaderBreadcrumb />
        </div>

        <div className="flex flex-1 items-center justify-end gap-2 md:order-3 md:flex-initial">
          {buttons && <div className="_buttons flex gap-1.5">{buttons}</div>}
        </div>

        {tools && (
          <div className="_tools w-full md:order-2 md:w-auto">{tools}</div>
        )}
      </div>
    </header>
  );
};
