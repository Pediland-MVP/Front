// src/components/app-sidebar.tsx
"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const t = useTranslations("Sidebar");

  const items = React.useMemo(() => [
    {
      title: t("myCustomers"),
      url: "/customers",
      icon: UsersIcon,
    },
    {
      title: t("myLeads"),
      url: "/leads",
      icon: PlantIcon,
    },
    {
      title: t("subscriptions"),
      url: "/subscriptions",
      icon: CreditCardIcon,
    },
    {
      title: t("referralCodes"),
      url: "/referral-codes",
      icon: GiftIcon,
    },
    {
      title: t("discountCodes"),
      url: "/discount-codes",
      icon: TagIcon,
    },
    {
      title: t("aiAgent"),
      url: "/aiagent",
      icon: RobotIcon,
    },
    {
      title: t("telegramAutomation"),
      url: "/telegram-automation/chats",
      icon: ChatDotsIcon,
      children: [
        { title: t("docs"), url: "/telegram-automation/docs" },
        { title: t("qa"), url: "/telegram-automation/qa" },
        { title: t("guides"), url: "/telegram-automation/guides" },
        { title: t("chats"), url: "/telegram-automation/chats" },
      ],
    },
  ], [t]);

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
            {t("befroosh")}
          </h1>
          <h2 className="text-[13px] text-muted-foreground font-semibold">{t("adminPortal")}</h2>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={items} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
