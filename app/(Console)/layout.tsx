'use client'

import * as React from "react";2
import { Chat, User } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/registry/new-york/ui/resizable";
import { Separator } from "@/registry/new-york/ui/separator";
import { TooltipProvider } from "@/registry/new-york/ui/tooltip";
import { AccountSwitcher } from "@/app/(Console)/console/components/account-switcher";
import { Nav } from "@/app/(Console)/console/components/nav";
import { NextUIProvider } from "@nextui-org/react";
import { accounts } from "@/app/(Console)/console/data";
import { useState } from 'react';
import PanelLayout from "./console/components/panelLayout";

export default function Layout({ children }: { children: React.ReactNode }) {

  return (
    <NextUIProvider className="bg-white h-screen max-h-screen text-black">
      <TooltipProvider delayDuration={0}>
        <PanelLayout>
          {children}
        </PanelLayout>
      </TooltipProvider>
    </NextUIProvider>
  );
}
