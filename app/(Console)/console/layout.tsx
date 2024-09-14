"use client";

import * as React from "react";
import { TooltipProvider } from "@/registry/new-york/ui/tooltip";
import { NextUIProvider } from "@nextui-org/react";
import { Chat, User } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Separator } from "@/registry/new-york/ui/separator";
import { AccountSwitcher } from "@/app/(Console)/console/components/account-switcher";
import { Nav } from "@/app/(Console)/console/components/nav";
import { accounts } from "@/app/(Console)/console/data";
import { useState } from "react";
import { ChatCircleText, ChatsCircle, Gauge, PaperPlaneTilt, Robot } from "@phosphor-icons/react/dist/ssr";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const defaultCollapsed = false;
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    // <NextUIProvider className="bg-white h-full rounded-xl text-black">
    // <TooltipProvider delayDuration={0}>
    <div className="flex w-full ">
      <div>
        {/* <div className="flex h-[52px] items-center justify-center">
              <AccountSwitcher isCollapsed={isCollapsed} accounts={accounts} />
            </div> */}
        {/* <Separator /> */}
        <div className="h-full ml-12 z-50">
          {" "}
          <Nav
            links={[
              {
                title: "پیام‌ها",
                icon: ChatCircleText,
                variant: "default",
                href: "/console/chats",
              },
              // {
              //   title: "دشبورد",
              //   icon: Gauge,
              //   variant: "default",
              //   href: "/console/chats",
              // },
              {
                title: "ارسال همگانی",
                icon: Chat,
                variant: "ghost",
                href: "/console/sendAll",
              },
              {
                title: "اکانت‌ها",
                icon: PaperPlaneTilt,
                variant: "ghost",
                href: "/console/accounts",
              },
              {
                title: "چرخه محتوا",
                icon: Robot,
                variant: "ghost",
                href: "/console/contentCycle",
              },
            ]}
          />
        </div>
      </div>

      <main className="z-10 w-full">{children}</main>
    </div>
    // </TooltipProvider>
    // </NextUIProvider>
  );
};

export default Layout;
