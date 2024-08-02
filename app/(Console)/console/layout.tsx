'use client'

import * as React from "react";
import { TooltipProvider } from "@/registry/new-york/ui/tooltip";
import { NextUIProvider } from "@nextui-org/react";
import { Chat, User } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/registry/new-york/ui/resizable";
import { Separator } from "@/registry/new-york/ui/separator";
import { AccountSwitcher } from "@/app/(Console)/console/components/account-switcher";
import { Nav } from "@/app/(Console)/console/components/nav";
import { accounts } from "@/app/(Console)/console/data";
import { useState } from 'react';

const Layout = ({children}: {children: React.ReactNode}) => {
  const defaultLayout = [20, 32, 48],
    defaultCollapsed = false,
    navCollapsedSize = 4;
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <NextUIProvider className="bg-white h-screen max-h-screen text-black">
      <TooltipProvider delayDuration={0}>
        <ResizablePanelGroup
          direction="horizontal"
          onLayout={(sizes: number[]) => {
            document.cookie = `react-resizable-panels:layout:panel=${JSON.stringify(
              sizes
            )}`;
          }}
          className="h-full w-full items-stretch"
        >
          <ResizablePanel
            defaultSize={defaultLayout[0]}
            collapsedSize={navCollapsedSize}
            collapsible={true}
            minSize={10}
            maxSize={20}
            onCollapse={() => {
              setIsCollapsed(true);
              document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
                true
              )}`;
            }}
            onResize={() => {
              setIsCollapsed(false);
              document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
                false
              )}`;
            }}
            className={cn(
              isCollapsed && "min-w-[50px] transition-all duration-300 ease-in-out",
              'hidden md:block'
            )}
          >
            <div
              className={cn(
                "flex h-[52px] items-center justify-center",
                isCollapsed ? "h-[52px]" : "px-2"
              )}
            >
              <AccountSwitcher isCollapsed={isCollapsed} accounts={accounts} />
            </div>
            <Separator />
            <Nav
              isCollapsed={isCollapsed}
              links={[
                {
                  title: "پیام‌ها",
                  icon: Chat,
                  variant: "default",
                  href: "/console/chats",
                },
                {
                  title: "اکانت‌ها",
                  icon: User,
                  variant: "ghost",
                  href: "/console/accounts",
                },
              ]}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          {children}
        </ResizablePanelGroup>
      </TooltipProvider>
    </NextUIProvider>
  );
};

export default Layout;
