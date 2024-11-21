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
import { useTranslations } from "next-intl";

const generateData = (t: any) => ({
  user: {
    name: "پدرام قانع",
    email: "p.ghane@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: t('console'),
      url: "/console",
      icon: HouseSimple,
      isActive: true,
    },
    {
      title: t('contacts'),
      url: "/console/contacts",
      icon: AddressBookTabs,
      isActive: true,
    },
    {
      title: t('messages'),
      url: "#",
      icon: ChatCircleText,
      isActive: true,
      items: [
        {
          title: t('directs'),
          url: "/console/inbox",
        },
        {
          title: t('comments'),
          url: "/console/comments",
        },
      ],
    },
    {
      title: t('automations'),
      url: "/console/actions/content-cycle",
      icon: Lightning,
      isActive: true,
    },

    {
      title: t('settings'),
      url: "#",
      icon: Sliders,
      isActive: true,
      items: [
        {
          title: t('products'),
          url: "/console/products",
        },
        {
          title: t('accounts'),
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
})

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const t = useTranslations('General')
  const data = generateData(t)
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <div className="flex items-center p-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
            <Infinity size={22} weight="bold" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="font-bold">{t('App.name')}</span>
            <span className="text-xs">{t('App.description')}</span>
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
