"use client";

import {
  AddressBookTabs, ChatCircleText,
  HouseSimple, Sliders, Basket,
  WarningCircle, Plug
} from "@phosphor-icons/react/dist/ssr";

import { NavMain } from "./nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar
} from "@/components/theme/ui/sidebar";
import { useTranslations } from "next-intl";
import Image from "next/image";
import dynamic from "next/dynamic";
import { NavUserSkeleton } from "./nav-user.skeleton";
import { Suspense } from "react";
import useSWRImmutable from "swr/immutable";
import { UserNamespace } from "@/types/user";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { StatsNamespace } from "@/types/stats";
import { fetcher } from "@/hooks/swr/fetcher";

const NavUser = dynamic(() => import("./nav-user"), {
  loading: () => <NavUserSkeleton />,
  ssr: false,
});

const generateData = (t: any, isMobile: boolean) => ({
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
      isActive: false,
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
      isActive: false,
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
    ...(!isMobile ? [{
      title: t('settings'),
      url: "/console/settings",
      icon: Sliders,
      isActive: true,
    }] : [
      {
        title: t('settings'),
        url: "#",
        icon: Sliders,
        isActive: false,
        items: [
          {
            title: t('accounts'),
            url: "/console/settings/accounts",
          },
          {
            title: t('cardToCard'),
            url: "/console/settings/cardToCard",
          },
          {
            title: t('zarinpal'),
            url: "/console/settings/zarinpal",
          },
          {
            title: t('upgrade'),
            url: "/console/settings/upgrade",
          },
        ],
      }
    ]),
  ],
})

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const t = useTranslations('Console.Sidebar');
  const { isMobile, toggleSidebar } = useSidebar();
  const data = generateData(t, isMobile);

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

  const {
    data: stats,
    error: statsError,
    isLoading: isStatsLoading,
  } = useSWRImmutable<StatsNamespace.Overall>(
    `${process.env.NEXT_PUBLIC_BACK_API_URL}/stats/overall`,
    fetcher
  );

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <div className="flex items-center p-2 pb-0 gap-3">
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

      {statsError?.data && statsError.data.code === 6 && (
        <div className="col-span-4 flex flex-col items-center justify-center gap-2 bg-red-500/90 text-white pt-2 p-3 mx-2 text-sm rounded-md">
          <div className="flex items-center xl:flex-col gap-2">
            <div><WarningCircle size={28} weight="duotone" /></div>
            <p className="">برای استفاده از امکانات بفروش، ابتدا لازم است که یک اکانت اینستاگرام به پنل خود متصل کنید.</p>
          </div>
          <Button className="w-full bg-sidebar hover:bg-blue-100 text-black" asChild><Link href={'/console/settings/accounts'} onClick={() => {
            if (isMobile) toggleSidebar();
          }}><Plug weight="duotone" />اتصال اکانت</Link></Button>
        </div>
      )}

      <SidebarFooter>
        <Suspense fallback={<NavUserSkeleton />}>
          <NavUser user={userData} isLoading={userIsLoading} />
        </Suspense>
      </SidebarFooter>
    </Sidebar>
  );
}
