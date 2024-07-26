'use client'

import * as React from "react";
import { TooltipProvider } from "@/registry/new-york/ui/tooltip";
import { NextUIProvider } from "@nextui-org/react";
import PanelLayout from "./components/panelLayout";

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
