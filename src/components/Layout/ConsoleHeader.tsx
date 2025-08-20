// src/components/layout/consoleHeader.tsx
"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import React from "react";
import { BreadcrumbGenerator } from "../../app/(Console)/components/breadcrumbGenerator";
import { usePathname } from "next/navigation";
import { useHeaderFeatures } from "@/lib/stores/useHeaderFeatures";

export const ConsoleHeader = () => {
  const { buttons, tools } = useHeaderFeatures();
  const pathname = usePathname();

  if (pathname === "/") return null;

  return (
    <header className="flex flex-col gap-0 border-b border-gray-100 px-3 py-3.5 xl:flex-row xl:items-center xl:justify-between xl:gap-4 xl:border-b-2 xl:py-2">
      <div className="_wrap flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 xl:gap-4">
          <SidebarTrigger />
          <BreadcrumbGenerator />
        </div>
        {buttons && <div className="_buttons">{buttons}</div>}
      </div>

      {tools && <div className="_tools">{tools}</div>}
    </header>
  );
};
