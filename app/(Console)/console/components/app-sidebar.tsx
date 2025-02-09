"use client";

import {
  AddressBookTabs, ChatCircleText,
  HouseSimple, Lightning, Sliders, Basket
} from "@phosphor-icons/react/dist/ssr";

import { NavMain } from "./nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader
} from "@/components/theme/ui/sidebar";
import { useTranslations } from "next-intl";
import Image from "next/image";
import useSWR from "swr";
import logger from "@/app/utils/logger";
import dynamic from "next/dynamic";
import { NavUserSkeleton } from "./nav-user.skeleton";
import { Suspense } from "react";
import useSWRImmutable from "swr/immutable";
import { UserNamespace } from "@/types/user";

const NavUser = dynamic(() => import("./nav-user"), {
  loading: () => <NavUserSkeleton />,
  ssr: false,
});

const generateData = (t: any) => ({
  navMain: [
    {
      title: t('dashboard'),
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
      title: t('instagramConnections'),
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
        {
          title: t('automations'),
          url: "/console/actions/content-cycle",
        },
      ],
    },

    {
      title: t('shop'),
      url: '#',
      icon: Basket,
      isActive: true,
      items: [
        {
          title: t('ordersList'),
          url: "/console/orders",
        },
        {
          title: t('products'),
          url: "/console/products",
        }
      ],
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
  const t = useTranslations('Console.Sidebar')
  const data = generateData(t)
  
  const {
    data: userData,
    error: userError,
    isLoading: userIsLoading,
  } = useSWRImmutable<UserNamespace.GET>(
    `${process.env.NEXT_PUBLIC_BACK_API_URL}/users/me`,
    {
      revalidateOnMount: true,
      refreshInterval: 30_000
    }
  );
  
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
            <span className="font-bold">{t('name')}</span>
            <span className="text-[13px]">{t('description')}</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>

      <SidebarFooter>
        <Suspense fallback={<NavUserSkeleton />}>
          <NavUser user={userData} isLoading={userIsLoading} />
        </Suspense>
      </SidebarFooter>
    </Sidebar>
  );
}
