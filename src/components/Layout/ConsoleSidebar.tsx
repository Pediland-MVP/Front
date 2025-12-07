"use client";

import useUser from "@/hooks/useUser";
import { useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";

import {
  AddressBookIcon,
  CubeIcon,
  HouseIcon,
  LifebuoyIcon,
  LightningIcon,
  ShoppingBagIcon,
  SlidersIcon,
} from "@phosphor-icons/react/dist/ssr";
import { LogoSlogan } from "../Global/LogoSlogan";
import { LogoText } from "../Global/LogoText";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "../ui";
import { NavMain } from "./NavMain";
import { NavUserSkeleton } from "./NavUser.skeleton";
import { UserDetailsCard } from "./UserDetailsCard";
import { cn } from "@/lib/utils";

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
      title: t("automations"),
      url: "/automations",
      icon: LightningIcon,
      isActive: true,
    },
    {
      title: t("contacts"),
      url: "/contacts",
      icon: AddressBookIcon,
      isActive: true,
    },
    {
      title: t("products"),
      url: "/products",
      icon: CubeIcon,
      isActive: true,
    },
    {
      title: t("ordersList"),
      url: "/orders",
      icon: ShoppingBagIcon,
      isActive: true,
    },

    // {
    //   title: t("instagramConnections"),
    //   url: "#",
    //   icon: ChatsIcon,
    //   isActive: false,
    //   items: [
    //     {
    //       title: t("directs"),
    //       url: "/directs",
    //     },
    //     {
    //       title: t("comments"),
    //       url: "/comments",
    //     },
    //     {
    //       title: t("automations"),
    //       url: "/automations",
    //     },
    //   ],
    // },
    // {
    //   title: t("shop"),
    //   url: "#",
    //   icon: BasketIcon,
    //   isActive: false,
    //   items: [
    //     {
    //       title: t("ordersList"),
    //       url: "/orders",
    //     },
    //     {
    //       title: t("products"),
    //       url: "/products",
    //     },
    //   ],
    // },
    {
      title: t("settings"),
      url: "/settings",
      icon: SlidersIcon,
      isActive: true,
    },
    {
      title: t("support"),
      url: "https://t.me/befroosh_support",
      icon: LifebuoyIcon,
      isActive: true,
      external: true,
    },
  ],
});

export const ConsoleSidebar = ({
  ...props
}: React.ComponentProps<typeof Sidebar>) => {
  const t = useTranslations("Console.Sidebar");
  const locale = useLocale();
  const { isMobile, toggleSidebar } = useSidebar();
  const data = generateData(t, isMobile);

  const {
    user: userData,
    error: userError,
    isLoading: userIsLoading,
  } = useUser();

  return (
    <Sidebar variant="inset" collapsible="offcanvas" {...props}>
      <SidebarHeader className="flex-row gap-2">
        <div
          className={cn("flex items-center gap-1.5", locale !== "fa" && "pl-2")}
        >
          {locale === "fa" && <LogoSlogan />}
          <LogoText size="md" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>

      <SidebarFooter>
        {/* <Suspense fallback={<NavUserSkeleton />}>
          <NavUser user={userData} isLoading={userIsLoading} />
        </Suspense> */}
        <UserDetailsCard />
      </SidebarFooter>
    </Sidebar>
  );
};
