// src/components/Layout/NavBottomProvider.tsx
"use client";

import { useSidebar } from "@/components/ui/sidebar";
import { NavBottom, NavItem } from "@/components/index";
import {
  DotsThreeIcon,
  StorefrontIcon,
  ShoppingBagOpenIcon,
  RobotIcon,
  TelegramLogoIcon,
  DotsThreeOutlineIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useTranslations } from "next-intl";

export const NavBottomProvider = () => {
  const { setOpenMobile } = useSidebar();
  const t = useTranslations("BottomNav");
  const items: NavItem[] = [
    {
      icon: <DotsThreeOutlineIcon />,
      label: <p>{t("menu")}</p>,
      href: "#",
      onClick: () => setOpenMobile(true),
    },
    {
      icon: <StorefrontIcon />,
      label: <p>{t("shop")}</p>,
      href: "/products",
    },
    {
      icon: <RobotIcon />,
      isMain: true,
      href: "/automations",
      label: <p>{t("automations")}</p>,
    },
    {
      icon: <ShoppingBagOpenIcon />,
      label: <p>{t("orders")}</p>,
      href: "/orders",
    },
    {
      icon: <TelegramLogoIcon />,
      label: <p>{t("support")}</p>,
      href: "https://T.me/+989360226688",
      target: "_blank",
    },
  ];

  return <NavBottom items={items} />;
};
