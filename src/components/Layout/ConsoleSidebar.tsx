"use client";

import { UserNamespace } from "@/types/user";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import useSWRImmutable from "swr/immutable";

import {
  LogoSlogan,
  LogoText,
  NavMain,
  NavUserSkeleton,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@components";
import {
  AddressBookIcon,
  BasketIcon,
  ChatsIcon,
  HouseIcon,
  SlidersIcon,
} from "@phosphor-icons/react";

const NavUser = dynamic(() => import("./NavUser"), {
  loading: () => <NavUserSkeleton />,
  ssr: false,
});

const generateData = (t: any, isMobile: boolean) => ({
  navMain: [
    {
      title: t("dashboard"),
      url: "/",
      icon: HouseIcon,
      isActive: true,
    },
    {
      title: t("contacts"),
      url: "/contacts",
      icon: AddressBookIcon,
      isActive: true,
    },
    {
      title: t("instagramConnections"),
      url: "#",
      icon: ChatsIcon,
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
    {
      title: t("settings"),
      url: "/settings",
      icon: SlidersIcon,
      isActive: true,
    },
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
        <div className="flex items-center gap-1.5">
          <LogoSlogan />
          <LogoText size="md" />
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
};
