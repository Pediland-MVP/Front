// src/components/layout/consoleSidebar.tsx
"use client";

import { UserNamespace } from "@/types/user";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Suspense } from "react";
import useSWRImmutable from "swr/immutable";

// UI Imports
import { SetupWarning } from "@/components/global/setupWarning";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  AddressBookTabsIcon,
  BasketIcon,
  ChatCircleTextIcon,
  HouseSimpleIcon,
  SlidersIcon,
} from "@phosphor-icons/react/dist/ssr";
import { NavMain, NavUserSkeleton } from "@components/index";

const NavUser = dynamic(() => import("./NavUser"), {
  loading: () => <NavUserSkeleton />,
  ssr: false,
});

const generateData = (t: any, isMobile: boolean) => ({
  navMain: [
    {
      title: t("dashboard"),
      url: "/",
      icon: HouseSimpleIcon,
      isActive: true,
    },
    {
      title: t("contacts"),
      url: "/contacts",
      icon: AddressBookTabsIcon,
      isActive: true,
    },
    {
      title: t("instagramConnections"),
      url: "#",
      icon: ChatCircleTextIcon,
      isActive: false,
      items: [
        {
          title: t("directs"),
          url: "/directs",
        },
        {
          title: t("comments"),
          url: "/comments",
        },
        {
          title: t("automations"),
          url: "/automations",
        },
      ],
    },

    {
      title: t("shop"),
      url: "#",
      icon: BasketIcon,
      isActive: false,
      items: [
        {
          title: t("ordersList"),
          url: "/orders",
        },
        {
          title: t("products"),
          url: "/products",
        },
      ],
    },
    ...(!isMobile
      ? [
          {
            title: t("settings"),
            url: "/settings",
            icon: SlidersIcon,
            isActive: true,
          },
        ]
      : [
          {
            title: t("settings"),
            url: "#",
            icon: SlidersIcon,
            isActive: false,
            items: [
              {
                title: t("accounts"),
                url: "/settings/instagram",
              },
              {
                title: t("cardToCard"),
                url: "/settings/card",
              },
              {
                title: t("zarinpal"),
                url: "/settings/zarinpal",
              },
              {
                title: t("upgrade"),
                url: "/settings/upgrade",
              },
            ],
          },
        ]),
  ],
});

export const ConsoleSidebar = ({
  ...props
}: React.ComponentProps<typeof Sidebar>) => {
  const t = useTranslations("Console.Sidebar");
  const { isMobile, toggleSidebar } = useSidebar();
  const data = generateData(t, isMobile);

  const {
    data: userData,
    error: userError,
    isLoading: userIsLoading,
  } = useSWRImmutable<UserNamespace.GET.User>(
    `${process.env.NEXT_PUBLIC_BACK_API_URL}/users/me`,
    {
      revalidateOnMount: true,
      refreshInterval: 30_000,
    },
  );

  return (
    <Sidebar variant="inset" collapsible="offcanvas" {...props}>
      <SidebarHeader className="flex-row gap-2">
        <Image
          src="/images/befroosh-logo.svg"
          alt="Befroosh App Logo"
          className="aspect-square"
          width={32}
          height={32}
        />
        <div className="flex items-center gap-1 truncate leading-tight">
          <h1 className="text-sidebar-foreground font-bold">{t("name")}</h1>
          <h2 className="text-sm">[{t("description")}]</h2>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>

      <SetupWarning />

      <SidebarFooter>
        <Suspense fallback={<NavUserSkeleton />}>
          <NavUser user={userData} isLoading={userIsLoading} />
        </Suspense>
      </SidebarFooter>
    </Sidebar>
  );
};
