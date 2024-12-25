"use client";

import * as React from "react";

import {
  AddressBookTabs, ChatCircleText,
  HouseSimple,
  Lifebuoy,
  Lightning,
  Note,
  Sliders,
  Infinity,
  Basket
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
import Image from "next/image";

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
      title: t('orders'),
      url: '/console/orders',
      icon: Basket,
      isActive: true,
      items: [
        {
          title: t('products'),
          url: "/console/products",
        },
      ],
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
      url: "/console/settings",
      icon: Sliders,
      isActive: true,
    },
  ],
})

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const t = useTranslations('General')
  const data = generateData(t)

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <div className="flex items-center p-2 gap-3">
          <div className="flex items-center justify-center">
            <Image
              src="/images/befroosh-logo.svg"
              alt="Befroosh App Logo"
              width={38}
              height={38}
              className="w-[38px] h-[38px]"
              priority
            />          </div>
          <div className="flex flex-col flex-1 text-left text-[15px] leading-snug">
            <span className="font-bold">{t('App.name')}</span>
            <span className="text-[13px]">{t('App.description')}</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
