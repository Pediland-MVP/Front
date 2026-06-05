// src/components/app-sidebar.tsx
"use client";

import * as React from "react";

// UI Imports
import logo from "@/assets/images/befroosh-logo.svg";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  // ChartPieSliceIcon,
  PlantIcon,
  UsersIcon,
  CreditCardIcon,
  GiftIcon,
  TagIcon,
  RobotIcon,
  ChatDotsIcon,
} from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";

// This is sample data.
export const navMainItems = [
  // {
  //   title: "داشبورد",
  //   url: "/",
  //   icon: ChartPieSliceIcon,
  // },
  {
    title: "مشتریان من",
    url: "/customers",
    icon: UsersIcon,
  },
  {
    title: "سرنخ‌های من",
    url: "/leads",
    icon: PlantIcon,
  },
  {
    title: "اشتراک‌ها",
    url: "/subscriptions",
    icon: CreditCardIcon,
  },
  {
    title: "کدهای رفرال",
    url: "/referral-codes",
    icon: GiftIcon,
  },
  {
    title: "کدهای تخفیف",
    url: "/discount-codes",
    icon: TagIcon,
  },
  {
    title: "هوش مصنوعی",
    url: "/aiagent",
    icon: RobotIcon,
  },
  {
    title: "اتوماسیون تلگرام",
    url: "/telegram-automation/chats",
    icon: ChatDotsIcon,
    children: [
      { title: "مستندات", url: "/telegram-automation/docs" },
      { title: "پرسش و پاسخ", url: "/telegram-automation/qa" },
      { title: "راهنماها", url: "/telegram-automation/guides" },
      { title: "چت‌ها", url: "/telegram-automation/chats" },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props} side="right" variant="inset" collapsible="offcanvas">
      <SidebarHeader className="flex-row gap-2">
        <Image
          src={logo}
          alt="logo"
          className="aspect-square"
          width={32}
          height={32}
        />
        <div className="flex items-center gap-1 truncate leading-tight">
          <h1 className="text-gradient text-[15px] font-bold">
            بفروش
          </h1>
          <h2 className="text-[13px] text-muted-foreground font-semibold">[پورتال مدیریت]</h2>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMainItems} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
