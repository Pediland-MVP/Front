"use client";

import * as React from "react";

import {
  AddressBookTabs, ChatCircleText,
  HouseSimple,
  Lifebuoy,
  Lightning,
  Note,
  Sliders,
  Infinity
} from "@phosphor-icons/react/dist/ssr";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader
} from "@/components/theme/ui/sidebar";

const data = {
  user: {
    name: "پدرام قانع",
    email: "p.ghane@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "داشبورد",
      url: "/console",
      icon: HouseSimple,
      isActive: true,
    },
    {
      title: "ارتباطات",
      url: "/console/contacts",
      icon: AddressBookTabs,
      isActive: true,
    },
    {
      title: "پیام‌ها",
      url: "#",
      icon: ChatCircleText,
      isActive: true,
      items: [
        {
          title: "دایرکت‌ها",
          url: "/console/inbox",
        },
        {
          title: "کامنت‌ها",
          url: "/console/comments",
        },
      ],
    },
    {
      title: "اتوماسیون",
      url: "/console/actions/content-cycle",
      icon: Lightning,
      isActive: true,
    },

    {
      title: "تنظیمات",
      url: "#",
      icon: Sliders,
      isActive: true,
      items: [
        {
          title: "کالاها / خدمات",
          url: "/console/products",
        },
        {
          title: "اکانت‌ها",
          url: "/console/accounts",
        },
      ],
    },
  ],

  navSecondary: [
    {
      title: "پشتیبانی",
      url: "#",
      icon: Lifebuoy,
    },
    {
      title: "ثبت بازخورد",
      url: "#",
      icon: Note,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <div className="flex items-center p-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
            <Infinity size={22} weight="bold" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="font-bold">تـبـدیـل</span>
            <span className="text-xs">مدیریت مشتریان</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
